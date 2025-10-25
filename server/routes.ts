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
  insertPaymentSchema
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

// Extend Express session type
declare module 'express-session' {
  interface SessionData {
    userId: string;
    userType: string;
  }
}

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Autenticação necessária" });
  }
  next();
}

// Role-based authorization middleware
function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Autenticação necessária" });
    }
    if (!roles.includes(req.session.userType || '')) {
      return res.status(403).json({ error: "Acesso negado" });
    }
    next();
  };
}

// Configure upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'properties');

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Configure Multer for image uploads (disk storage)
const storage_multer = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).session?.userId || 'unknown';
    const timestamp = Date.now();
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase();
    cb(null, `${userId}_${timestamp}_${sanitizedName}`);
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
    files: 4 // max 4 files
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded images statically
  const express = await import('express');
  app.use('/uploads', express.default.static(path.join(process.cwd(), 'uploads')));

  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'biva-secret-key-development',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
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
        userType: userData.userType,
        password: hashedPassword,
        username,
        email: null,
      });
      
      // Set session
      req.session.userId = user.id;
      req.session.userType = user.userType;
      
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
      
      // Verify password
      const validPassword = await bcrypt.compare(credentials.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Número de telefone ou senha incorretos" });
      }
      
      // Set session
      req.session.userId = user.id;
      req.session.userType = user.userType;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
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

  // Property Routes
  
  // Get all properties with optional filters
  app.get("/api/properties", async (req, res) => {
    try {
      const searchParams = searchPropertySchema.parse({
        type: req.query.type,
        category: req.query.category,
        bairro: req.query.bairro,
        municipio: req.query.municipio,
        provincia: req.query.provincia,
        bedrooms: req.query.bedrooms ? Number(req.query.bedrooms) : undefined,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
        status: req.query.status as string | undefined,
      });
      
      const properties = await storage.listProperties(searchParams);
      res.json(properties);
    } catch (error) {
      console.error('Error listing properties:', error);
      res.status(400).json({ error: "Parâmetros de busca inválidos" });
    }
  });

  // Get featured properties
  app.get("/api/properties/featured", async (req, res) => {
    try {
      const properties = await storage.listProperties({ featured: true });
      res.json(properties);
    } catch (error) {
      console.error('Error getting featured properties:', error);
      res.status(500).json({ error: "Falha ao buscar imóveis em destaque" });
    }
  });

  // Get single property
  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }
      res.json(property);
    } catch (error) {
      console.error('Error getting property:', error);
      res.status(500).json({ error: "Falha ao buscar imóvel" });
    }
  });

  // Upload property images (proprietarios and corretores only)
  app.post("/api/properties/upload", requireRole('proprietario', 'corretor'), upload.array('images', 4), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: "Nenhuma imagem foi enviada" });
      }

      const uploadedUrls: string[] = [];

      for (const file of req.files) {
        // Create URL path for the uploaded file
        const fileUrl = `/uploads/properties/${file.filename}`;
        uploadedUrls.push(fileUrl);
      }

      res.status(200).json({ 
        success: true, 
        urls: uploadedUrls,
        count: uploadedUrls.length
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: "Arquivo muito grande. Tamanho máximo: 5 MB" });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: "Número máximo de arquivos: 4" });
        }
      }
      res.status(500).json({ error: "Falha ao fazer upload das imagens" });
    }
  });

  // Create new property (proprietarios and corretores only)
  app.post("/api/properties", requireRole('proprietario', 'corretor'), async (req, res) => {
    try {
      const propertyData = insertPropertySchema.parse(req.body);
      
      // If proprietario, must use their own ID as ownerId
      if (req.session.userType === 'proprietario' && propertyData.ownerId !== req.session.userId) {
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
      if (req.session.userType === 'proprietario' && existingProperty.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Você só pode atualizar seus próprios imóveis" });
      }
      
      const updates = req.body;
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
      
      // Proprietarios can only delete their own properties
      if (req.session.userType === 'proprietario' && existingProperty.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Você só pode deletar seus próprios imóveis" });
      }
      
      const success = await storage.deleteProperty(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting property:', error);
      res.status(500).json({ error: "Falha ao deletar imóvel" });
    }
  });

  // Get properties by user
  app.get("/api/users/:userId/properties", requireAuth, async (req, res) => {
    try {
      // Users can only see their own properties, unless they're corretor
      if (req.session.userType !== 'corretor' && req.params.userId !== req.session.userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const properties = await storage.getUserProperties(req.params.userId);
      res.json(properties);
    } catch (error) {
      console.error('Error getting user properties:', error);
      res.status(500).json({ error: "Falha ao buscar imóveis do usuário" });
    }
  });

  // Contract Routes
  
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
      if (req.session.userType !== 'corretor' && 
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
      if (req.session.userType !== 'corretor' && req.params.userId !== req.session.userId) {
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
      
      if (req.session.userType !== 'corretor' && property.ownerId !== req.session.userId) {
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

  // Visit Routes
  
  // Get all visits (corretor only)
  app.get("/api/visits", requireRole('corretor'), async (req, res) => {
    try {
      const visits = await storage.listVisits();
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
      if (req.session.userType !== 'corretor' && visit.clienteId !== req.session.userId) {
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
      if (req.session.userType !== 'corretor' && req.params.clienteId !== req.session.userId) {
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
      
      if (req.session.userType !== 'corretor' && property.ownerId !== req.session.userId) {
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
      
      // Clientes must use their own ID, corretores can create for anyone
      if (req.session.userType === 'cliente' && visitData.clienteId !== req.session.userId) {
        return res.status(403).json({ error: "Você só pode agendar visitas para si mesmo" });
      }
      
      const visit = await storage.createVisit(visitData);
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
      if (req.session.userType !== 'corretor' && existingVisit.clienteId !== req.session.userId) {
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

  // Delete visit
  app.delete("/api/visits/:id", requireAuth, async (req, res) => {
    try {
      const existingVisit = await storage.getVisit(req.params.id);
      if (!existingVisit) {
        return res.status(404).json({ error: "Visita não encontrada" });
      }
      
      // Users can only delete their own visits, unless they're corretor or property owner
      if (req.session.userType !== 'corretor' && existingVisit.clienteId !== req.session.userId) {
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
      if (req.session.userType !== 'corretor' && proposal.clienteId !== req.session.userId) {
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
      if (req.session.userType !== 'corretor' && req.params.clienteId !== req.session.userId) {
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
      
      if (req.session.userType !== 'corretor' && property.ownerId !== req.session.userId) {
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
      if (req.session.userType !== 'corretor') {
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

  const httpServer = createServer(app);

  return httpServer;
}
