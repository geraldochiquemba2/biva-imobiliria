import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import compression from "compression";
import { storage } from "./storage";
import { db } from "./db";
import { visits } from "@shared/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { 
  insertPropertySchema, 
  searchPropertySchema,
  insertUserSchema,
  loginSchema,
  insertContractSchema,
  insertVisitSchema,
  insertProposalSchema,
  insertPaymentSchema,
  insertVirtualTourSchema,
  insertTourRoomSchema,
  insertTourHotspotSchema,
  insertAdvertisementSchema,
  type Contract
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import session from "express-session";
import multer from "multer";
import { generateRentalContract } from "./contractGenerator";
import { uploadImage, getImage } from "./objectStorage";
import crypto from "crypto";

// Extend Express session type
declare module 'express-session' {
  interface SessionData {
    userId: string;
    userTypes: string[];
  }
}

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Autenticação necessária" });
  }
  next();
}

// Helper to check if user has a specific role
function hasRole(session: any, role: string): boolean {
  const userTypes = session.userTypes || [];
  return userTypes.includes(role);
}

// Role-based authorization middleware
function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Autenticação necessária" });
    }
    const userTypes = req.session.userTypes || [];
    const hasAnyRole = roles.some(role => userTypes.includes(role));
    if (!hasAnyRole) {
      return res.status(403).json({ error: "Acesso negado" });
    }
    next();
  };
}

// Configure Multer for image uploads (memory storage - base64)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
    files: 10 // max 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Use JPEG, PNG ou WebP.'));
    }
  }
});

// Helper function to auto-complete visits that are more than 1 day old
async function getVisitsWithAutoComplete() {
  const now = new Date();
  const oneDayInMs = 24 * 60 * 60 * 1000;
  let allVisits: any[] = [];
  let currentPage = 1;
  let hasMore = true;
  
  // Fetch all visits by paginating through them
  while (hasMore) {
    const paginatedVisits = await storage.listVisits({ page: currentPage, limit: 100, status: 'agendada' });
    
    for (const visit of paginatedVisits.data) {
      if (visit.scheduledDateTime) {
        const visitDate = new Date(visit.scheduledDateTime);
        const timeSinceVisit = now.getTime() - visitDate.getTime();
        
        // If visit was more than 1 day ago, mark as completed
        if (timeSinceVisit > oneDayInMs) {
          await storage.updateVisit(visit.id, { status: 'concluida' });
          visit.status = 'concluida';
        }
      }
    }
    
    allVisits = allVisits.concat(paginatedVisits.data);
    hasMore = currentPage < paginatedVisits.totalPages;
    currentPage++;
  }
  
  return allVisits;
}

// Cache control middleware for GET requests
function cacheControl(maxAge: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET') {
      res.set('Cache-Control', `private, max-age=${maxAge}`);
    }
    next();
  };
}

// ETag middleware for efficient caching
function generateETag(data: any): string {
  const hash = crypto.createHash('md5');
  hash.update(JSON.stringify(data));
  return `"${hash.digest('hex')}"`;
}

function etagMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  const originalJson = res.json.bind(res);
  res.json = function(data: any) {
    const etag = generateETag(data);
    res.set('ETag', etag);
    
    const clientETag = req.headers['if-none-match'];
    if (clientETag && clientETag === etag) {
      return res.status(304).end();
    }
    
    return originalJson(data);
  };
  
  next();
}

// Rate limiting middleware to prevent abuse
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  
  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    
    setInterval(() => this.cleanup(), windowMs);
  }
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);
    
    if (!entry || now > entry.resetTime) {
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }
    
    if (entry.count >= this.maxRequests) {
      return false;
    }
    
    entry.count++;
    return true;
  }
  
  private cleanup() {
    const now = Date.now();
    const keys = Array.from(this.limits.keys());
    keys.forEach(key => {
      const entry = this.limits.get(key);
      if (entry && now > entry.resetTime) {
        this.limits.delete(key);
      }
    });
  }
}

const rateLimiter = new RateLimiter(200, 60000);

function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const identifier = req.ip || req.socket.remoteAddress || 'unknown';
  
  if (!rateLimiter.isAllowed(identifier)) {
    return res.status(429).json({ 
      error: "Muitas requisições. Tente novamente em alguns instantes." 
    });
  }
  
  next();
}

// In-memory cache for frequently accessed data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  set<T>(key: string, data: T, ttlSeconds: number = 120): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      // Exact match or prefix match with colon separator
      if (key === pattern || key.startsWith(pattern + ':')) {
        this.cache.delete(key);
      }
    });
  }
  
  invalidateExact(key: string): void {
    this.cache.delete(key);
  }
  
  size(): number {
    return this.cache.size;
  }
}

const memoryCache = new MemoryCache();

// Função de warm-up do cache - pré-carrega dados populares no cache
export async function warmupCache(): Promise<void> {
  console.log('[Cache] Iniciando warm-up do cache...');
  const startTime = Date.now();
  
  try {
    // Pré-carregar lista de propriedades aprovadas (primeira página)
    const propertiesPromise = storage.listProperties({ 
      page: 1, 
      limit: 20,
      status: 'disponivel'
    }).then(async (properties) => {
      memoryCache.set('properties:list:1', properties, 600);
      
      // Pré-carregar detalhes completos de cada propriedade em paralelo
      if (properties.data && Array.isArray(properties.data)) {
        const detailPromises = properties.data.slice(0, 10).map(async (prop: any) => {
          try {
            const fullProperty = await storage.getProperty(prop.id);
            if (fullProperty) {
              memoryCache.set(`property:${prop.id}`, fullProperty, 1800);
            }
          } catch (err: any) {
            console.error(`[Cache] Erro ao pré-carregar propriedade ${prop.id}:`, err.message);
          }
        });
        await Promise.all(detailPromises);
      }
      return properties;
    }).catch(err => {
      console.error('[Cache] Erro ao pré-carregar propriedades:', err.message);
    });

    // Pré-carregar propriedades em destaque
    const featuredPromise = storage.listProperties({ featured: true }).then(featured => {
      memoryCache.set('properties:featured', featured, 600);
      return featured;
    }).catch(err => {
      console.error('[Cache] Erro ao pré-carregar destaques:', err.message);
    });

    // Pré-carregar anúncios ativos
    const advertisementsPromise = storage.listActiveAdvertisements().then(ads => {
      memoryCache.set('advertisements:active', ads, 600);
      return ads;
    }).catch(err => {
      console.error('[Cache] Erro ao pré-carregar anúncios:', err.message);
    });

    // Aguardar todas as operações de warm-up
    await Promise.all([propertiesPromise, featuredPromise, advertisementsPromise]);
    
    const duration = Date.now() - startTime;
    console.log(`[Cache] Warm-up concluído em ${duration}ms - Cache com ${memoryCache.size()} entradas`);
  } catch (error) {
    console.error('[Cache] Erro durante warm-up:', error);
  }
}

// Clear old cache entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const keys = Array.from(memoryCache['cache'].keys());
  keys.forEach(key => {
    const entry = memoryCache['cache'].get(key);
    if (entry && (now - entry.timestamp > entry.ttl)) {
      memoryCache['cache'].delete(key);
    }
  });
}, 5 * 60 * 1000);

// Auto-complete old visits every 30 minutes instead of on every request
setInterval(async () => {
  try {
    await getVisitsWithAutoComplete();
    console.log('Auto-completed old visits successfully');
  } catch (error) {
    console.error('Error auto-completing visits:', error);
  }
}, 30 * 60 * 1000);

export async function registerRoutes(app: Express): Promise<Server> {
  // Trust proxy to get correct IP addresses (required for Render)
  app.set('trust proxy', 1);

  // Enable rate limiting globally
  app.use(rateLimitMiddleware);

  // Enable HTTP compression for faster responses
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Balance between speed and compression ratio
    threshold: 1024, // Only compress responses > 1KB
  }));

  // Enable ETag support for efficient caching
  app.use(etagMiddleware);

  // Health check endpoint for keep-alive
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'biva-secret-key-development',
    resave: false,
    saveUninitialized: false,
    proxy: true, // Trust the Render proxy
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  }));

  // Auth Routes
  
  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists by phone
      const existingUser = await storage.getUserByPhone(userData.phone);
      if (existingUser) {
        return res.status(400).json({ error: "Número de telefone já cadastrado" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Generate username from phone (remove +244 prefix and use as username)
      const username = userData.phone.replace('+244', 'user_');
      
      // Create user with all required fields
      const user = await storage.createUser({
        fullName: userData.fullName,
        phone: userData.phone,
        userTypes: userData.userTypes,
        password: hashedPassword,
        username,
        email: userData.email,
        sms: userData.sms || null,
        bi: userData.bi,
        address: userData.address,
        profileImage: userData.profileImage || null,
      });
      
      // Set session
      req.session.userId = user.id;
      req.session.userTypes = user.userTypes;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error registering user:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Falha ao criar usuário" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      
      // Find user by phone
      const user = await storage.getUserByPhone(credentials.phone);
      if (!user) {
        return res.status(401).json({ error: "Número de telefone ou senha incorretos" });
      }
      
      // Check if user is blocked
      if (user.status === 'bloqueado') {
        return res.status(403).json({ error: "Sua conta foi bloqueada. Entre em contato com o administrador." });
      }
      
      // Verify password
      const validPassword = await bcrypt.compare(credentials.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Número de telefone ou senha incorretos" });
      }
      
      // Update last login time
      await storage.updateUser(user.id, { lastLoginAt: new Date() } as any);
      
      // Set session
      req.session.userId = user.id;
      req.session.userTypes = user.userTypes;
      
      // Return user without password (with updated lastLoginAt)
      const updatedUser = { ...user, lastLoginAt: new Date() };
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error logging in:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Falha ao fazer login" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Falha ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const cacheKey = `user:${userId}`;
      
      // Check cache first
      let user = memoryCache.get<any>(cacheKey);
      
      if (!user) {
        // If not in cache, fetch from database
        user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "Usuário não encontrado" });
        }
        
        // Cache user for 15 minutes
        memoryCache.set(cacheKey, user, 900);
      }
      
      // Check if user is blocked
      if (user.status === 'bloqueado') {
        // Invalidate cache and destroy session for blocked users
        memoryCache.invalidateExact(`user:${userId}`);
        req.session.destroy(() => {});
        return res.status(403).json({ error: "Sua conta foi bloqueada. Entre em contato com o administrador." });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(500).json({ error: "Falha ao buscar usuário" });
    }
  });

  // Update user profile
  app.patch("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      
      // Don't allow changing userType or password through this endpoint
      delete updates.userType;
      delete updates.password;
      delete updates.id;
      
      const user = await storage.updateUser(req.session.userId!, updates);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Invalidate user cache after update
      memoryCache.invalidateExact(`user:${req.session.userId}`);
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: "Falha ao atualizar perfil" });
    }
  });

  // Change user password
  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Nova senha deve ter no mínimo 6 caracteres" });
      }
      
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Senha atual incorreta" });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(req.session.userId!, { password: hashedPassword } as any);
      
      memoryCache.invalidateExact(`user:${req.session.userId}`);
      
      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ error: "Falha ao alterar senha" });
    }
  });

  // Admin reset user password
  app.post("/api/users/:id/reset-password", requireRole('admin'), async (req, res) => {
    try {
      const { newPassword } = req.body;
      const userId = req.params.id;
      
      if (!newPassword) {
        return res.status(400).json({ error: "Nova senha é obrigatória" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Nova senha deve ter no mínimo 6 caracteres" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(userId, { password: hashedPassword } as any);
      
      memoryCache.invalidateExact(`user:${userId}`);
      
      res.json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ error: "Falha ao redefinir senha" });
    }
  });

  // Get all users (admin only)
  app.get("/api/users", requireRole('admin'), async (req, res) => {
    try {
      const users = await storage.listUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Error listing users:', error);
      res.status(500).json({ error: "Falha ao buscar usuários" });
    }
  });

  // Get single user (admin only)
  app.get("/api/users/:id", requireRole('admin'), async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({ error: "Falha ao buscar usuário" });
    }
  });

  // Update user status - block/unblock (admin only)
  app.patch("/api/users/:id/status", requireRole('admin'), async (req, res) => {
    try {
      const { status } = req.body;
      
      if (!['ativo', 'bloqueado'].includes(status)) {
        return res.status(400).json({ error: "Status inválido. Use 'ativo' ou 'bloqueado'" });
      }

      // Don't allow blocking self
      if (req.params.id === req.session.userId) {
        return res.status(403).json({ error: "Você não pode bloquear sua própria conta" });
      }
      
      const user = await storage.updateUser(req.params.id, { status });
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Invalidate user cache after status change (critical for blocked users)
      memoryCache.invalidateExact(`user:${req.params.id}`);
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ error: "Falha ao atualizar status do usuário" });
    }
  });

  // Get user's saved signature (authenticated user only - their own signature)
  app.get("/api/auth/signature", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      res.json({ savedSignature: user.savedSignature || null });
    } catch (error) {
      console.error('Error getting saved signature:', error);
      res.status(500).json({ error: "Falha ao buscar assinatura salva" });
    }
  });

  // Save user's signature (authenticated user only - their own signature)
  app.post("/api/auth/signature", requireAuth, async (req, res) => {
    try {
      const { signatureImage } = req.body;
      
      if (!signatureImage) {
        return res.status(400).json({ error: "Assinatura é obrigatória" });
      }

      // Validate that it's a base64 image
      if (!signatureImage.startsWith('data:image/')) {
        return res.status(400).json({ error: "Formato de assinatura inválido" });
      }
      
      const user = await storage.updateUser(req.session.userId!, { 
        savedSignature: signatureImage 
      });
      
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      res.json({ 
        message: "Assinatura salva com sucesso",
        savedSignature: user.savedSignature 
      });
    } catch (error) {
      console.error('Error saving signature:', error);
      res.status(500).json({ error: "Falha ao salvar assinatura" });
    }
  });

  // Delete user's saved signature (authenticated user only - their own signature)
  app.delete("/api/auth/signature", requireAuth, async (req, res) => {
    try {
      const user = await storage.updateUser(req.session.userId!, { 
        savedSignature: null 
      });
      
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      res.json({ message: "Assinatura removida com sucesso" });
    } catch (error) {
      console.error('Error deleting signature:', error);
      res.status(500).json({ error: "Falha ao remover assinatura" });
    }
  });

  // Property Routes
  
  // Get all properties with optional filters
  app.get("/api/properties", cacheControl(600), async (req, res) => {
    try {
      const searchParams = searchPropertySchema.parse({
        type: req.query.type,
        category: req.query.category,
        location: req.query.location,
        bairro: req.query.bairro,
        municipio: req.query.municipio,
        provincia: req.query.provincia,
        bedrooms: req.query.bedrooms ? Number(req.query.bedrooms) : undefined,
        livingRooms: req.query.livingRooms ? Number(req.query.livingRooms) : undefined,
        kitchens: req.query.kitchens ? Number(req.query.kitchens) : undefined,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
        shortTerm: req.query.shortTerm === 'true' ? true : req.query.shortTerm === 'false' ? false : undefined,
        status: req.query.status as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      
      const fieldsParam = req.query.fields as string | undefined;
      const isCardProjection = fieldsParam === 'card';
      
      const cacheKey = isCardProjection 
        ? `properties:card:${JSON.stringify(searchParams)}`
        : `properties:${JSON.stringify(searchParams)}`;
      
      const cachedResult = memoryCache.get(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult);
      }
      
      const paginatedResult = await storage.listProperties(searchParams);
      
      if (isCardProjection) {
        const cardData = paginatedResult.data.map(property => ({
          id: property.id,
          title: property.title,
          price: property.price,
          type: property.type,
          category: property.category,
          status: property.status,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area: property.area,
          featured: property.featured,
          shortTerm: property.shortTerm,
          bairro: property.bairro,
          municipio: property.municipio,
          provincia: property.provincia,
          thumbnail: (property as any).thumbnail || null,
        }));
        
        const result = {
          data: cardData,
          total: paginatedResult.total,
          page: paginatedResult.page,
          limit: paginatedResult.limit,
          totalPages: paginatedResult.totalPages,
        };
        
        memoryCache.set(cacheKey, result, 300);
        return res.json(result);
      }
      
      const propertyIds = paginatedResult.data.map(p => p.id);
      const activeVisitsByProperty = new Map();
      
      if (propertyIds.length > 0) {
        const activeVisitsQuery = await db
          .select({ propertyId: visits.propertyId })
          .from(visits)
          .where(
            and(
              inArray(visits.propertyId, propertyIds),
              eq(visits.status, 'agendada')
            )
          );
        
        activeVisitsQuery.forEach((v: { propertyId: string }) => {
          activeVisitsByProperty.set(v.propertyId, true);
        });
      }
      
      const propertiesWithEditInfo = paginatedResult.data.map(property => {
        const hasActiveVisits = activeVisitsByProperty.get(property.id) || false;
        const isRented = property.status === 'arrendado';
        const canEdit = !hasActiveVisits && !isRented;
        
        return {
          ...property,
          hasActiveVisits,
          isRented,
          canEdit
        };
      });
      
      const result = {
        data: propertiesWithEditInfo,
        total: paginatedResult.total,
        page: paginatedResult.page,
        limit: paginatedResult.limit,
        totalPages: paginatedResult.totalPages,
      };
      
      memoryCache.set(cacheKey, result, 300);
      
      res.json(result);
    } catch (error) {
      console.error('Error listing properties:', error);
      res.status(400).json({ error: "Parâmetros de busca inválidos" });
    }
  });

  // Get featured properties
  app.get("/api/properties/featured", cacheControl(600), async (req, res) => {
    try {
      // Check cache first
      const cacheKey = 'properties:featured';
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      const properties = await storage.listProperties({ featured: true });
      
      // Cache for 10 minutes
      memoryCache.set(cacheKey, properties, 600);
      
      res.json(properties);
    } catch (error) {
      console.error('Error getting featured properties:', error);
      res.status(500).json({ error: "Falha ao buscar imóveis em destaque" });
    }
  });

  // Get pending properties (admin only) - MUST BE BEFORE :id route
  app.get("/api/properties/pending", requireRole('admin'), async (req, res) => {
    try {
      const properties = await storage.getPendingProperties();
      res.json(properties);
    } catch (error) {
      console.error('Error getting pending properties:', error);
      res.status(500).json({ error: "Falha ao buscar imóveis pendentes" });
    }
  });

  // Get single property
  app.get("/api/properties/:id", cacheControl(300), async (req, res) => {
    try {
      const cacheKey = `property:${req.params.id}`;
      
      // Check cache first
      let property = memoryCache.get<any>(cacheKey);
      
      if (!property) {
        property = await storage.getProperty(req.params.id);
        if (!property) {
          return res.status(404).json({ error: "Imóvel não encontrado" });
        }
        
        // Cache for 30 minutes
        memoryCache.set(cacheKey, property, 1800);
      }
      
      if (property.owner) {
        const { password, ...ownerWithoutPassword } = property.owner;
        res.json({ 
          ...property, 
          owner: ownerWithoutPassword
        });
      } else {
        res.json(property);
      }
    } catch (error) {
      console.error('Error getting property:', error);
      res.status(500).json({ error: "Falha ao buscar imóvel" });
    }
  });

  // Get property images (lazy loading)
  app.get("/api/properties/:id/images", cacheControl(300), async (req, res) => {
    try {
      const images = await storage.getPropertyImages(req.params.id);
      if (!images) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }
      res.json({ images });
    } catch (error) {
      console.error('Error getting property images:', error);
      res.status(500).json({ error: "Falha ao buscar imagens do imóvel" });
    }
  });

  // Serve images from Object Storage
  app.get("/api/storage/properties/:filename", cacheControl(86400), async (req, res) => {
    try {
      const filename = `properties/${req.params.filename}`;
      const imageBuffer = await getImage(filename);

      if (!imageBuffer) {
        return res.status(404).json({ error: "Imagem não encontrada" });
      }

      // Detect content type from filename
      const ext = req.params.filename.split('.').pop()?.toLowerCase();
      let contentType = 'image/jpeg';
      if (ext === 'png') contentType = 'image/png';
      else if (ext === 'webp') contentType = 'image/webp';
      else if (ext === 'gif') contentType = 'image/gif';

      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year for immutable assets
      res.send(imageBuffer);
    } catch (error) {
      console.error('Error serving image:', error);
      res.status(500).json({ error: "Erro ao carregar imagem" });
    }
  });

  // Upload property images (proprietarios and corretores only)
  app.post("/api/properties/upload", requireRole('proprietario', 'corretor'), upload.array('images', 10), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: "Nenhuma imagem foi enviada" });
      }

      const uploadedUrls: string[] = [];
      const errors: string[] = [];

      for (const file of req.files as Express.Multer.File[]) {
        const result = await uploadImage(file.buffer, file.originalname, file.mimetype);
        
        if (result.success && result.url) {
          // If it's a base64 data URL, use as-is. Otherwise, create full URL with protocol and host
          const fullUrl = result.url.startsWith('data:') 
            ? result.url 
            : `${req.protocol}://${req.get('host')}${result.url}`;
          uploadedUrls.push(fullUrl);
        } else {
          errors.push(result.error || 'Erro desconhecido');
        }
      }

      if (uploadedUrls.length === 0) {
        return res.status(500).json({ 
          error: "Nenhuma imagem foi carregada com sucesso",
          details: errors
        });
      }

      res.status(200).json({ 
        success: true, 
        urls: uploadedUrls,
        count: uploadedUrls.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: "Arquivo muito grande. Tamanho máximo: 5 MB" });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: "Número máximo de arquivos: 10" });
        }
      }
      res.status(500).json({ error: "Falha ao fazer upload das imagens" });
    }
  });

  // Create new property (proprietarios and corretores only)
  app.post("/api/properties", requireRole('proprietario', 'corretor'), async (req, res) => {
    try {
      const propertyData = insertPropertySchema.parse(req.body);
      
      // Proprietarios must use their own ID as ownerId
      if (hasRole(req.session, 'proprietario') && propertyData.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Você só pode criar imóveis para si mesmo" });
      }
      
      const property = await storage.createProperty(propertyData);
      res.status(201).json(property);
    } catch (error) {
      console.error('Error creating property:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados do imóvel inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Falha ao criar imóvel" });
    }
  });

  // Update property
  app.patch("/api/properties/:id", requireRole('proprietario', 'corretor'), async (req, res) => {
    try {
      // Check ownership
      const existingProperty = await storage.getProperty(req.params.id);
      if (!existingProperty) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }
      
      // Proprietarios can only update their own properties
      if (hasRole(req.session, 'proprietario') && existingProperty.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Você só pode atualizar seus próprios imóveis" });
      }
      
      // Check if property has active scheduled visits
      const propertyVisits = await storage.getVisitsByProperty(req.params.id, { status: 'agendada', limit: 1 });
      const hasActiveVisits = propertyVisits.data.length > 0;
      
      // Check if property is rented
      const isRented = existingProperty.status === 'arrendado';
      
      // Proprietarios cannot edit properties with active visits or that are rented
      if (hasRole(req.session, 'proprietario')) {
        if (hasActiveVisits) {
          return res.status(403).json({ 
            error: "Não é possível editar imóvel com visitas confirmadas",
            reason: "hasActiveVisits"
          });
        }
        if (isRented) {
          return res.status(403).json({ 
            error: "Não é possível editar imóvel que está arrendado",
            reason: "isRented"
          });
        }
      }
      
      const updates = req.body;
      
      // Prevent changing ownership
      delete updates.ownerId;
      
      // Validate that images are data URLs (base64) if provided
      if (updates.images && Array.isArray(updates.images)) {
        for (const imgUrl of updates.images) {
          // Images should now be data URLs starting with 'data:image/'
          if (!imgUrl.startsWith('data:image/')) {
            return res.status(400).json({ error: "Formato de imagem inválido. Use data URLs." });
          }
        }
      }
      
      // If property was rejected and acknowledged, reset to pending for re-approval
      if (existingProperty.approvalStatus === 'recusado' && existingProperty.rejectionAcknowledged) {
        updates.approvalStatus = 'pendente';
        updates.rejectionMessage = null;
        updates.rejectionAcknowledged = false;
      }
      
      const property = await storage.updateProperty(req.params.id, updates);
      
      // Invalidate cache for this property
      memoryCache.invalidateExact(`property:${req.params.id}`);
      memoryCache.invalidate('properties');
      
      res.json(property);
    } catch (error) {
      console.error('Error updating property:', error);
      res.status(500).json({ error: "Falha ao atualizar imóvel" });
    }
  });

  // Delete property
  app.delete("/api/properties/:id", requireRole('proprietario', 'corretor'), async (req, res) => {
    try {
      // Check ownership
      const existingProperty = await storage.getProperty(req.params.id);
      if (!existingProperty) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }
      
      // Proprietarios can only delete their own properties
      if (hasRole(req.session, 'proprietario') && existingProperty.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Você só pode deletar seus próprios imóveis" });
      }
      
      // Check if property has active scheduled visits
      const propertyVisits = await storage.getVisitsByProperty(req.params.id, { status: 'agendada', limit: 1 });
      const hasActiveVisits = propertyVisits.data.length > 0;
      
      // Check if property is rented
      const isRented = existingProperty.status === 'arrendado';
      
      // Proprietarios cannot delete properties with active visits or that are rented
      if (hasRole(req.session, 'proprietario')) {
        if (hasActiveVisits) {
          return res.status(403).json({ 
            error: "Não é possível eliminar imóvel com visitas confirmadas",
            reason: "hasActiveVisits"
          });
        }
        if (isRented) {
          return res.status(403).json({ 
            error: "Não é possível eliminar imóvel que está arrendado",
            reason: "isRented"
          });
        }
      }
      
      const success = await storage.deleteProperty(req.params.id);
      
      // Invalidate cache for this property
      memoryCache.invalidateExact(`property:${req.params.id}`);
      memoryCache.invalidate('properties');
      memoryCache.invalidateExact(`virtual-tour-property:${req.params.id}`);
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting property:', error);
      res.status(500).json({ error: "Falha ao deletar imóvel" });
    }
  });

  // Get properties by user
  app.get("/api/users/:userId/properties", requireAuth, cacheControl(120), async (req, res) => {
    try {
      // Users can only see their own properties, unless they're admin
      if (!hasRole(req.session, 'admin') && req.params.userId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const properties = await storage.getUserProperties(req.params.userId);
      
      // Optimize: Only check active visits for the user's properties
      const propertyIds = properties.map(p => p.id);
      const activeVisitsByProperty = new Map();
      
      if (propertyIds.length > 0) {
        // Batch query to check for active visits only for user's properties
        const activeVisitsQuery = await db
          .select({ propertyId: visits.propertyId })
          .from(visits)
          .where(
            and(
              inArray(visits.propertyId, propertyIds),
              eq(visits.status, 'agendada')
            )
          );
        
        activeVisitsQuery.forEach((v: { propertyId: string }) => {
          activeVisitsByProperty.set(v.propertyId, true);
        });
      }
      
      // Add edit information to each property
      const propertiesWithEditInfo = properties.map(property => {
        const hasActiveVisits = activeVisitsByProperty.get(property.id) || false;
        const isRented = property.status === 'arrendado';
        const canEdit = !hasActiveVisits && !isRented;
        
        return {
          ...property,
          hasActiveVisits,
          isRented,
          canEdit
        };
      });
      
      res.json(propertiesWithEditInfo);
    } catch (error) {
      console.error('Error getting user properties:', error);
      res.status(500).json({ error: "Falha ao buscar imóveis do usuário" });
    }
  });

  // Property Approval Routes
  
  // Approve property (admin only)
  app.post("/api/properties/:id/approve", requireRole('admin'), async (req, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }

      if (property.approvalStatus !== 'pendente') {
        return res.status(400).json({ error: "Este imóvel não está pendente de aprovação" });
      }

      const updatedProperty = await storage.approveProperty(req.params.id);
      
      // Invalidate cache for this property
      memoryCache.invalidateExact(`property:${req.params.id}`);
      memoryCache.invalidate('properties');
      
      // Send notification to property owner
      await storage.createNotification({
        userId: property.ownerId,
        type: 'property_approved',
        title: 'Imóvel Aprovado',
        message: `O seu imóvel "${property.title}" foi aprovado e está agora publicado.`,
        entityId: property.id,
      });

      res.json(updatedProperty);
    } catch (error) {
      console.error('Error approving property:', error);
      res.status(500).json({ error: "Falha ao aprovar imóvel" });
    }
  });

  // Reject property (admin only)
  app.post("/api/properties/:id/reject", requireRole('admin'), async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || message.trim() === '') {
        return res.status(400).json({ error: "Mensagem de rejeição é obrigatória" });
      }

      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }

      if (property.approvalStatus !== 'pendente') {
        return res.status(400).json({ error: "Este imóvel não está pendente de aprovação" });
      }

      const updatedProperty = await storage.rejectProperty(req.params.id, message);
      
      // Invalidate cache for this property
      memoryCache.invalidateExact(`property:${req.params.id}`);
      memoryCache.invalidate('properties');
      
      // Send notification to property owner
      await storage.createNotification({
        userId: property.ownerId,
        type: 'property_rejected',
        title: 'Imóvel Recusado',
        message: `O seu imóvel "${property.title}" foi recusado. Por favor, veja a mensagem do administrador e faça as correções necessárias.`,
        entityId: property.id,
      });

      res.json(updatedProperty);
    } catch (error) {
      console.error('Error rejecting property:', error);
      res.status(500).json({ error: "Falha ao recusar imóvel" });
    }
  });

  // Acknowledge rejection (property owner only)
  app.post("/api/properties/:id/acknowledge-rejection", requireAuth, async (req, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }

      // Only the property owner can acknowledge
      if (property.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      if (property.approvalStatus !== 'recusado') {
        return res.status(400).json({ error: "Este imóvel não foi recusado" });
      }

      if (property.rejectionAcknowledged) {
        return res.status(400).json({ error: "Rejeição já reconhecida" });
      }

      const updatedProperty = await storage.acknowledgeRejection(req.params.id);
      res.json(updatedProperty);
    } catch (error) {
      console.error('Error acknowledging rejection:', error);
      res.status(500).json({ error: "Falha ao reconhecer rejeição" });
    }
  });

  // Virtual Tour Routes
  
  // Create a virtual tour for a property
  app.post("/api/virtual-tours", requireRole('proprietario', 'corretor', 'admin'), async (req, res) => {
    try {
      const tourData = insertVirtualTourSchema.parse(req.body);
      
      // Get property to verify ownership
      const property = await storage.getProperty(tourData.propertyId);
      if (!property) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }
      
      // Verify ownership (proprietarios can only create tours for their own properties)
      if (hasRole(req.session, 'proprietario') && !hasRole(req.session, 'corretor') && !hasRole(req.session, 'admin') && property.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Você só pode criar tours para seus próprios imóveis" });
      }
      
      // Check if tour already exists for this property
      const existingTour = await storage.getVirtualTourByProperty(tourData.propertyId);
      if (existingTour) {
        return res.status(400).json({ error: "Já existe um tour virtual para este imóvel" });
      }
      
      const tour = await storage.createVirtualTour(tourData);
      
      // Invalidate cache for this property's virtual tour (remove not-found cache)
      memoryCache.invalidateExact(`virtual-tour-property:${tourData.propertyId}`);
      
      res.json(tour);
    } catch (error) {
      console.error('Error creating virtual tour:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Falha ao criar tour virtual" });
    }
  });
  
  // Get virtual tour by property ID
  app.get("/api/virtual-tours/property/:propertyId", cacheControl(3600), async (req, res) => {
    try {
      const cacheKey = `virtual-tour-property:${req.params.propertyId}`;
      const cachedData = memoryCache.get<any>(cacheKey);
      
      if (cachedData && cachedData.__notFound) {
        return res.status(404).json({ error: "Tour virtual não encontrado" });
      }
      
      if (cachedData) {
        return res.json(cachedData);
      }
      
      const tour = await storage.getVirtualTourByProperty(req.params.propertyId);
      if (!tour) {
        memoryCache.set(cacheKey, { __notFound: true }, 600);
        return res.status(404).json({ error: "Tour virtual não encontrado" });
      }
      memoryCache.set(cacheKey, tour, 3600);
      res.json(tour);
    } catch (error) {
      console.error('Error getting virtual tour:', error);
      res.status(500).json({ error: "Falha ao buscar tour virtual" });
    }
  });
  
  // Get virtual tour by ID
  app.get("/api/virtual-tours/:id", cacheControl(300), async (req, res) => {
    try {
      const tour = await storage.getVirtualTour(req.params.id);
      if (!tour) {
        return res.status(404).json({ error: "Tour virtual não encontrado" });
      }
      res.json(tour);
    } catch (error) {
      console.error('Error getting virtual tour:', error);
      res.status(500).json({ error: "Falha ao buscar tour virtual" });
    }
  });
  
  // Update virtual tour
  app.patch("/api/virtual-tours/:id", requireRole('proprietario', 'corretor', 'admin'), async (req, res) => {
    try {
      const tour = await storage.getVirtualTour(req.params.id);
      if (!tour) {
        return res.status(404).json({ error: "Tour virtual não encontrado" });
      }
      
      // Get property to verify ownership
      const property = await storage.getProperty(tour.propertyId);
      if (!property) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }
      
      // Verify ownership
      if (hasRole(req.session, 'proprietario') && !hasRole(req.session, 'corretor') && !hasRole(req.session, 'admin') && property.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Você só pode editar tours dos seus próprios imóveis" });
      }
      
      const updatedTour = await storage.updateVirtualTour(req.params.id, req.body);
      
      // Invalidate cache for this virtual tour
      memoryCache.invalidateExact(`virtual-tour-property:${tour.propertyId}`);
      
      res.json(updatedTour);
    } catch (error) {
      console.error('Error updating virtual tour:', error);
      res.status(500).json({ error: "Falha ao atualizar tour virtual" });
    }
  });
  
  // Delete virtual tour
  app.delete("/api/virtual-tours/:id", requireRole('proprietario', 'corretor', 'admin'), async (req, res) => {
    try {
      const tour = await storage.getVirtualTour(req.params.id);
      if (!tour) {
        return res.status(404).json({ error: "Tour virtual não encontrado" });
      }
      
      // Get property to verify ownership
      const property = await storage.getProperty(tour.propertyId);
      if (!property) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }
      
      // Verify ownership
      if (hasRole(req.session, 'proprietario') && !hasRole(req.session, 'corretor') && !hasRole(req.session, 'admin') && property.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Você só pode deletar tours dos seus próprios imóveis" });
      }
      
      await storage.deleteVirtualTour(req.params.id);
      
      // Invalidate cache for this virtual tour
      memoryCache.invalidateExact(`virtual-tour-property:${tour.propertyId}`);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting virtual tour:', error);
      res.status(500).json({ error: "Falha ao deletar tour virtual" });
    }
  });
  
  // Add a room to a tour
  app.post("/api/virtual-tours/:tourId/rooms", requireRole('proprietario', 'corretor', 'admin'), upload.single('image'), async (req, res) => {
    try {
      const tour = await storage.getVirtualTour(req.params.tourId);
      if (!tour) {
        return res.status(404).json({ error: "Tour virtual não encontrado" });
      }
      
      // Get property to verify ownership
      const property = await storage.getProperty(tour.propertyId);
      if (!property) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }
      
      // Verify ownership
      if (hasRole(req.session, 'proprietario') && !hasRole(req.session, 'corretor') && !hasRole(req.session, 'admin') && property.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Você só pode adicionar cômodos aos tours dos seus próprios imóveis" });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: "Imagem 360° é obrigatória" });
      }
      
      // Convert image to base64
      const imageBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      const roomData = {
        tourId: req.params.tourId,
        name: req.body.name || 'Cômodo sem nome',
        image: imageBase64,
        orderIndex: parseInt(req.body.orderIndex) || 0,
      };
      
      const room = await storage.createTourRoom(roomData);
      res.json(room);
    } catch (error) {
      console.error('Error adding room to tour:', error);
      res.status(500).json({ error: "Falha ao adicionar cômodo ao tour" });
    }
  });
  
  // Update a room
  app.patch("/api/tour-rooms/:id", requireRole('proprietario', 'corretor', 'admin'), upload.single('image'), async (req, res) => {
    try {
      const roomData: any = {
        name: req.body.name,
        orderIndex: req.body.orderIndex !== undefined ? parseInt(req.body.orderIndex) : undefined,
      };
      
      // If new image is uploaded, convert to base64
      if (req.file) {
        roomData.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      }
      
      const updatedRoom = await storage.updateTourRoom(req.params.id, roomData);
      if (!updatedRoom) {
        return res.status(404).json({ error: "Cômodo não encontrado" });
      }
      
      res.json(updatedRoom);
    } catch (error) {
      console.error('Error updating room:', error);
      res.status(500).json({ error: "Falha ao atualizar cômodo" });
    }
  });
  
  // Delete a room
  app.delete("/api/tour-rooms/:id", requireRole('proprietario', 'corretor', 'admin'), async (req, res) => {
    try {
      // Delete all hotspots associated with this room first
      await storage.deleteHotspotsByRoom(req.params.id);
      
      // Delete the room
      const success = await storage.deleteTourRoom(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Cômodo não encontrado" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting room:', error);
      res.status(500).json({ error: "Falha ao deletar cômodo" });
    }
  });
  
  // Add a hotspot to a room
  app.post("/api/tour-hotspots", requireRole('proprietario', 'corretor', 'admin'), async (req, res) => {
    try {
      const hotspotData = insertTourHotspotSchema.parse(req.body);
      const hotspot = await storage.createTourHotspot(hotspotData);
      res.json(hotspot);
    } catch (error) {
      console.error('Error creating hotspot:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Falha ao criar hotspot" });
    }
  });
  
  // Update a hotspot
  app.patch("/api/tour-hotspots/:id", requireRole('proprietario', 'corretor', 'admin'), async (req, res) => {
    try {
      const updatedHotspot = await storage.updateTourHotspot(req.params.id, req.body);
      if (!updatedHotspot) {
        return res.status(404).json({ error: "Hotspot não encontrado" });
      }
      res.json(updatedHotspot);
    } catch (error) {
      console.error('Error updating hotspot:', error);
      res.status(500).json({ error: "Falha ao atualizar hotspot" });
    }
  });
  
  // Delete a hotspot
  app.delete("/api/tour-hotspots/:id", requireRole('proprietario', 'corretor', 'admin'), async (req, res) => {
    try {
      const success = await storage.deleteTourHotspot(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Hotspot não encontrado" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting hotspot:', error);
      res.status(500).json({ error: "Falha ao deletar hotspot" });
    }
  });

  // Contract Routes
  
  // Create rental contract (proprietario)
  app.post("/api/contracts/create-rental", requireRole('proprietario', 'corretor'), async (req, res) => {
    try {
      const { propertyId, clientePhone, valor, dataInicio, dataFim } = req.body;
      
      // Validate required fields
      if (!propertyId || !clientePhone || !valor || !dataInicio || !dataFim) {
        return res.status(400).json({ error: "Dados incompletos" });
      }
      
      // Get property
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }
      
      // Check if property is short-term rental
      if (property.shortTerm) {
        return res.status(400).json({ 
          error: "Imóveis de curta duração não permitem contratos formais. Este tipo de imóvel é destinado para arrendamentos temporários sem contrato." 
        });
      }
      
      // Verify ownership (proprietarios can only create contracts for their own properties)
      if (hasRole(req.session, 'proprietario') && !hasRole(req.session, 'corretor') && property.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Você só pode criar contratos para seus próprios imóveis" });
      }
      
      // Check for existing contracts on this property
      const existingContracts = await storage.getContractsByProperty(propertyId);
      
      // For rental properties, check if there's an active or non-expired contract
      const now = new Date();
      const hasActiveRentalContract = existingContracts.some(contract => {
        if (contract.tipo === 'arrendamento') {
          // Check if contract is active or hasn't expired yet
          if (contract.status === 'ativo' || contract.status === 'pendente_assinaturas') {
            // If dataFim exists and is in the future, contract is still valid
            if (contract.dataFim && new Date(contract.dataFim) > now) {
              return true;
            }
          }
        }
        return false;
      });
      
      if (hasActiveRentalContract) {
        return res.status(400).json({ 
          error: "Já existe um contrato de arrendamento ativo para este imóvel. Só é possível gerar um novo contrato após o término do prazo atual." 
        });
      }
      
      // Check if property was sold
      const hasSaleContract = existingContracts.some(contract => 
        contract.tipo === 'venda' && contract.status === 'ativo'
      );
      
      if (hasSaleContract) {
        return res.status(400).json({ 
          error: "Este imóvel já foi vendido e não pode mais ser arrendado pelo proprietário anterior." 
        });
      }
      
      // Get proprietario (owner)
      const proprietario = await storage.getUser(property.ownerId);
      if (!proprietario) {
        return res.status(404).json({ error: "Proprietário não encontrado" });
      }
      
      // Verify proprietario has BI
      if (!proprietario.bi) {
        return res.status(400).json({ error: "O proprietário deve fornecer o número de BI/Passaporte primeiro" });
      }
      
      // Normalize phone number - try with and without +244 prefix
      let normalizedPhone = clientePhone.trim();
      
      // Remove all spaces and special characters except +
      normalizedPhone = normalizedPhone.replace(/[\s\-\(\)]/g, '');
      
      // If doesn't start with +, try adding +244
      if (!normalizedPhone.startsWith('+')) {
        normalizedPhone = '+244' + normalizedPhone;
      }
      
      // Find cliente by phone - try normalized version first
      let cliente = await storage.getUserByPhone(normalizedPhone);
      
      // If not found, try original phone
      if (!cliente) {
        cliente = await storage.getUserByPhone(clientePhone);
      }
      
      // If still not found, try without +244 prefix
      if (!cliente && normalizedPhone.startsWith('+244')) {
        const phoneWithoutPrefix = normalizedPhone.substring(4);
        cliente = await storage.getUserByPhone(phoneWithoutPrefix);
      }
      
      if (!cliente) {
        return res.status(404).json({ error: "Cliente não encontrado. O cliente deve estar cadastrado na plataforma." });
      }
      
      // Generate contract content
      const contractContent = generateRentalContract(
        property,
        proprietario,
        cliente,
        parseFloat(valor),
        new Date(dataInicio),
        new Date(dataFim)
      );
      
      // Create contract
      const contract = await storage.createContract({
        propertyId,
        proprietarioId: property.ownerId,
        clienteId: cliente.id,
        tipo: 'arrendamento',
        valor: valor.toString(),
        dataInicio: new Date(dataInicio),
        dataFim: new Date(dataFim),
        status: 'pendente_assinaturas',
        contractContent,
      });
      
      // Invalidate contract caches
      memoryCache.invalidate('contracts');
      
      res.status(201).json(contract);
    } catch (error) {
      console.error('Error creating rental contract:', error);
      res.status(500).json({ error: "Falha ao criar contrato de arrendamento" });
    }
  });

  // List all contracts (admin only)
  app.get("/api/contracts", requireRole('admin'), async (req, res) => {
    try {
      const contracts = await storage.listContracts();
      res.json(contracts);
    } catch (error) {
      console.error('Error listing contracts:', error);
      res.status(500).json({ error: "Falha ao buscar contratos" });
    }
  });
  
  // Get contract by ID
  app.get("/api/contracts/:id", requireAuth, async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ error: "Contrato não encontrado" });
      }
      
      // Admin can see all contracts, users can only see their own
      const isAdmin = hasRole(req.session, 'admin');
      if (!isAdmin && 
          contract.clienteId !== req.session.userId && 
          contract.proprietarioId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      res.json(contract);
    } catch (error) {
      console.error('Error getting contract:', error);
      res.status(500).json({ error: "Falha ao buscar contrato" });
    }
  });

  // Get contracts by user (returns contracts where user is client or owner)
  app.get("/api/users/:userId/contracts", requireAuth, cacheControl(90), async (req, res) => {
    try {
      // Admin can see all user contracts, users can only see their own
      const isAdmin = hasRole(req.session, 'admin');
      if (!isAdmin && req.params.userId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const cacheKey = `contracts:user:${req.params.userId}`;
      
      // Check cache first
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      const contracts = await storage.getContractsByUser(req.params.userId);
      
      // Cache for 1.5 minutes
      memoryCache.set(cacheKey, contracts, 90);
      
      res.json(contracts);
    } catch (error) {
      console.error('Error getting user contracts:', error);
      res.status(500).json({ error: "Falha ao buscar contratos do usuário" });
    }
  });

  // Get contracts by property
  app.get("/api/properties/:propertyId/contracts", requireAuth, async (req, res) => {
    try {
      // Verify user has access to this property
      const property = await storage.getProperty(req.params.propertyId);
      if (!property) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }
      
      // Admin can see all property contracts, only property owner otherwise
      const isAdmin = hasRole(req.session, 'admin');
      if (!isAdmin && property.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const contracts = await storage.getContractsByProperty(req.params.propertyId);
      res.json(contracts);
    } catch (error) {
      console.error('Error getting property contracts:', error);
      res.status(500).json({ error: "Falha ao buscar contratos do imóvel" });
    }
  });

  // Create new contract (corretor only)
  app.post("/api/contracts", requireRole('corretor'), async (req, res) => {
    try {
      const contractData = insertContractSchema.parse(req.body);
      
      // Check for existing contracts on this property
      const existingContracts = await storage.getContractsByProperty(contractData.propertyId);
      
      // For sale contracts, check if there's already any sale contract
      if (contractData.tipo === 'venda') {
        const hasSaleContract = existingContracts.some(contract => 
          contract.tipo === 'venda' && 
          (contract.status === 'ativo' || contract.status === 'pendente_assinaturas')
        );
        
        if (hasSaleContract) {
          return res.status(400).json({ 
            error: "Já existe um contrato de venda para este imóvel. Só é possível gerar um contrato de venda por propriedade." 
          });
        }
      }
      
      // For rental contracts, check if there's an active or non-expired contract
      if (contractData.tipo === 'arrendamento') {
        const now = new Date();
        const hasActiveRentalContract = existingContracts.some(contract => {
          if (contract.tipo === 'arrendamento') {
            if (contract.status === 'ativo' || contract.status === 'pendente_assinaturas') {
              if (contract.dataFim && new Date(contract.dataFim) > now) {
                return true;
              }
            }
          }
          return false;
        });
        
        if (hasActiveRentalContract) {
          return res.status(400).json({ 
            error: "Já existe um contrato de arrendamento ativo para este imóvel. Só é possível gerar um novo contrato após o término do prazo atual." 
          });
        }
      }
      
      const contract = await storage.createContract(contractData);
      
      // Update property status
      if (contractData.tipo === 'venda') {
        await storage.updateProperty(contractData.propertyId, { status: 'vendido' });
      } else {
        await storage.updateProperty(contractData.propertyId, { status: 'arrendado' });
      }
      
      // Invalidate contract and property caches
      memoryCache.invalidate('contracts');
      memoryCache.invalidate('properties');
      
      res.status(201).json(contract);
    } catch (error) {
      console.error('Error creating contract:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados do contrato inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Falha ao criar contrato" });
    }
  });

  // Cancel contract
  app.post("/api/contracts/:id/cancel", requireAuth, async (req, res) => {
    try {
      const contractId = req.params.id;
      
      // Get contract
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contrato não encontrado" });
      }
      
      // Check if user is part of this contract
      const userId = req.session.userId!;
      if (contract.proprietarioId !== userId && contract.clienteId !== userId && !hasRole(req.session, 'corretor') && !hasRole(req.session, 'admin')) {
        return res.status(403).json({ error: "Você não está autorizado a cancelar este contrato" });
      }
      
      // Only allow cancellation if contract is not yet active
      if (contract.status === 'ativo') {
        return res.status(400).json({ error: "Não é possível cancelar um contrato ativo" });
      }
      
      if (contract.status === 'cancelado' || contract.status === 'encerrado') {
        return res.status(400).json({ error: "Este contrato já foi cancelado ou encerrado" });
      }
      
      // Update contract status to cancelled
      const updatedContract = await storage.updateContract(contractId, { status: 'cancelado' });
      
      // Invalidate contract caches
      memoryCache.invalidate('contracts');
      
      res.json(updatedContract);
    } catch (error) {
      console.error('Error cancelling contract:', error);
      res.status(500).json({ error: "Falha ao cancelar contrato" });
    }
  });

  // Update contract (corretor only)
  app.patch("/api/contracts/:id", requireRole('corretor'), async (req, res) => {
    try {
      const updates = req.body;
      const contract = await storage.updateContract(req.params.id, updates);
      if (!contract) {
        return res.status(404).json({ error: "Contrato não encontrado" });
      }
      
      // Invalidate contract caches
      memoryCache.invalidate('contracts');
      
      res.json(contract);
    } catch (error) {
      console.error('Error updating contract:', error);
      res.status(500).json({ error: "Falha ao atualizar contrato" });
    }
  });

  // Sign contract
  app.post("/api/contracts/:id/sign", requireAuth, async (req, res) => {
    try {
      const { bi, signatureImage } = req.body;
      const contractId = req.params.id;
      
      if (!bi) {
        return res.status(400).json({ error: "Número de BI/Passaporte é obrigatório" });
      }
      
      if (!signatureImage) {
        return res.status(400).json({ error: "Imagem da assinatura é obrigatória" });
      }
      
      // Validate signature is a valid base64 image
      if (!signatureImage.startsWith('data:image/')) {
        return res.status(400).json({ error: "Formato de assinatura inválido. Por favor, tente desenhar ou fazer upload novamente." });
      }
      
      // Get contract
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contrato não encontrado" });
      }
      
      // Check if user is part of this contract
      const userId = req.session.userId!;
      if (contract.proprietarioId !== userId && contract.clienteId !== userId) {
        return res.status(403).json({ error: "Você não está autorizado a assinar este contrato" });
      }
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // If user doesn't have BI in profile, update it automatically
      if (!user.bi) {
        await storage.updateUser(userId, { bi });
      } else {
        // If user already has BI, verify it matches
        if (user.bi !== bi) {
          return res.status(400).json({ error: "O número de BI/Passaporte não corresponde ao cadastrado no seu perfil" });
        }
      }
      
      // Update signature based on user role in contract
      const updates: Partial<Contract> = {};
      
      if (contract.proprietarioId === userId && !contract.proprietarioSignedAt) {
        updates.proprietarioSignedAt = new Date();
        updates.proprietarioSignature = signatureImage;
      } else if (contract.clienteId === userId && !contract.clienteSignedAt) {
        updates.clienteSignedAt = new Date();
        updates.clienteSignature = signatureImage;
      } else {
        return res.status(400).json({ error: "Este contrato já foi assinado por você" });
      }
      
      // Update contract
      const updatedContract = await storage.updateContract(contractId, updates);
      
      res.json(updatedContract);
    } catch (error) {
      console.error('Error signing contract:', error);
      res.status(500).json({ error: "Falha ao assinar contrato" });
    }
  });

  // Confirm contract signature
  app.post("/api/contracts/:id/confirm", requireAuth, async (req, res) => {
    try {
      const contractId = req.params.id;
      
      // Get contract
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contrato não encontrado" });
      }
      
      // Check if user is part of this contract
      const userId = req.session.userId!;
      if (contract.proprietarioId !== userId && contract.clienteId !== userId) {
        return res.status(403).json({ error: "Você não está autorizado a confirmar este contrato" });
      }
      
      // Update confirmation based on user role in contract
      const updates: Partial<Contract> = {};
      
      if (contract.proprietarioId === userId) {
        if (!contract.proprietarioSignedAt) {
          return res.status(400).json({ error: "Você precisa assinar o contrato antes de confirmar" });
        }
        if (contract.proprietarioConfirmedAt) {
          return res.status(400).json({ error: "Você já confirmou este contrato" });
        }
        updates.proprietarioConfirmedAt = new Date();
      } else if (contract.clienteId === userId) {
        if (!contract.clienteSignedAt) {
          return res.status(400).json({ error: "Você precisa assinar o contrato antes de confirmar" });
        }
        if (contract.clienteConfirmedAt) {
          return res.status(400).json({ error: "Você já confirmou este contrato" });
        }
        updates.clienteConfirmedAt = new Date();
      }
      
      // Update contract
      const updatedContract = await storage.updateContract(contractId, updates);
      
      // Check if both parties have confirmed
      if (updatedContract && updatedContract.proprietarioConfirmedAt && updatedContract.clienteConfirmedAt) {
        // Both confirmed - activate contract and update property status
        await storage.updateContract(contractId, { status: 'ativo' });
        const propertyStatus = contract.tipo === 'venda' ? 'vendido' : 'arrendado';
        
        // If it's a sale contract, transfer property ownership to the buyer
        if (contract.tipo === 'venda') {
          await storage.updateProperty(contract.propertyId, { 
            status: propertyStatus,
            ownerId: contract.clienteId  // Transfer ownership to buyer
          });
        } else {
          await storage.updateProperty(contract.propertyId, { status: propertyStatus });
        }
      }
      
      res.json(updatedContract);
    } catch (error) {
      console.error('Error confirming contract:', error);
      res.status(500).json({ error: "Falha ao confirmar contrato" });
    }
  });

  // Visit Routes
  
  // Get visits (returns only user's own visits - as client or owner)
  // Note: Even corretores see only their own visits here. Use admin endpoints for full access.
  app.get("/api/visits", requireAuth, cacheControl(60), async (req, res) => {
    try {
      const userId = req.session.userId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string | undefined;
      
      const cacheKey = `visits:user:${userId}:page:${page}:limit:${limit}:status:${status || 'all'}`;
      
      // Check cache first
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      // Fetch user-specific visits with pagination (client + owner visits)
      const params = { page, limit, status };
      const clientVisits = await storage.getVisitsByClient(userId, params);
      const ownerVisits = await storage.getVisitsByOwner(userId, params);
      
      // Merge results, avoiding duplicates
      const visitIds = new Set<string>();
      const visits = [];
      
      // Add all client visits
      for (const visit of clientVisits.data) {
        if (!visitIds.has(visit.id)) {
          visitIds.add(visit.id);
          visits.push(visit);
        }
      }
      
      // Add all owner visits (avoiding duplicates)
      for (const visit of ownerVisits.data) {
        if (!visitIds.has(visit.id)) {
          visitIds.add(visit.id);
          visits.push(visit);
        }
      }
      
      // Sort by creation date (most recent first)
      visits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Calculate combined total
      const total = clientVisits.total + ownerVisits.total - visits.length;
      const totalPages = Math.ceil(total / limit);
      
      const result = {
        data: visits,
        total,
        page,
        limit,
        totalPages,
      };
      
      // Cache for 1 minute
      memoryCache.set(cacheKey, result, 60);
      
      res.json(result);
    } catch (error) {
      console.error('Error listing visits:', error);
      res.status(500).json({ error: "Falha ao buscar visitas" });
    }
  });

  // Get visit by ID
  app.get("/api/visits/:id", requireAuth, async (req, res) => {
    try {
      const visit = await storage.getVisit(req.params.id);
      if (!visit) {
        return res.status(404).json({ error: "Visita não encontrada" });
      }
      
      // Users can only see their own visits, unless they're corretor or property owner
      if (!hasRole(req.session, 'corretor') && visit.clienteId !== req.session.userId) {
        const property = await storage.getProperty(visit.propertyId);
        if (!property || property.ownerId !== req.session.userId) {
          return res.status(403).json({ error: "Acesso negado" });
        }
      }
      
      res.json(visit);
    } catch (error) {
      console.error('Error getting visit:', error);
      res.status(500).json({ error: "Falha ao buscar visita" });
    }
  });

  // Get visits by client
  app.get("/api/users/:clienteId/visits", requireAuth, cacheControl(60), async (req, res) => {
    try {
      // Users can only see their own visits, unless they're corretor
      if (!hasRole(req.session, 'corretor') && req.params.clienteId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string | undefined;
      
      const cacheKey = `visits:client:${req.params.clienteId}:page:${page}:limit:${limit}:status:${status || 'all'}`;
      
      // Check cache first
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      const visits = await storage.getVisitsByClient(req.params.clienteId, { page, limit, status });
      
      // Cache for 1 minute
      memoryCache.set(cacheKey, visits, 60);
      
      res.json(visits);
    } catch (error) {
      console.error('Error getting client visits:', error);
      res.status(500).json({ error: "Falha ao buscar visitas do cliente" });
    }
  });

  // Get visits by property
  app.get("/api/properties/:propertyId/visits", requireAuth, cacheControl(60), async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string | undefined;
      
      const cacheKey = `visits:property:${req.params.propertyId}:page:${page}:limit:${limit}:status:${status || 'all'}`;
      
      // Check cache first
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      // Verify user has access to this property
      const property = await storage.getProperty(req.params.propertyId);
      if (!property) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }
      
      if (!hasRole(req.session, 'corretor') && property.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const visits = await storage.getVisitsByProperty(req.params.propertyId, { page, limit, status });
      
      // Cache for 1 minute
      memoryCache.set(cacheKey, visits, 60);
      
      res.json(visits);
    } catch (error) {
      console.error('Error getting property visits:', error);
      res.status(500).json({ error: "Falha ao buscar visitas do imóvel" });
    }
  });

  // Create new visit
  app.post("/api/visits", requireAuth, async (req, res) => {
    try {
      const visitData = insertVisitSchema.parse(req.body);
      
      // Clientes must use their own ID
      if (hasRole(req.session, 'cliente') && visitData.clienteId !== req.session.userId) {
        return res.status(403).json({ error: "Você só pode agendar visitas para si mesmo" });
      }
      
      // Check if user already has a pending/active visit for this property
      const existingVisit = await storage.getVisitByClientAndProperty(visitData.clienteId, visitData.propertyId);
      if (existingVisit && ['pendente_proprietario', 'pendente_cliente', 'agendada'].includes(existingVisit.status)) {
        return res.status(400).json({ error: "Você já possui uma visita ativa para este imóvel" });
      }
      
      // Set default values
      const newVisit = {
        ...visitData,
        status: 'pendente_proprietario' as const,
        lastActionBy: 'cliente' as const,
      };
      
      const visit = await storage.createVisit(newVisit);
      
      // Invalidate visit caches
      memoryCache.invalidate('visits');
      
      // Get property to notify owner
      const property = await storage.getProperty(visit.propertyId);
      if (property) {
        const client = await storage.getUser(visit.clienteId);
        await storage.createNotification({
          userId: property.ownerId,
          type: 'visit_requested',
          title: 'Nova solicitação de visita',
          message: `${client?.fullName} solicitou uma visita para ${property.title}`,
          entityId: visit.id,
        });
      }
      
      res.status(201).json(visit);
    } catch (error) {
      console.error('Error creating visit:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados da visita inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Falha ao agendar visita" });
    }
  });

  // Update visit
  app.patch("/api/visits/:id", requireAuth, async (req, res) => {
    try {
      const existingVisit = await storage.getVisit(req.params.id);
      if (!existingVisit) {
        return res.status(404).json({ error: "Visita não encontrada" });
      }
      
      // Users can only update their own visits (as client or property owner)
      if (existingVisit.clienteId !== req.session.userId) {
        const property = await storage.getProperty(existingVisit.propertyId);
        if (!property || property.ownerId !== req.session.userId) {
          return res.status(403).json({ error: "Acesso negado" });
        }
      }
      
      const updates = req.body;
      const visit = await storage.updateVisit(req.params.id, updates);
      
      // Invalidate visit caches
      memoryCache.invalidate('visits');
      
      res.json(visit);
    } catch (error) {
      console.error('Error updating visit:', error);
      res.status(500).json({ error: "Falha ao atualizar visita" });
    }
  });

  // Owner response to visit request (accept, reject, or propose new date)
  app.post("/api/visits/:id/owner-response", requireAuth, async (req, res) => {
    try {
      const visit = await storage.getVisit(req.params.id);
      if (!visit) {
        return res.status(404).json({ error: "Visita não encontrada" });
      }
      
      const property = await storage.getProperty(visit.propertyId);
      if (!property || property.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Apenas o proprietário pode responder a esta visita" });
      }
      
      const { action, proposedDateTime, message } = req.body;
      
      if (action === 'accept') {
        const updatedVisit = await storage.updateVisit(visit.id, {
          status: 'agendada',
          scheduledDateTime: visit.ownerProposedDateTime || visit.requestedDateTime,
          lastActionBy: 'proprietario',
          ownerMessage: message,
        });
        
        await storage.createNotification({
          userId: visit.clienteId,
          type: 'visit_confirmed',
          title: 'Visita confirmada!',
          message: `Sua visita foi confirmada pelo proprietário`,
          entityId: visit.id,
        });
        
        // Invalidate visit caches
        memoryCache.invalidate('visits');
        
        return res.json(updatedVisit);
      }
      
      if (action === 'reject') {
        const updatedVisit = await storage.updateVisit(visit.id, {
          status: 'recusada',
          lastActionBy: 'proprietario',
          ownerMessage: message,
        });
        
        await storage.createNotification({
          userId: visit.clienteId,
          type: 'visit_owner_response',
          title: 'Visita recusada',
          message: `O proprietário recusou sua solicitação de visita`,
          entityId: visit.id,
        });
        
        // Invalidate visit caches
        memoryCache.invalidate('visits');
        
        return res.json(updatedVisit);
      }
      
      if (action === 'propose' && proposedDateTime) {
        const updatedVisit = await storage.updateVisit(visit.id, {
          status: 'pendente_cliente',
          ownerProposedDateTime: new Date(proposedDateTime),
          lastActionBy: 'proprietario',
          ownerMessage: message,
        });
        
        await storage.createNotification({
          userId: visit.clienteId,
          type: 'visit_owner_response',
          title: 'Nova data proposta',
          message: `O proprietário propôs uma nova data para a visita`,
          entityId: visit.id,
        });
        
        // Invalidate visit caches
        memoryCache.invalidate('visits');
        
        return res.json(updatedVisit);
      }
      
      return res.status(400).json({ error: "Ação inválida" });
    } catch (error) {
      console.error('Error in owner response:', error);
      res.status(500).json({ error: "Falha ao processar resposta" });
    }
  });

  // Client response to owner's proposal
  app.post("/api/visits/:id/client-response", requireAuth, async (req, res) => {
    try {
      const visit = await storage.getVisit(req.params.id);
      if (!visit) {
        return res.status(404).json({ error: "Visita não encontrada" });
      }
      
      if (visit.clienteId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const { action, proposedDateTime, message } = req.body;
      
      if (action === 'accept') {
        const updatedVisit = await storage.updateVisit(visit.id, {
          status: 'agendada',
          scheduledDateTime: visit.ownerProposedDateTime || visit.requestedDateTime,
          lastActionBy: 'cliente',
          clientMessage: message,
        });
        
        const property = await storage.getProperty(visit.propertyId);
        if (property) {
          await storage.createNotification({
            userId: property.ownerId,
            type: 'visit_confirmed',
            title: 'Visita confirmada!',
            message: `O cliente aceitou a data proposta`,
            entityId: visit.id,
          });
        }
        
        // Invalidate visit caches
        memoryCache.invalidate('visits');
        
        return res.json(updatedVisit);
      }
      
      if (action === 'reject') {
        const updatedVisit = await storage.updateVisit(visit.id, {
          status: 'recusada',
          lastActionBy: 'cliente',
          clientMessage: message,
        });
        
        const property = await storage.getProperty(visit.propertyId);
        if (property) {
          await storage.createNotification({
            userId: property.ownerId,
            type: 'visit_client_response',
            title: 'Visita recusada',
            message: `O cliente recusou a data proposta`,
            entityId: visit.id,
          });
        }
        
        // Invalidate visit caches
        memoryCache.invalidate('visits');
        
        return res.json(updatedVisit);
      }
      
      if (action === 'propose' && proposedDateTime) {
        const updatedVisit = await storage.updateVisit(visit.id, {
          status: 'pendente_proprietario',
          requestedDateTime: new Date(proposedDateTime),
          lastActionBy: 'cliente',
          clientMessage: message,
        });
        
        const property = await storage.getProperty(visit.propertyId);
        if (property) {
          await storage.createNotification({
            userId: property.ownerId,
            type: 'visit_client_response',
            title: 'Nova data proposta',
            message: `O cliente propôs uma nova data para a visita`,
            entityId: visit.id,
          });
        }
        
        // Invalidate visit caches
        memoryCache.invalidate('visits');
        
        return res.json(updatedVisit);
      }
      
      return res.status(400).json({ error: "Ação inválida" });
    } catch (error) {
      console.error('Error in client response:', error);
      res.status(500).json({ error: "Falha ao processar resposta" });
    }
  });

  // Delete visit
  app.delete("/api/visits/:id", requireAuth, async (req, res) => {
    try {
      const existingVisit = await storage.getVisit(req.params.id);
      if (!existingVisit) {
        return res.status(404).json({ error: "Visita não encontrada" });
      }
      
      // Users can only delete their own visits (as client or property owner)
      if (existingVisit.clienteId !== req.session.userId) {
        const property = await storage.getProperty(existingVisit.propertyId);
        if (!property || property.ownerId !== req.session.userId) {
          return res.status(403).json({ error: "Acesso negado" });
        }
      }
      
      const success = await storage.deleteVisit(req.params.id);
      
      // Invalidate visit caches
      memoryCache.invalidate('visits');
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting visit:', error);
      res.status(500).json({ error: "Falha ao deletar visita" });
    }
  });

  // Proposal Routes
  
  // Get proposal by ID
  app.get("/api/proposals/:id", requireAuth, async (req, res) => {
    try {
      const proposal = await storage.getProposal(req.params.id);
      if (!proposal) {
        return res.status(404).json({ error: "Proposta não encontrada" });
      }
      
      // Users can only see their own proposals (as client or property owner)
      if (proposal.clienteId !== req.session.userId) {
        const property = await storage.getProperty(proposal.propertyId);
        if (!property || property.ownerId !== req.session.userId) {
          return res.status(403).json({ error: "Acesso negado" });
        }
      }
      
      res.json(proposal);
    } catch (error) {
      console.error('Error getting proposal:', error);
      res.status(500).json({ error: "Falha ao buscar proposta" });
    }
  });

  // Get proposals by client
  app.get("/api/users/:clienteId/proposals", requireAuth, cacheControl(60), async (req, res) => {
    try {
      // Users can only see their own proposals
      if (req.params.clienteId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const cacheKey = `proposals:client:${req.params.clienteId}`;
      
      // Check cache first
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      const proposals = await storage.getProposalsByClient(req.params.clienteId);
      
      // Cache for 1 minute
      memoryCache.set(cacheKey, proposals, 60);
      
      res.json(proposals);
    } catch (error) {
      console.error('Error getting client proposals:', error);
      res.status(500).json({ error: "Falha ao buscar propostas do cliente" });
    }
  });

  // Get proposals by property
  app.get("/api/properties/:propertyId/proposals", requireAuth, cacheControl(60), async (req, res) => {
    try {
      const cacheKey = `proposals:property:${req.params.propertyId}`;
      
      // Check cache first
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      // Verify user has access to this property
      const property = await storage.getProperty(req.params.propertyId);
      if (!property) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }
      
      // Only property owner can see proposals for their property
      if (property.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const proposals = await storage.getProposalsByProperty(req.params.propertyId);
      
      // Cache for 1 minute
      memoryCache.set(cacheKey, proposals, 60);
      
      res.json(proposals);
    } catch (error) {
      console.error('Error getting property proposals:', error);
      res.status(500).json({ error: "Falha ao buscar propostas do imóvel" });
    }
  });

  // Create new proposal
  app.post("/api/proposals", requireRole('cliente'), async (req, res) => {
    try {
      const proposalData = insertProposalSchema.parse(req.body);
      
      // Clientes must use their own ID
      if (proposalData.clienteId !== req.session.userId) {
        return res.status(403).json({ error: "Você só pode criar propostas para si mesmo" });
      }
      
      const proposal = await storage.createProposal(proposalData);
      
      // Invalidate proposal caches
      memoryCache.invalidate('proposals');
      
      res.status(201).json(proposal);
    } catch (error) {
      console.error('Error creating proposal:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados da proposta inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Falha ao criar proposta" });
    }
  });

  // Update proposal (only property owner can accept/reject)
  app.patch("/api/proposals/:id", requireAuth, async (req, res) => {
    try {
      const existingProposal = await storage.getProposal(req.params.id);
      if (!existingProposal) {
        return res.status(404).json({ error: "Proposta não encontrada" });
      }
      
      // Only property owner can update proposals
      const property = await storage.getProperty(existingProposal.propertyId);
      if (!property || property.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const updates = req.body;
      const proposal = await storage.updateProposal(req.params.id, updates);
      
      // Invalidate proposal caches
      memoryCache.invalidate('proposals');
      
      res.json(proposal);
    } catch (error) {
      console.error('Error updating proposal:', error);
      res.status(500).json({ error: "Falha ao atualizar proposta" });
    }
  });

  // Payment Routes
  
  // Get payment by ID
  app.get("/api/payments/:id", requireAuth, async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Pagamento não encontrado" });
      }
      
      // Verify user has access to this payment's contract
      const contract = await storage.getContract(payment.contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contrato não encontrado" });
      }
      
      // User must be client or owner of the contract
      if (contract.clienteId !== req.session.userId && 
          contract.proprietarioId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      res.json(payment);
    } catch (error) {
      console.error('Error getting payment:', error);
      res.status(500).json({ error: "Falha ao buscar pagamento" });
    }
  });

  // Get payments by contract
  app.get("/api/contracts/:contractId/payments", requireAuth, async (req, res) => {
    try {
      // Verify user has access to this contract
      const contract = await storage.getContract(req.params.contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contrato não encontrado" });
      }
      
      // User must be client or owner of the contract
      if (contract.clienteId !== req.session.userId && 
          contract.proprietarioId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const payments = await storage.getPaymentsByContract(req.params.contractId);
      res.json(payments);
    } catch (error) {
      console.error('Error getting contract payments:', error);
      res.status(500).json({ error: "Falha ao buscar pagamentos do contrato" });
    }
  });

  // Create new payment (property owner only)
  app.post("/api/payments", requireAuth, async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      
      // Verify user owns the contract's property
      const contract = await storage.getContract(paymentData.contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contrato não encontrado" });
      }
      
      if (contract.proprietarioId !== req.session.userId) {
        return res.status(403).json({ error: "Apenas o proprietário pode registrar pagamentos" });
      }
      
      const payment = await storage.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      console.error('Error creating payment:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados do pagamento inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Falha ao criar pagamento" });
    }
  });

  // Update payment (property owner only)
  app.patch("/api/payments/:id", requireAuth, async (req, res) => {
    try {
      const existingPayment = await storage.getPayment(req.params.id);
      if (!existingPayment) {
        return res.status(404).json({ error: "Pagamento não encontrado" });
      }
      
      // Verify user owns the contract's property
      const contract = await storage.getContract(existingPayment.contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contrato não encontrado" });
      }
      
      if (contract.proprietarioId !== req.session.userId) {
        return res.status(403).json({ error: "Apenas o proprietário pode atualizar pagamentos" });
      }
      
      const updates = req.body;
      const payment = await storage.updatePayment(req.params.id, updates);
      res.json(payment);
    } catch (error) {
      console.error('Error updating payment:', error);
      res.status(500).json({ error: "Falha ao atualizar pagamento" });
    }
  });

  // Notification Routes
  
  // Get user notifications
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.session.userId!);
      res.json(notifications);
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ error: "Falha ao buscar notificações" });
    }
  });

  // Get unread notifications count
  app.get("/api/notifications/unread", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getUnreadNotificationsByUser(req.session.userId!);
      res.json({ count: notifications.length, notifications });
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      res.status(500).json({ error: "Falha ao buscar notificações não lidas" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notificação não encontrada" });
      }
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: "Falha ao marcar notificação como lida" });
    }
  });

  // Mark all notifications as read
  app.post("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: "Falha ao marcar todas notificações como lidas" });
    }
  });

  // Advertisement Routes
  
  // Get all active advertisements (public)
  app.get("/api/advertisements", cacheControl(600), async (req, res) => {
    try {
      const cacheKey = 'advertisements:active';
      
      // Check cache first
      const cached = memoryCache.get<any[]>(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      const advertisements = await storage.listActiveAdvertisements();
      
      // Cache for 10 minutes
      memoryCache.set(cacheKey, advertisements, 600);
      
      res.json(advertisements);
    } catch (error) {
      console.error('Error getting advertisements:', error);
      res.status(500).json({ error: "Falha ao buscar anúncios" });
    }
  });

  // Get all advertisements (admin only)
  app.get("/api/advertisements/all", requireRole('admin'), async (req, res) => {
    try {
      const advertisements = await storage.listAdvertisements();
      res.json(advertisements);
    } catch (error) {
      console.error('Error getting all advertisements:', error);
      res.status(500).json({ error: "Falha ao buscar anúncios" });
    }
  });

  // Create advertisement (admin only)
  app.post("/api/advertisements", requireRole('admin'), upload.single('image'), async (req, res) => {
    try {
      const advertisementData = {
        ...req.body,
        orderIndex: parseInt(req.body.orderIndex) || 0,
        active: req.body.active === 'true' || req.body.active === true,
        createdById: req.session.userId!
      };

      // Handle image upload
      if (req.file) {
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        advertisementData.image = base64Image;
      }

      const validated = insertAdvertisementSchema.parse(advertisementData);
      
      // Calculate expiration date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      const advertisement = await storage.createAdvertisement({
        ...validated,
        expiresAt
      });
      
      // Invalidate advertisements cache
      memoryCache.invalidateExact('advertisements:active');
      
      res.status(201).json(advertisement);
    } catch (error) {
      console.error('Error creating advertisement:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados do anúncio inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Falha ao criar anúncio" });
    }
  });

  // Update advertisement (admin only)
  app.patch("/api/advertisements/:id", requireRole('admin'), upload.single('image'), async (req, res) => {
    try {
      const updates: any = {
        ...req.body
      };

      if (req.body.orderIndex !== undefined) {
        updates.orderIndex = parseInt(req.body.orderIndex);
      }

      if (req.body.active !== undefined) {
        updates.active = req.body.active === 'true' || req.body.active === true;
        
        // If reactivating the advertisement, extend expiration date by 30 days
        if (updates.active === true) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
          updates.expiresAt = expiresAt;
        }
      }

      // Handle image upload
      if (req.file) {
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        updates.image = base64Image;
      }

      const advertisement = await storage.updateAdvertisement(req.params.id, updates);
      if (!advertisement) {
        return res.status(404).json({ error: "Anúncio não encontrado" });
      }
      
      // Invalidate advertisements cache
      memoryCache.invalidateExact('advertisements:active');
      
      res.json(advertisement);
    } catch (error) {
      console.error('Error updating advertisement:', error);
      res.status(500).json({ error: "Falha ao atualizar anúncio" });
    }
  });

  // Delete advertisement (admin only)
  app.delete("/api/advertisements/:id", requireRole('admin'), async (req, res) => {
    try {
      const success = await storage.deleteAdvertisement(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Anúncio não encontrado" });
      }
      
      // Invalidate advertisements cache
      memoryCache.invalidateExact('advertisements:active');
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      res.status(500).json({ error: "Falha ao deletar anúncio" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
