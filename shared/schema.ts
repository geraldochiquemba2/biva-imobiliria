import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  userType: text("user_type").notNull(), // 'proprietario', 'cliente', 'corretor', 'gestor'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Properties table
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'Arrendar' or 'Vender'
  category: text("category").notNull(), // 'Apartamento', 'Casa', 'Comercial', 'Terreno'
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  bairro: text("bairro").notNull(),
  municipio: text("municipio").notNull(),
  provincia: text("provincia").notNull(),
  bedrooms: integer("bedrooms").notNull().default(0),
  bathrooms: integer("bathrooms").notNull().default(0),
  area: integer("area").notNull(), // in square meters
  image: text("image"),
  featured: boolean("featured").default(false),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
}));

export const propertiesRelations = relations(properties, ({ one }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const searchPropertySchema = z.object({
  type: z.enum(['Arrendar', 'Vender']).optional(),
  category: z.enum(['Apartamento', 'Casa', 'Comercial', 'Terreno']).optional(),
  bairro: z.string().optional(),
  municipio: z.string().optional(),
  provincia: z.string().optional(),
  bedrooms: z.number().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  featured: z.boolean().optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;
export type SearchPropertyParams = z.infer<typeof searchPropertySchema>;
