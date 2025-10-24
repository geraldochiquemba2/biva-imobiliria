import { 
  users, 
  properties,
  contracts,
  visits,
  proposals,
  payments,
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
  type InsertPayment
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, ilike, desc } from "drizzle-orm";

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
  getProperty(id: string): Promise<Property | undefined>;
  listProperties(params?: SearchPropertyParams): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<boolean>;
  getUserProperties(userId: string): Promise<Property[]>;
  
  // Contract methods
  getContract(id: string): Promise<Contract | undefined>;
  listContracts(): Promise<Contract[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  getContractsByUser(userId: string): Promise<Contract[]>;
  getContractsByProperty(propertyId: string): Promise<Contract[]>;
  
  // Visit methods
  getVisit(id: string): Promise<Visit | undefined>;
  listVisits(): Promise<Visit[]>;
  createVisit(visit: InsertVisit): Promise<Visit>;
  updateVisit(id: string, visit: Partial<InsertVisit>): Promise<Visit | undefined>;
  deleteVisit(id: string): Promise<boolean>;
  getVisitsByClient(clienteId: string): Promise<Visit[]>;
  getVisitsByProperty(propertyId: string): Promise<Visit[]>;
  
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
  async getProperty(id: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
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
      if (params.bairro) {
        conditions.push(ilike(properties.bairro, `%${params.bairro}%`));
      }
      if (params.municipio) {
        conditions.push(ilike(properties.municipio, `%${params.municipio}%`));
      }
      if (params.provincia) {
        conditions.push(ilike(properties.provincia, `%${params.provincia}%`));
      }
      if (params.bedrooms !== undefined) {
        conditions.push(eq(properties.bedrooms, params.bedrooms));
      }
      if (params.minPrice !== undefined) {
        conditions.push(gte(properties.price, params.minPrice.toString()));
      }
      if (params.maxPrice !== undefined) {
        conditions.push(lte(properties.price, params.maxPrice.toString()));
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

  async listContracts(): Promise<Contract[]> {
    const results = await db.select().from(contracts).orderBy(desc(contracts.createdAt));
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

  async getContractsByUser(userId: string): Promise<Contract[]> {
    const results = await db
      .select()
      .from(contracts)
      .where(
        and(
          or(
            eq(contracts.clienteId, userId),
            eq(contracts.proprietarioId, userId)
          )
        )
      )
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
    const results = await db.select().from(visits).orderBy(desc(visits.createdAt));
    return results;
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
    const results = await db
      .select()
      .from(visits)
      .where(eq(visits.clienteId, clienteId))
      .orderBy(desc(visits.createdAt));
    return results;
  }

  async getVisitsByProperty(propertyId: string): Promise<Visit[]> {
    const results = await db
      .select()
      .from(visits)
      .where(eq(visits.propertyId, propertyId))
      .orderBy(desc(visits.createdAt));
    return results;
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
}

export const storage = new DatabaseStorage();
