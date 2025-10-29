import { 
  users, 
  properties,
  contracts,
  visits,
  proposals,
  payments,
  notifications,
  virtualTours,
  tourRooms,
  tourHotspots,
  type User, 
  type InsertUser,
  type Property,
  type InsertProperty,
  type SearchPropertyParams,
  type Contract,
  type InsertContract,
  type Visit,
  type InsertVisit,
  type Proposal,
  type InsertProposal,
  type Payment,
  type InsertPayment,
  type Notification,
  type InsertNotification,
  type VirtualTour,
  type InsertVirtualTour,
  type TourRoom,
  type InsertTourRoom,
  type TourHotspot,
  type InsertTourHotspot,
  type VirtualTourWithRooms
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, ilike, desc, aliasedTable, sql } from "drizzle-orm";

export interface PaginatedProperties {
  data: Property[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  
  // Property methods
  getProperty(id: string): Promise<any | undefined>;
  listProperties(params?: SearchPropertyParams): Promise<PaginatedProperties>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<boolean>;
  getUserProperties(userId: string): Promise<Property[]>;
  getPendingProperties(): Promise<Property[]>;
  approveProperty(id: string): Promise<Property | undefined>;
  rejectProperty(id: string, message: string): Promise<Property | undefined>;
  acknowledgeRejection(id: string): Promise<Property | undefined>;
  
  // Contract methods
  getContract(id: string): Promise<Contract | undefined>;
  listContracts(): Promise<any[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  getContractsByUser(userId: string): Promise<any[]>;
  getContractsByProperty(propertyId: string): Promise<Contract[]>;
  
  // Visit methods
  getVisit(id: string): Promise<Visit | undefined>;
  listVisits(): Promise<Visit[]>;
  createVisit(visit: InsertVisit): Promise<Visit>;
  updateVisit(id: string, visit: Partial<InsertVisit>): Promise<Visit | undefined>;
  deleteVisit(id: string): Promise<boolean>;
  getVisitsByClient(clienteId: string): Promise<Visit[]>;
  getVisitsByProperty(propertyId: string): Promise<Visit[]>;
  getVisitsByOwner(ownerId: string): Promise<Visit[]>;
  getVisitByClientAndProperty(clienteId: string, propertyId: string): Promise<Visit | undefined>;
  
  // Proposal methods
  getProposal(id: string): Promise<Proposal | undefined>;
  listProposals(): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal | undefined>;
  getProposalsByClient(clienteId: string): Promise<Proposal[]>;
  getProposalsByProperty(propertyId: string): Promise<Proposal[]>;
  
  // Payment methods
  getPayment(id: string): Promise<Payment | undefined>;
  listPayments(): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined>;
  getPaymentsByContract(contractId: string): Promise<Payment[]>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  getUnreadNotificationsByUser(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  
  // Virtual Tour methods
  createVirtualTour(tour: InsertVirtualTour): Promise<VirtualTour>;
  getVirtualTour(id: string): Promise<VirtualTourWithRooms | undefined>;
  getVirtualTourByProperty(propertyId: string): Promise<VirtualTourWithRooms | undefined>;
  updateVirtualTour(id: string, tour: Partial<InsertVirtualTour>): Promise<VirtualTour | undefined>;
  deleteVirtualTour(id: string): Promise<boolean>;
  
  // Tour Room methods
  createTourRoom(room: InsertTourRoom): Promise<TourRoom>;
  updateTourRoom(id: string, room: Partial<InsertTourRoom>): Promise<TourRoom | undefined>;
  deleteTourRoom(id: string): Promise<boolean>;
  getTourRoomsByTour(tourId: string): Promise<TourRoom[]>;
  
  // Tour Hotspot methods
  createTourHotspot(hotspot: InsertTourHotspot): Promise<TourHotspot>;
  updateTourHotspot(id: string, hotspot: Partial<InsertTourHotspot>): Promise<TourHotspot | undefined>;
  deleteTourHotspot(id: string): Promise<boolean>;
  getHotspotsByRoom(roomId: string): Promise<TourHotspot[]>;
  deleteHotspotsByRoom(roomId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async listUsers(): Promise<User[]> {
    const results = await db.select().from(users);
    return results;
  }

  // Property methods
  async getProperty(id: string): Promise<any | undefined> {
    const owner = aliasedTable(users, 'owner');
    
    const results = await db
      .select({
        id: properties.id,
        title: properties.title,
        description: properties.description,
        type: properties.type,
        category: properties.category,
        price: properties.price,
        bairro: properties.bairro,
        municipio: properties.municipio,
        provincia: properties.provincia,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        livingRooms: properties.livingRooms,
        kitchens: properties.kitchens,
        area: properties.area,
        latitude: properties.latitude,
        longitude: properties.longitude,
        images: properties.images,
        amenities: properties.amenities,
        featured: properties.featured,
        status: properties.status,
        ownerId: properties.ownerId,
        approvalStatus: properties.approvalStatus,
        rejectionMessage: properties.rejectionMessage,
        rejectionAcknowledged: properties.rejectionAcknowledged,
        createdAt: properties.createdAt,
        updatedAt: properties.updatedAt,
        thumbnail: sql<string | null>`CASE WHEN array_length(${properties.images}, 1) > 0 THEN ${properties.images}[1] ELSE NULL END`,
        ownerId_fk: owner.id,
        ownerFullName: owner.fullName,
        ownerEmail: owner.email,
        ownerPhone: owner.phone,
        ownerUserTypes: owner.userTypes,
      })
      .from(properties)
      .leftJoin(owner, eq(properties.ownerId, owner.id))
      .where(eq(properties.id, id));
    
    if (!results || results.length === 0) return undefined;
    
    const result = results[0];
    
    if (result.ownerId_fk) {
      const { ownerId_fk, ownerFullName, ownerEmail, ownerPhone, ownerUserTypes, ...propertyData } = result;
      return {
        ...propertyData,
        owner: {
          id: ownerId_fk,
          fullName: ownerFullName,
          email: ownerEmail,
          phone: ownerPhone,
          userTypes: ownerUserTypes,
        }
      };
    }
    
    const { ownerId_fk, ownerFullName, ownerEmail, ownerPhone, ownerUserTypes, ...propertyData } = result;
    return propertyData;
  }

  async getPropertyImages(id: string): Promise<string[] | undefined> {
    const result = await db
      .select({ images: properties.images })
      .from(properties)
      .where(eq(properties.id, id));
    
    if (!result || result.length === 0) return undefined;
    
    return result[0].images || [];
  }

  async listProperties(params?: SearchPropertyParams): Promise<PaginatedProperties> {
    const conditions = [];
    
    // IMPORTANTE: Apenas imóveis aprovados são listados publicamente
    // Imóveis pendentes e recusados não devem aparecer para outros usuários
    conditions.push(eq(properties.approvalStatus, 'aprovado'));
    
    if (params) {
      if (params.type) {
        conditions.push(eq(properties.type, params.type));
      }
      if (params.category) {
        conditions.push(eq(properties.category, params.category));
      }
      if (params.location) {
        conditions.push(or(
          ilike(properties.provincia, `%${params.location}%`),
          ilike(properties.municipio, `%${params.location}%`)
        ));
      }
      if (params.bairro) {
        conditions.push(ilike(properties.bairro, `%${params.bairro}%`));
      }
      if (params.municipio) {
        conditions.push(eq(properties.municipio, params.municipio));
      }
      if (params.provincia) {
        conditions.push(eq(properties.provincia, params.provincia));
      }
      if (params.bedrooms !== undefined) {
        if (params.bedrooms >= 4) {
          conditions.push(gte(properties.bedrooms, params.bedrooms));
        } else {
          conditions.push(eq(properties.bedrooms, params.bedrooms));
        }
      }
      if (params.livingRooms !== undefined) {
        if (params.livingRooms >= 3) {
          conditions.push(gte(properties.livingRooms, params.livingRooms));
        } else {
          conditions.push(eq(properties.livingRooms, params.livingRooms));
        }
      }
      if (params.kitchens !== undefined) {
        if (params.kitchens >= 3) {
          conditions.push(gte(properties.kitchens, params.kitchens));
        } else {
          conditions.push(eq(properties.kitchens, params.kitchens));
        }
      }
      if (params.minPrice !== undefined && params.minPrice !== null) {
        conditions.push(gte(properties.price, String(params.minPrice)));
      }
      if (params.maxPrice !== undefined && params.maxPrice !== null) {
        conditions.push(lte(properties.price, String(params.maxPrice)));
      }
      if (params.featured !== undefined) {
        conditions.push(eq(properties.featured, params.featured));
      }
      if (params.status) {
        conditions.push(eq(properties.status, params.status));
      }
    }

    // Pagination parameters with defaults
    const page = params?.page ?? 1;
    const limit = Math.min(params?.limit ?? 30, 200); // Default 30, max 200
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(properties);
    
    const countResult = await (whereClause 
      ? countQuery.where(whereClause)
      : countQuery);
    
    const total = countResult[0]?.count ?? 0;

    // Select only necessary fields, exclude images array to reduce bandwidth
    let query = db.select({
      id: properties.id,
      title: properties.title,
      description: properties.description,
      type: properties.type,
      category: properties.category,
      price: properties.price,
      bairro: properties.bairro,
      municipio: properties.municipio,
      provincia: properties.provincia,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms,
      livingRooms: properties.livingRooms,
      kitchens: properties.kitchens,
      area: properties.area,
      latitude: properties.latitude,
      longitude: properties.longitude,
      amenities: properties.amenities,
      featured: properties.featured,
      status: properties.status,
      ownerId: properties.ownerId,
      approvalStatus: properties.approvalStatus,
      rejectionMessage: properties.rejectionMessage,
      rejectionAcknowledged: properties.rejectionAcknowledged,
      createdAt: properties.createdAt,
      updatedAt: properties.updatedAt,
      // Get only first image as thumbnail
      thumbnail: sql<string | null>`CASE WHEN array_length(${properties.images}, 1) > 0 THEN ${properties.images}[1] ELSE NULL END`,
    }).from(properties);

    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    const results = await query
      .orderBy(desc(properties.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return {
      data: results as any,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db
      .insert(properties)
      .values(insertProperty)
      .returning();
    return property;
  }

  async updateProperty(id: string, updates: Partial<InsertProperty>): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return property || undefined;
  }

  async deleteProperty(id: string): Promise<boolean> {
    const result = await db
      .delete(properties)
      .where(eq(properties.id, id))
      .returning();
    return result.length > 0;
  }

  async getUserProperties(userId: string): Promise<Property[]> {
    // Select only necessary fields, exclude images array to reduce bandwidth
    const results = await db
      .select({
        id: properties.id,
        title: properties.title,
        description: properties.description,
        type: properties.type,
        category: properties.category,
        price: properties.price,
        bairro: properties.bairro,
        municipio: properties.municipio,
        provincia: properties.provincia,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        livingRooms: properties.livingRooms,
        kitchens: properties.kitchens,
        area: properties.area,
        latitude: properties.latitude,
        longitude: properties.longitude,
        amenities: properties.amenities,
        featured: properties.featured,
        status: properties.status,
        ownerId: properties.ownerId,
        approvalStatus: properties.approvalStatus,
        rejectionMessage: properties.rejectionMessage,
        rejectionAcknowledged: properties.rejectionAcknowledged,
        createdAt: properties.createdAt,
        updatedAt: properties.updatedAt,
        // Get only first image as thumbnail
        thumbnail: sql<string | null>`CASE WHEN array_length(${properties.images}, 1) > 0 THEN ${properties.images}[1] ELSE NULL END`,
      })
      .from(properties)
      .where(eq(properties.ownerId, userId))
      .orderBy(desc(properties.createdAt));
    return results as any;
  }

  async getPendingProperties(): Promise<Property[]> {
    const results = await db
      .select()
      .from(properties)
      .where(eq(properties.approvalStatus, 'pendente'))
      .orderBy(desc(properties.createdAt));
    return results;
  }

  async approveProperty(id: string): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set({ 
        approvalStatus: 'aprovado',
        rejectionMessage: null,
        rejectionAcknowledged: false,
        updatedAt: new Date()
      })
      .where(eq(properties.id, id))
      .returning();
    return property || undefined;
  }

  async rejectProperty(id: string, message: string): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set({ 
        approvalStatus: 'recusado',
        rejectionMessage: message,
        rejectionAcknowledged: false,
        updatedAt: new Date()
      })
      .where(eq(properties.id, id))
      .returning();
    return property || undefined;
  }

  async acknowledgeRejection(id: string): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set({ 
        rejectionAcknowledged: true,
        updatedAt: new Date()
      })
      .where(eq(properties.id, id))
      .returning();
    return property || undefined;
  }

  // Contract methods
  async getContract(id: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract || undefined;
  }

  async listContracts(): Promise<any[]> {
    const proprietario = aliasedTable(users, 'proprietario');
    const cliente = aliasedTable(users, 'cliente');
    
    const results = await db
      .select({
        id: contracts.id,
        propertyId: contracts.propertyId,
        proprietarioId: contracts.proprietarioId,
        clienteId: contracts.clienteId,
        tipo: contracts.tipo,
        valor: contracts.valor,
        dataInicio: contracts.dataInicio,
        dataFim: contracts.dataFim,
        status: contracts.status,
        contractContent: contracts.contractContent,
        proprietarioSignature: contracts.proprietarioSignature,
        proprietarioSignedAt: contracts.proprietarioSignedAt,
        clienteSignature: contracts.clienteSignature,
        clienteSignedAt: contracts.clienteSignedAt,
        observacoes: contracts.observacoes,
        createdAt: contracts.createdAt,
        property: {
          title: properties.title,
          bairro: properties.bairro,
          municipio: properties.municipio,
          // Get only first image as thumbnail to reduce bandwidth
          images: sql<string[]>`CASE WHEN array_length(${properties.images}, 1) > 0 THEN ARRAY[${properties.images}[1]] ELSE ARRAY[]::text[] END`,
        },
        proprietario: {
          fullName: proprietario.fullName,
          phone: proprietario.phone,
        },
        cliente: {
          fullName: cliente.fullName,
          phone: cliente.phone,
        },
      })
      .from(contracts)
      .leftJoin(properties, eq(contracts.propertyId, properties.id))
      .leftJoin(proprietario, eq(contracts.proprietarioId, proprietario.id))
      .leftJoin(cliente, eq(contracts.clienteId, cliente.id))
      .orderBy(desc(contracts.createdAt));
    
    return results;
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const [contract] = await db
      .insert(contracts)
      .values(insertContract)
      .returning();
    return contract;
  }

  async updateContract(id: string, updates: Partial<InsertContract>): Promise<Contract | undefined> {
    const [contract] = await db
      .update(contracts)
      .set(updates)
      .where(eq(contracts.id, id))
      .returning();
    return contract || undefined;
  }

  async getContractsByUser(userId: string): Promise<any[]> {
    const proprietario = aliasedTable(users, 'proprietario');
    const cliente = aliasedTable(users, 'cliente');
    
    const results = await db
      .select({
        id: contracts.id,
        propertyId: contracts.propertyId,
        proprietarioId: contracts.proprietarioId,
        clienteId: contracts.clienteId,
        tipo: contracts.tipo,
        valor: contracts.valor,
        dataInicio: contracts.dataInicio,
        dataFim: contracts.dataFim,
        status: contracts.status,
        contractContent: contracts.contractContent,
        proprietarioSignature: contracts.proprietarioSignature,
        proprietarioSignedAt: contracts.proprietarioSignedAt,
        clienteSignature: contracts.clienteSignature,
        clienteSignedAt: contracts.clienteSignedAt,
        observacoes: contracts.observacoes,
        createdAt: contracts.createdAt,
        property: {
          title: properties.title,
          bairro: properties.bairro,
          municipio: properties.municipio,
          // Get only first image as thumbnail to reduce bandwidth
          images: sql<string[]>`CASE WHEN array_length(${properties.images}, 1) > 0 THEN ARRAY[${properties.images}[1]] ELSE ARRAY[]::text[] END`,
        },
        proprietario: {
          fullName: proprietario.fullName,
          phone: proprietario.phone,
        },
        cliente: {
          fullName: cliente.fullName,
          phone: cliente.phone,
        },
      })
      .from(contracts)
      .leftJoin(properties, eq(contracts.propertyId, properties.id))
      .leftJoin(proprietario, eq(contracts.proprietarioId, proprietario.id))
      .leftJoin(cliente, eq(contracts.clienteId, cliente.id))
      .where(or(
        eq(contracts.clienteId, userId),
        eq(contracts.proprietarioId, userId)
      ))
      .orderBy(desc(contracts.createdAt));
    
    return results;
  }

  async getContractsByProperty(propertyId: string): Promise<Contract[]> {
    const results = await db
      .select()
      .from(contracts)
      .where(eq(contracts.propertyId, propertyId))
      .orderBy(desc(contracts.createdAt));
    return results;
  }

  // Visit methods
  async getVisit(id: string): Promise<Visit | undefined> {
    const [visit] = await db.select().from(visits).where(eq(visits.id, id));
    return visit || undefined;
  }

  async listVisits(): Promise<Visit[]> {
    const cliente = aliasedTable(users, 'cliente');
    const owner = aliasedTable(users, 'owner');
    
    const results = await db
      .select({
        visit: visits,
        // Select only essential property fields, exclude images to reduce bandwidth
        property: {
          id: properties.id,
          title: properties.title,
          bairro: properties.bairro,
          municipio: properties.municipio,
          provincia: properties.provincia,
          type: properties.type,
          category: properties.category,
          price: properties.price,
          ownerId: properties.ownerId,
        },
        cliente: {
          id: cliente.id,
          fullName: cliente.fullName,
          phone: cliente.phone,
        },
        owner: {
          id: owner.id,
          fullName: owner.fullName,
          email: owner.email,
          phone: owner.phone,
        },
      })
      .from(visits)
      .innerJoin(properties, eq(visits.propertyId, properties.id))
      .leftJoin(cliente, eq(visits.clienteId, cliente.id))
      .leftJoin(owner, eq(properties.ownerId, owner.id))
      .orderBy(desc(visits.createdAt));
    
    return results.map((r) => ({
      ...r.visit,
      property: {
        ...r.property,
        owner: r.owner?.id ? r.owner : undefined,
      },
      cliente: r.cliente?.id ? r.cliente : undefined,
    })) as any;
  }

  async createVisit(insertVisit: InsertVisit): Promise<Visit> {
    const [visit] = await db
      .insert(visits)
      .values(insertVisit)
      .returning();
    return visit;
  }

  async updateVisit(id: string, updates: Partial<InsertVisit>): Promise<Visit | undefined> {
    const [visit] = await db
      .update(visits)
      .set(updates)
      .where(eq(visits.id, id))
      .returning();
    return visit || undefined;
  }

  async deleteVisit(id: string): Promise<boolean> {
    const result = await db
      .delete(visits)
      .where(eq(visits.id, id))
      .returning();
    return result.length > 0;
  }

  async getVisitsByClient(clienteId: string): Promise<Visit[]> {
    const owner = aliasedTable(users, 'owner');
    
    const results = await db
      .select({
        visit: visits,
        // Select only essential property fields, exclude images to reduce bandwidth
        property: {
          id: properties.id,
          title: properties.title,
          bairro: properties.bairro,
          municipio: properties.municipio,
          provincia: properties.provincia,
          type: properties.type,
          category: properties.category,
          price: properties.price,
          ownerId: properties.ownerId,
        },
        owner: {
          id: owner.id,
          fullName: owner.fullName,
          email: owner.email,
          phone: owner.phone,
        },
      })
      .from(visits)
      .innerJoin(properties, eq(visits.propertyId, properties.id))
      .leftJoin(owner, eq(properties.ownerId, owner.id))
      .where(eq(visits.clienteId, clienteId))
      .orderBy(desc(visits.createdAt));
    
    return results.map((r) => ({
      ...r.visit,
      property: {
        ...r.property,
        owner: r.owner?.id ? r.owner : undefined,
      },
    })) as any;
  }

  async getVisitsByProperty(propertyId: string): Promise<Visit[]> {
    const cliente = aliasedTable(users, 'cliente');
    
    const results = await db
      .select({
        visit: visits,
        // Select only essential property fields, exclude images to reduce bandwidth
        property: {
          id: properties.id,
          title: properties.title,
          bairro: properties.bairro,
          municipio: properties.municipio,
          provincia: properties.provincia,
          type: properties.type,
          category: properties.category,
          price: properties.price,
          ownerId: properties.ownerId,
        },
        cliente: {
          id: cliente.id,
          fullName: cliente.fullName,
          phone: cliente.phone,
        },
      })
      .from(visits)
      .innerJoin(properties, eq(visits.propertyId, properties.id))
      .leftJoin(cliente, eq(visits.clienteId, cliente.id))
      .where(eq(visits.propertyId, propertyId))
      .orderBy(desc(visits.createdAt));
    
    return results.map((r) => ({
      ...r.visit,
      property: r.property,
      cliente: r.cliente?.id ? r.cliente : undefined,
    })) as any;
  }

  async getVisitsByOwner(ownerId: string): Promise<Visit[]> {
    const results = await db
      .select({
        visit: visits,
        // Select only essential property fields, exclude images to reduce bandwidth
        property: {
          id: properties.id,
          title: properties.title,
          bairro: properties.bairro,
          municipio: properties.municipio,
          provincia: properties.provincia,
          type: properties.type,
          category: properties.category,
          price: properties.price,
          ownerId: properties.ownerId,
        },
        cliente: {
          id: users.id,
          fullName: users.fullName,
          phone: users.phone,
        },
      })
      .from(visits)
      .innerJoin(properties, eq(visits.propertyId, properties.id))
      .leftJoin(users, eq(visits.clienteId, users.id))
      .where(eq(properties.ownerId, ownerId))
      .orderBy(desc(visits.createdAt));
    
    return results.map((r) => ({
      ...r.visit,
      property: r.property,
      cliente: r.cliente?.id ? r.cliente : undefined,
    })) as any;
  }

  async getVisitByClientAndProperty(clienteId: string, propertyId: string): Promise<Visit | undefined> {
    const [visit] = await db
      .select()
      .from(visits)
      .where(and(
        eq(visits.clienteId, clienteId),
        eq(visits.propertyId, propertyId)
      ));
    return visit || undefined;
  }

  // Proposal methods
  async getProposal(id: string): Promise<Proposal | undefined> {
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
    return proposal || undefined;
  }

  async listProposals(): Promise<Proposal[]> {
    const results = await db.select().from(proposals).orderBy(desc(proposals.createdAt));
    return results;
  }

  async createProposal(insertProposal: InsertProposal): Promise<Proposal> {
    const [proposal] = await db
      .insert(proposals)
      .values(insertProposal)
      .returning();
    return proposal;
  }

  async updateProposal(id: string, updates: Partial<InsertProposal>): Promise<Proposal | undefined> {
    const [proposal] = await db
      .update(proposals)
      .set(updates)
      .where(eq(proposals.id, id))
      .returning();
    return proposal || undefined;
  }

  async getProposalsByClient(clienteId: string): Promise<Proposal[]> {
    const results = await db
      .select()
      .from(proposals)
      .where(eq(proposals.clienteId, clienteId))
      .orderBy(desc(proposals.createdAt));
    return results;
  }

  async getProposalsByProperty(propertyId: string): Promise<Proposal[]> {
    const results = await db
      .select()
      .from(proposals)
      .where(eq(proposals.propertyId, propertyId))
      .orderBy(desc(proposals.createdAt));
    return results;
  }

  // Payment methods
  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async listPayments(): Promise<Payment[]> {
    const results = await db.select().from(payments).orderBy(desc(payments.createdAt));
    return results;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  async getPaymentsByContract(contractId: string): Promise<Payment[]> {
    const results = await db
      .select()
      .from(payments)
      .where(eq(payments.contractId, contractId))
      .orderBy(desc(payments.createdAt));
    return results;
  }

  // Notification methods
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    const results = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(100);
    return results;
  }

  async getUnreadNotificationsByUser(userId: string): Promise<Notification[]> {
    const results = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.readAt, null as any)
      ))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
    return results;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.readAt, null as any)
      ));
  }

  // Virtual Tour methods
  async createVirtualTour(insertTour: InsertVirtualTour): Promise<VirtualTour> {
    const [tour] = await db
      .insert(virtualTours)
      .values(insertTour)
      .returning();
    return tour;
  }

  async getVirtualTour(id: string): Promise<VirtualTourWithRooms | undefined> {
    const result = await db.query.virtualTours.findFirst({
      where: eq(virtualTours.id, id),
      with: {
        rooms: {
          orderBy: (rooms, { asc }) => [asc(rooms.orderIndex)],
          with: {
            hotspotsFrom: true,
          },
        },
      },
    });
    return result || undefined;
  }

  async getVirtualTourByProperty(propertyId: string): Promise<VirtualTourWithRooms | undefined> {
    const result = await db.query.virtualTours.findFirst({
      where: eq(virtualTours.propertyId, propertyId),
      with: {
        rooms: {
          orderBy: (rooms, { asc }) => [asc(rooms.orderIndex)],
          with: {
            hotspotsFrom: true,
          },
        },
      },
    });
    return result || undefined;
  }

  async updateVirtualTour(id: string, updates: Partial<InsertVirtualTour>): Promise<VirtualTour | undefined> {
    const [tour] = await db
      .update(virtualTours)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(virtualTours.id, id))
      .returning();
    return tour || undefined;
  }

  async deleteVirtualTour(id: string): Promise<boolean> {
    const result = await db
      .delete(virtualTours)
      .where(eq(virtualTours.id, id))
      .returning();
    return result.length > 0;
  }

  // Tour Room methods
  async createTourRoom(insertRoom: InsertTourRoom): Promise<TourRoom> {
    const [room] = await db
      .insert(tourRooms)
      .values(insertRoom)
      .returning();
    return room;
  }

  async updateTourRoom(id: string, updates: Partial<InsertTourRoom>): Promise<TourRoom | undefined> {
    const [room] = await db
      .update(tourRooms)
      .set(updates)
      .where(eq(tourRooms.id, id))
      .returning();
    return room || undefined;
  }

  async deleteTourRoom(id: string): Promise<boolean> {
    const result = await db
      .delete(tourRooms)
      .where(eq(tourRooms.id, id))
      .returning();
    return result.length > 0;
  }

  async getTourRoomsByTour(tourId: string): Promise<TourRoom[]> {
    const results = await db
      .select()
      .from(tourRooms)
      .where(eq(tourRooms.tourId, tourId))
      .orderBy(tourRooms.orderIndex);
    return results;
  }

  // Tour Hotspot methods
  async createTourHotspot(insertHotspot: InsertTourHotspot): Promise<TourHotspot> {
    const [hotspot] = await db
      .insert(tourHotspots)
      .values(insertHotspot)
      .returning();
    return hotspot;
  }

  async updateTourHotspot(id: string, updates: Partial<InsertTourHotspot>): Promise<TourHotspot | undefined> {
    const [hotspot] = await db
      .update(tourHotspots)
      .set(updates)
      .where(eq(tourHotspots.id, id))
      .returning();
    return hotspot || undefined;
  }

  async deleteTourHotspot(id: string): Promise<boolean> {
    const result = await db
      .delete(tourHotspots)
      .where(eq(tourHotspots.id, id))
      .returning();
    return result.length > 0;
  }

  async getHotspotsByRoom(roomId: string): Promise<TourHotspot[]> {
    const results = await db
      .select()
      .from(tourHotspots)
      .where(eq(tourHotspots.fromRoomId, roomId));
    return results;
  }

  async deleteHotspotsByRoom(roomId: string): Promise<void> {
    await db
      .delete(tourHotspots)
      .where(or(
        eq(tourHotspots.fromRoomId, roomId),
        eq(tourHotspots.toRoomId, roomId)
      ));
  }
}

export const storage = new DatabaseStorage();
