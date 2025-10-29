import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
  type Contract
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import session from "express-session";
import multer from "multer";
import { generateRentalContract } from "./contractGenerator";

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
  const visits = await storage.listVisits();
  const now = new Date();
  const oneDayInMs = 24 * 60 * 60 * 1000;
  
  for (const visit of visits) {
    if (visit.status === 'agendada' && visit.scheduledDateTime) {
      const visitDate = new Date(visit.scheduledDateTime);
      const timeSinceVisit = now.getTime() - visitDate.getTime();
      
      // If visit was more than 1 day ago, mark as completed
      if (timeSinceVisit > oneDayInMs) {
        await storage.updateVisit(visit.id, { status: 'concluida' });
        visit.status = 'concluida';
      }
    }
  }
  
  return visits;
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

export async function registerRoutes(app: Express): Promise<Server> {
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
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Check if user is blocked
      if (user.status === 'bloqueado') {
        // Destroy session for blocked users
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
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: "Falha ao atualizar perfil" });
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
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ error: "Falha ao atualizar status do usuário" });
    }
  });

  // Property Routes
  
  // Get all properties with optional filters
  app.get("/api/properties", cacheControl(120), async (req, res) => {
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
        status: req.query.status as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      
      const paginatedResult = await storage.listProperties(searchParams);
      
      // Get all active visits (with auto-complete) to check which properties can be edited
      const allVisits = await getVisitsWithAutoComplete();
      const activeVisitsByProperty = new Map();
      allVisits.forEach(visit => {
        if (visit.status === 'agendada') {
          activeVisitsByProperty.set(visit.propertyId, true);
        }
      });
      
      // Add edit information to each property
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
      
      res.json({
        data: propertiesWithEditInfo,
        total: paginatedResult.total,
        page: paginatedResult.page,
        limit: paginatedResult.limit,
        totalPages: paginatedResult.totalPages,
      });
    } catch (error) {
      console.error('Error listing properties:', error);
      res.status(400).json({ error: "Parâmetros de busca inválidos" });
    }
  });

  // Get featured properties
  app.get("/api/properties/featured", cacheControl(180), async (req, res) => {
    try {
      const properties = await storage.listProperties({ featured: true });
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
  app.get("/api/properties/:id", cacheControl(180), async (req, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }
      
      // Check if property has active scheduled visits
      const propertyVisits = await storage.getVisitsByProperty(req.params.id);
      const hasActiveVisits = propertyVisits.some(visit => visit.status === 'agendada');
      
      // Check if property is rented
      const isRented = property.status === 'arrendado';
      
      // Determine if editing is blocked
      const canEdit = !hasActiveVisits && !isRented;
      
      if (property.owner) {
        const { password, ...ownerWithoutPassword } = property.owner;
        res.json({ 
          ...property, 
          owner: ownerWithoutPassword,
          hasActiveVisits,
          isRented,
          canEdit
        });
      } else {
        res.json({ 
          ...property,
          hasActiveVisits,
          isRented,
          canEdit
        });
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

  // Upload property images (proprietarios and corretores only)
  app.post("/api/properties/upload", requireRole('proprietario', 'corretor'), upload.array('images', 10), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: "Nenhuma imagem foi enviada" });
      }

      const uploadedBase64: string[] = [];

      for (const file of req.files as Express.Multer.File[]) {
        // Convert buffer to base64 (images are in memory)
        const base64Data = file.buffer.toString('base64');
        const mimeType = file.mimetype;
        
        // Create data URL format: data:image/jpeg;base64,/9j/4AAQ...
        const dataUrl = `data:${mimeType};base64,${base64Data}`;
        uploadedBase64.push(dataUrl);
      }

      res.status(200).json({ 
        success: true, 
        urls: uploadedBase64,
        count: uploadedBase64.length
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
      
      // If proprietario (and not corretor), must use their own ID as ownerId
      if (hasRole(req.session, 'proprietario') && !hasRole(req.session, 'corretor') && propertyData.ownerId !== req.session.userId) {
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
      
      // Proprietarios (without corretor role) can only update their own properties
      if (hasRole(req.session, 'proprietario') && !hasRole(req.session, 'corretor') && existingProperty.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Você só pode atualizar seus próprios imóveis" });
      }
      
      // Check if property has active scheduled visits
      const propertyVisits = await storage.getVisitsByProperty(req.params.id);
      const hasActiveVisits = propertyVisits.some(visit => visit.status === 'agendada');
      
      // Check if property is rented
      const isRented = existingProperty.status === 'arrendado';
      
      // Proprietarios (without corretor role) cannot edit properties with active visits or that are rented
      if (hasRole(req.session, 'proprietario') && !hasRole(req.session, 'corretor')) {
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
      
      // Proprietarios (without corretor role) can only delete their own properties
      if (hasRole(req.session, 'proprietario') && !hasRole(req.session, 'corretor') && existingProperty.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Você só pode deletar seus próprios imóveis" });
      }
      
      // Check if property has active scheduled visits
      const propertyVisits = await storage.getVisitsByProperty(req.params.id);
      const hasActiveVisits = propertyVisits.some(visit => visit.status === 'agendada');
      
      // Check if property is rented
      const isRented = existingProperty.status === 'arrendado';
      
      // Proprietarios (without corretor role) cannot delete properties with active visits or that are rented
      if (hasRole(req.session, 'proprietario') && !hasRole(req.session, 'corretor')) {
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
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting property:', error);
      res.status(500).json({ error: "Falha ao deletar imóvel" });
    }
  });

  // Get properties by user
  app.get("/api/users/:userId/properties", requireAuth, cacheControl(120), async (req, res) => {
    try {
      // Users can only see their own properties, unless they're corretor or admin
      if (!hasRole(req.session, 'corretor') && !hasRole(req.session, 'admin') && req.params.userId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const properties = await storage.getUserProperties(req.params.userId);
      
      // Get all active visits (with auto-complete) to check which properties can be edited
      const allVisits = await getVisitsWithAutoComplete();
      const activeVisitsByProperty = new Map();
      allVisits.forEach(visit => {
        if (visit.status === 'agendada') {
          activeVisitsByProperty.set(visit.propertyId, true);
        }
      });
      
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
  app.get("/api/virtual-tours/property/:propertyId", cacheControl(300), async (req, res) => {
    try {
      const tour = await storage.getVirtualTourByProperty(req.params.propertyId);
      if (!tour) {
        return res.status(404).json({ error: "Tour virtual não encontrado" });
      }
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
      
      res.status(201).json(contract);
    } catch (error) {
      console.error('Error creating rental contract:', error);
      res.status(500).json({ error: "Falha ao criar contrato de arrendamento" });
    }
  });
  
  // Get all contracts (corretor only)
  app.get("/api/contracts", requireRole('corretor'), async (req, res) => {
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
      
      // Users can only see their own contracts, unless they're corretor
      if (!hasRole(req.session, 'corretor') && 
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

  // Get contracts by user
  app.get("/api/users/:userId/contracts", requireAuth, async (req, res) => {
    try {
      // Users can only see their own contracts, unless they're corretor
      if (!hasRole(req.session, 'corretor') && req.params.userId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const contracts = await storage.getContractsByUser(req.params.userId);
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
      
      if (!hasRole(req.session, 'corretor') && property.ownerId !== req.session.userId) {
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
  app.get("/api/visits", requireAuth, async (req, res) => {
    try {
      // First, auto-complete all old visits
      await getVisitsWithAutoComplete();
      
      // Fetch user-specific visits (client + owner visits)
      const userId = req.session.userId!;
      
      // Combine both client and owner visits for the logged-in user
      const clientVisits = await storage.getVisitsByClient(userId);
      const ownerVisits = await storage.getVisitsByOwner(userId);
      
      // Create a Set to track unique visit IDs
      const visitIds = new Set<string>();
      const visits = [];
      
      // Add all client visits
      for (const visit of clientVisits) {
        if (!visitIds.has(visit.id)) {
          visitIds.add(visit.id);
          visits.push(visit);
        }
      }
      
      // Add all owner visits (avoiding duplicates)
      for (const visit of ownerVisits) {
        if (!visitIds.has(visit.id)) {
          visitIds.add(visit.id);
          visits.push(visit);
        }
      }
      
      // Sort by creation date (most recent first)
      visits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(visits);
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
  app.get("/api/users/:clienteId/visits", requireAuth, async (req, res) => {
    try {
      // Users can only see their own visits, unless they're corretor
      if (!hasRole(req.session, 'corretor') && req.params.clienteId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const visits = await storage.getVisitsByClient(req.params.clienteId);
      res.json(visits);
    } catch (error) {
      console.error('Error getting client visits:', error);
      res.status(500).json({ error: "Falha ao buscar visitas do cliente" });
    }
  });

  // Get visits by property
  app.get("/api/properties/:propertyId/visits", requireAuth, async (req, res) => {
    try {
      // Verify user has access to this property
      const property = await storage.getProperty(req.params.propertyId);
      if (!property) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }
      
      if (!hasRole(req.session, 'corretor') && property.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const visits = await storage.getVisitsByProperty(req.params.propertyId);
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
      
      // Clientes (without corretor role) must use their own ID
      if (hasRole(req.session, 'cliente') && !hasRole(req.session, 'corretor') && visitData.clienteId !== req.session.userId) {
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
      
      // Users can only update their own visits, unless they're corretor
      if (!hasRole(req.session, 'corretor') && existingVisit.clienteId !== req.session.userId) {
        const property = await storage.getProperty(existingVisit.propertyId);
        if (!property || property.ownerId !== req.session.userId) {
          return res.status(403).json({ error: "Acesso negado" });
        }
      }
      
      const updates = req.body;
      const visit = await storage.updateVisit(req.params.id, updates);
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
      
      // Users can only delete their own visits, unless they're corretor or property owner
      if (!hasRole(req.session, 'corretor') && existingVisit.clienteId !== req.session.userId) {
        const property = await storage.getProperty(existingVisit.propertyId);
        if (!property || property.ownerId !== req.session.userId) {
          return res.status(403).json({ error: "Acesso negado" });
        }
      }
      
      const success = await storage.deleteVisit(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting visit:', error);
      res.status(500).json({ error: "Falha ao deletar visita" });
    }
  });

  // Proposal Routes
  
  // Get all proposals (corretor only)
  app.get("/api/proposals", requireRole('corretor'), async (req, res) => {
    try {
      const proposals = await storage.listProposals();
      res.json(proposals);
    } catch (error) {
      console.error('Error listing proposals:', error);
      res.status(500).json({ error: "Falha ao buscar propostas" });
    }
  });

  // Get proposal by ID
  app.get("/api/proposals/:id", requireAuth, async (req, res) => {
    try {
      const proposal = await storage.getProposal(req.params.id);
      if (!proposal) {
        return res.status(404).json({ error: "Proposta não encontrada" });
      }
      
      // Users can only see their own proposals, unless they're corretor or property owner
      if (!hasRole(req.session, 'corretor') && proposal.clienteId !== req.session.userId) {
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
  app.get("/api/users/:clienteId/proposals", requireAuth, async (req, res) => {
    try {
      // Users can only see their own proposals, unless they're corretor
      if (!hasRole(req.session, 'corretor') && req.params.clienteId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const proposals = await storage.getProposalsByClient(req.params.clienteId);
      res.json(proposals);
    } catch (error) {
      console.error('Error getting client proposals:', error);
      res.status(500).json({ error: "Falha ao buscar propostas do cliente" });
    }
  });

  // Get proposals by property
  app.get("/api/properties/:propertyId/proposals", requireAuth, async (req, res) => {
    try {
      // Verify user has access to this property
      const property = await storage.getProperty(req.params.propertyId);
      if (!property) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }
      
      if (!hasRole(req.session, 'corretor') && property.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const proposals = await storage.getProposalsByProperty(req.params.propertyId);
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
      res.status(201).json(proposal);
    } catch (error) {
      console.error('Error creating proposal:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados da proposta inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Falha ao criar proposta" });
    }
  });

  // Update proposal (corretor can accept/reject, property owner too)
  app.patch("/api/proposals/:id", requireAuth, async (req, res) => {
    try {
      const existingProposal = await storage.getProposal(req.params.id);
      if (!existingProposal) {
        return res.status(404).json({ error: "Proposta não encontrada" });
      }
      
      // Only corretor and property owner can update proposals
      if (!hasRole(req.session, 'corretor')) {
        const property = await storage.getProperty(existingProposal.propertyId);
        if (!property || property.ownerId !== req.session.userId) {
          return res.status(403).json({ error: "Acesso negado" });
        }
      }
      
      const updates = req.body;
      const proposal = await storage.updateProposal(req.params.id, updates);
      res.json(proposal);
    } catch (error) {
      console.error('Error updating proposal:', error);
      res.status(500).json({ error: "Falha ao atualizar proposta" });
    }
  });

  // Payment Routes
  
  // Get all payments (corretor only)
  app.get("/api/payments", requireRole('corretor'), async (req, res) => {
    try {
      const payments = await storage.listPayments();
      res.json(payments);
    } catch (error) {
      console.error('Error listing payments:', error);
      res.status(500).json({ error: "Falha ao buscar pagamentos" });
    }
  });

  // Get payment by ID
  app.get("/api/payments/:id", requireAuth, async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Pagamento não encontrado" });
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
      const payments = await storage.getPaymentsByContract(req.params.contractId);
      res.json(payments);
    } catch (error) {
      console.error('Error getting contract payments:', error);
      res.status(500).json({ error: "Falha ao buscar pagamentos do contrato" });
    }
  });

  // Create new payment (corretor only)
  app.post("/api/payments", requireRole('corretor'), async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
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

  // Update payment (corretor only)
  app.patch("/api/payments/:id", requireRole('corretor'), async (req, res) => {
    try {
      const updates = req.body;
      const payment = await storage.updatePayment(req.params.id, updates);
      if (!payment) {
        return res.status(404).json({ error: "Pagamento não encontrado" });
      }
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

  const httpServer = createServer(app);

  return httpServer;
}
