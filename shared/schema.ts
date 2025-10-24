import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Property types for BIVA platform
export type PropertyType = 'Arrendar' | 'Vender';
export type PropertyCategory = 'Apartamento' | 'Casa' | 'Comercial' | 'Terreno';

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  category: PropertyCategory;
  price: number;
  location: {
    bairro: string;
    municipio: string;
    provincia: string;
  };
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  featured?: boolean;
}

export interface UserProfile {
  id: string;
  title: string;
  description: string;
  icon: string;
}
