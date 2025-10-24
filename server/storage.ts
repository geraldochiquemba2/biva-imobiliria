// Reference: blueprint:javascript_database
import { 
  users, 
  properties,
  type User, 
  type InsertUser,
  type Property,
  type InsertProperty,
  type SearchPropertyParams
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, ilike, or, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Property methods
  getProperty(id: string): Promise<Property | undefined>;
  listProperties(params?: SearchPropertyParams): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<boolean>;
  getUserProperties(userId: string): Promise<Property[]>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
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
}

export const storage = new DatabaseStorage();
