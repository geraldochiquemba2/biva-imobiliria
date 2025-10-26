import { 
  users, 
  properties,
  contracts,
  visits,
  proposals,
  payments,
  notifications,
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
  type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, ilike, desc, aliasedTable } from "drizzle-orm";

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
  listProperties(params?: SearchPropertyParams): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<boolean>;
  getUserProperties(userId: string): Promise<Property[]>;
  
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
    const result = await db.query.properties.findFirst({
      where: eq(properties.id, id),
      with: {
        owner: true,
      },
    });
    return result || undefined;
  }

  async listProperties(params?: SearchPropertyParams): Promise<Property[]> {
    let query = db.select().from(properties);
    
    const conditions = [];
    
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

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query.orderBy(desc(properties.createdAt));
    return results;
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
    const results = await db
      .select()
      .from(properties)
      .where(eq(properties.ownerId, userId))
      .orderBy(desc(properties.createdAt));
    return results;
  }

  // Contract methods
  async getContract(id: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract || undefined;
  }

  async listContracts(): Promise<any[]> {
    const results = await db.query.contracts.findMany({
      orderBy: [desc(contracts.createdAt)],
      with: {
        property: {
          columns: {
            title: true,
            bairro: true,
            municipio: true,
            images: true,
          },
        },
        proprietario: {
          columns: {
            fullName: true,
            phone: true,
          },
        },
        cliente: {
          columns: {
            fullName: true,
            phone: true,
          },
        },
      },
    });
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
    const results = await db.query.contracts.findMany({
      where: or(
        eq(contracts.clienteId, userId),
        eq(contracts.proprietarioId, userId)
      ),
      orderBy: [desc(contracts.createdAt)],
      with: {
        property: {
          columns: {
            title: true,
            bairro: true,
            municipio: true,
            images: true,
          },
        },
        proprietario: {
          columns: {
            fullName: true,
            phone: true,
          },
        },
        cliente: {
          columns: {
            fullName: true,
            phone: true,
          },
        },
      },
    });
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
        property: properties,
        cliente: cliente,
        owner: owner,
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
        owner: r.owner ? {
          fullName: r.owner.fullName,
          email: r.owner.email,
          phone: r.owner.phone,
        } : undefined,
      },
      cliente: r.cliente ? {
        fullName: r.cliente.fullName,
        phone: r.cliente.phone,
      } : undefined,
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
        property: properties,
        owner: owner,
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
        owner: r.owner ? {
          fullName: r.owner.fullName,
          email: r.owner.email,
          phone: r.owner.phone,
        } : undefined,
      },
    })) as any;
  }

  async getVisitsByProperty(propertyId: string): Promise<Visit[]> {
    const cliente = aliasedTable(users, 'cliente');
    
    const results = await db
      .select({
        visit: visits,
        property: properties,
        cliente: cliente,
      })
      .from(visits)
      .innerJoin(properties, eq(visits.propertyId, properties.id))
      .leftJoin(cliente, eq(visits.clienteId, cliente.id))
      .where(eq(visits.propertyId, propertyId))
      .orderBy(desc(visits.createdAt));
    
    return results.map((r) => ({
      ...r.visit,
      property: r.property,
      cliente: r.cliente || undefined,
    })) as any;
  }

  async getVisitsByOwner(ownerId: string): Promise<Visit[]> {
    const results = await db
      .select({
        visit: visits,
        property: properties,
        cliente: users,
      })
      .from(visits)
      .innerJoin(properties, eq(visits.propertyId, properties.id))
      .leftJoin(users, eq(visits.clienteId, users.id))
      .where(eq(properties.ownerId, ownerId))
      .orderBy(desc(visits.createdAt));
    
    return results.map((r) => ({
      ...r.visit,
      property: r.property,
      cliente: r.cliente || undefined,
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
      .orderBy(desc(notifications.createdAt));
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
      .orderBy(desc(notifications.createdAt));
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
}

export const storage = new DatabaseStorage();
