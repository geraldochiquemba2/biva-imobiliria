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
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  userType: text("user_type").notNull(), // 'proprietario', 'cliente', 'corretor'
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
  status: text("status").notNull().default('disponivel'), // 'disponivel', 'arrendado', 'vendido', 'indisponivel'
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Contracts table
export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  proprietarioId: varchar("proprietario_id").notNull().references(() => users.id),
  clienteId: varchar("cliente_id").notNull().references(() => users.id),
  tipo: text("tipo").notNull(), // 'arrendamento' or 'venda'
  valor: decimal("valor", { precision: 15, scale: 2 }).notNull(),
  dataInicio: timestamp("data_inicio").notNull(),
  dataFim: timestamp("data_fim"), // null for venda
  status: text("status").notNull().default('ativo'), // 'ativo', 'encerrado', 'pendente'
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Visits table
export const visits = pgTable("visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  clienteId: varchar("cliente_id").notNull().references(() => users.id),
  dataHora: timestamp("data_hora").notNull(),
  status: text("status").notNull().default('agendada'), // 'agendada', 'concluida', 'cancelada'
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Proposals table
export const proposals = pgTable("proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  clienteId: varchar("cliente_id").notNull().references(() => users.id),
  valor: decimal("valor", { precision: 15, scale: 2 }).notNull(),
  mensagem: text("mensagem"),
  status: text("status").notNull().default('pendente'), // 'pendente', 'aceita', 'recusada'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
  valor: decimal("valor", { precision: 15, scale: 2 }).notNull(),
  dataVencimento: timestamp("data_vencimento").notNull(),
  dataPagamento: timestamp("data_pagamento"),
  status: text("status").notNull().default('pendente'), // 'pendente', 'pago', 'atrasado'
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedProperties: many(properties),
  contracts: many(contracts),
  visits: many(visits),
  proposals: many(proposals),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
  }),
  contracts: many(contracts),
  visits: many(visits),
  proposals: many(proposals),
}));

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  property: one(properties, {
    fields: [contracts.propertyId],
    references: [properties.id],
  }),
  proprietario: one(users, {
    fields: [contracts.proprietarioId],
    references: [users.id],
  }),
  cliente: one(users, {
    fields: [contracts.clienteId],
    references: [users.id],
  }),
  payments: many(payments),
}));

export const visitsRelations = relations(visits, ({ one }) => ({
  property: one(properties, {
    fields: [visits.propertyId],
    references: [properties.id],
  }),
  cliente: one(users, {
    fields: [visits.clienteId],
    references: [users.id],
  }),
}));

export const proposalsRelations = relations(proposals, ({ one }) => ({
  property: one(properties, {
    fields: [proposals.propertyId],
    references: [properties.id],
  }),
  cliente: one(users, {
    fields: [proposals.clienteId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  contract: one(contracts, {
    fields: [payments.contractId],
    references: [contracts.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
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
  status: z.string().optional(),
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
});

export const insertVisitSchema = createInsertSchema(visits).omit({
  id: true,
  createdAt: true,
});

export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;
export type SearchPropertyParams = z.infer<typeof searchPropertySchema>;

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type Visit = typeof visits.$inferSelect;

export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposals.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
