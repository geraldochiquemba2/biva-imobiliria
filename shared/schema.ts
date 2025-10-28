import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username"),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull().unique(),
  sms: text("sms"),
  userTypes: text("user_types").array().notNull(), // ['proprietario', 'cliente', 'corretor', 'admin']
  status: text("status").notNull().default('ativo'), // 'ativo', 'bloqueado'
  address: text("address"),
  bi: text("bi"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
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
  livingRooms: integer("living_rooms").notNull().default(0),
  kitchens: integer("kitchens").notNull().default(0),
  area: integer("area").notNull(), // in square meters
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  images: text("images").array(), // Array de base64 strings
  amenities: text("amenities").array(),
  featured: boolean("featured").default(false),
  status: text("status").notNull().default('disponivel'), // 'disponivel', 'arrendado', 'vendido', 'indisponivel'
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index("properties_owner_idx").on(table.ownerId),
  statusIdx: index("properties_status_idx").on(table.status),
  featuredIdx: index("properties_featured_idx").on(table.featured),
}));

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
  status: text("status").notNull().default('pendente_assinaturas'), // 'pendente_assinaturas', 'assinado_proprietario', 'assinado_cliente', 'ativo', 'encerrado'
  contractContent: text("contract_content"), // Conteúdo completo do contrato gerado
  proprietarioSignature: text("proprietario_signature"), // Assinatura digital do proprietário
  proprietarioSignedAt: timestamp("proprietario_signed_at"),
  proprietarioConfirmedAt: timestamp("proprietario_confirmed_at"), // Confirmação após assinatura
  clienteSignature: text("cliente_signature"), // Assinatura digital do cliente
  clienteSignedAt: timestamp("cliente_signed_at"),
  clienteConfirmedAt: timestamp("cliente_confirmed_at"), // Confirmação após assinatura
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  proprietarioIdx: index("contracts_proprietario_idx").on(table.proprietarioId),
  clienteIdx: index("contracts_cliente_idx").on(table.clienteId),
  propertyIdx: index("contracts_property_idx").on(table.propertyId),
  statusIdx: index("contracts_status_idx").on(table.status),
}));

// Visits table
export const visits = pgTable("visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  clienteId: varchar("cliente_id").notNull().references(() => users.id),
  requestedDateTime: timestamp("requested_date_time").notNull(), // Data/hora solicitada pelo cliente
  scheduledDateTime: timestamp("scheduled_date_time"), // Data/hora confirmada por ambos
  ownerProposedDateTime: timestamp("owner_proposed_date_time"), // Contraproposta do proprietário
  status: text("status").notNull().default('pendente_proprietario'), // 'pendente_proprietario', 'pendente_cliente', 'agendada', 'concluida', 'recusada', 'cancelada'
  lastActionBy: text("last_action_by"), // 'cliente' ou 'proprietario'
  clientMessage: text("client_message"),
  ownerMessage: text("owner_message"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index("visits_property_idx").on(table.propertyId),
  clienteIdx: index("visits_cliente_idx").on(table.clienteId),
  statusIdx: index("visits_status_idx").on(table.status),
}));

// Proposals table
export const proposals = pgTable("proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  clienteId: varchar("cliente_id").notNull().references(() => users.id),
  valor: decimal("valor", { precision: 15, scale: 2 }).notNull(),
  mensagem: text("mensagem"),
  status: text("status").notNull().default('pendente'), // 'pendente', 'aceita', 'recusada'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index("proposals_property_idx").on(table.propertyId),
  clienteIdx: index("proposals_cliente_idx").on(table.clienteId),
  statusIdx: index("proposals_status_idx").on(table.status),
}));

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
}, (table) => ({
  contractIdx: index("payments_contract_idx").on(table.contractId),
  statusIdx: index("payments_status_idx").on(table.status),
}));

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'visit_requested', 'visit_owner_response', 'visit_client_response', 'visit_confirmed'
  title: text("title").notNull(),
  message: text("message").notNull(),
  entityId: varchar("entity_id"), // ID da visita, contrato, etc
  payload: text("payload"), // JSON string with additional data
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("notifications_user_idx").on(table.userId),
  readAtIdx: index("notifications_read_at_idx").on(table.readAt),
}));

// Virtual Tours table
export const virtualTours = pgTable("virtual_tours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  name: text("name").notNull(),
  description: text("description"),
  startingRoomId: varchar("starting_room_id"), // ID do cômodo inicial
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index("virtual_tours_property_idx").on(table.propertyId),
}));

// Tour Rooms table (individual 360° photos/rooms)
export const tourRooms = pgTable("tour_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tourId: varchar("tour_id").notNull().references(() => virtualTours.id, { onDelete: 'cascade' }),
  name: text("name").notNull(), // Nome do cômodo (ex: "Sala de Estar", "Quarto Principal")
  image: text("image").notNull(), // Base64 ou URL da foto 360°
  orderIndex: integer("order_index").notNull().default(0), // Ordem de exibição
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tourIdx: index("tour_rooms_tour_idx").on(table.tourId),
}));

// Tour Hotspots table (clickable points to navigate between rooms)
export const tourHotspots = pgTable("tour_hotspots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromRoomId: varchar("from_room_id").notNull().references(() => tourRooms.id, { onDelete: 'cascade' }),
  toRoomId: varchar("to_room_id").notNull().references(() => tourRooms.id, { onDelete: 'cascade' }),
  yaw: decimal("yaw", { precision: 10, scale: 6 }).notNull(), // Ângulo horizontal (0-360)
  pitch: decimal("pitch", { precision: 10, scale: 6 }).notNull(), // Ângulo vertical (-90 a 90)
  label: text("label"), // Texto do hotspot (ex: "Ir para Quarto")
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  fromRoomIdx: index("tour_hotspots_from_room_idx").on(table.fromRoomId),
  toRoomIdx: index("tour_hotspots_to_room_idx").on(table.toRoomId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedProperties: many(properties),
  contracts: many(contracts),
  visits: many(visits),
  proposals: many(proposals),
  notifications: many(notifications),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
  }),
  contracts: many(contracts),
  visits: many(visits),
  proposals: many(proposals),
  virtualTours: many(virtualTours),
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

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const virtualToursRelations = relations(virtualTours, ({ one, many }) => ({
  property: one(properties, {
    fields: [virtualTours.propertyId],
    references: [properties.id],
  }),
  rooms: many(tourRooms),
}));

export const tourRoomsRelations = relations(tourRooms, ({ one, many }) => ({
  tour: one(virtualTours, {
    fields: [tourRooms.tourId],
    references: [virtualTours.id],
  }),
  hotspotsFrom: many(tourHotspots, { relationName: "from_room" }),
  hotspotsTo: many(tourHotspots, { relationName: "to_room" }),
}));

export const tourHotspotsRelations = relations(tourHotspots, ({ one }) => ({
  fromRoom: one(tourRooms, {
    fields: [tourHotspots.fromRoomId],
    references: [tourRooms.id],
    relationName: "from_room",
  }),
  toRoom: one(tourRooms, {
    fields: [tourHotspots.toRoomId],
    references: [tourRooms.id],
    relationName: "to_room",
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  phone: z.string().min(9, "Número de telefone inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  username: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  sms: z.string().optional().nullable(),
  address: z.string().min(5, "Endereço deve ter no mínimo 5 caracteres"),
  bi: z.string().optional().nullable(),
  profileImage: z.string().optional().nullable(),
  userTypes: z.array(z.enum(['proprietario', 'cliente', 'corretor', 'admin'])).min(1, "Selecione pelo menos um tipo de conta"),
});

export const loginSchema = z.object({
  phone: z.string().min(9, "Número de telefone inválido"),
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
  location: z.string().optional(),
  bairro: z.string().optional(),
  municipio: z.string().optional(),
  provincia: z.string().optional(),
  bedrooms: z.number().optional(),
  livingRooms: z.number().optional(),
  kitchens: z.number().optional(),
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
}).extend({
  requestedDateTime: z.coerce.date(),
  scheduledDateTime: z.coerce.date().optional().nullable(),
  ownerProposedDateTime: z.coerce.date().optional().nullable(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
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

export const insertVirtualTourSchema = createInsertSchema(virtualTours).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTourRoomSchema = createInsertSchema(tourRooms).omit({
  id: true,
  createdAt: true,
});

export const insertTourHotspotSchema = createInsertSchema(tourHotspots).omit({
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

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertVirtualTour = z.infer<typeof insertVirtualTourSchema>;
export type VirtualTour = typeof virtualTours.$inferSelect;

export type InsertTourRoom = z.infer<typeof insertTourRoomSchema>;
export type TourRoom = typeof tourRooms.$inferSelect;

export type InsertTourHotspot = z.infer<typeof insertTourHotspotSchema>;
export type TourHotspot = typeof tourHotspots.$inferSelect;

export type PropertyWithOwner = Property & {
  owner: Omit<User, 'password'>;
};

export type VirtualTourWithRooms = VirtualTour & {
  rooms: (TourRoom & {
    hotspotsFrom: TourHotspot[];
  })[];
};
