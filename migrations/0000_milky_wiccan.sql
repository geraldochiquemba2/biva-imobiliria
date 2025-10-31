CREATE TABLE "advertisements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image" text NOT NULL,
	"link" text,
	"active" boolean DEFAULT true,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_by_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"proprietario_id" varchar NOT NULL,
	"cliente_id" varchar NOT NULL,
	"tipo" text NOT NULL,
	"valor" numeric(15, 2) NOT NULL,
	"data_inicio" timestamp NOT NULL,
	"data_fim" timestamp,
	"status" text DEFAULT 'pendente_assinaturas' NOT NULL,
	"contract_content" text,
	"proprietario_signature" text,
	"proprietario_signed_at" timestamp,
	"proprietario_confirmed_at" timestamp,
	"cliente_signature" text,
	"cliente_signed_at" timestamp,
	"cliente_confirmed_at" timestamp,
	"observacoes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"entity_id" varchar,
	"payload" text,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" varchar NOT NULL,
	"valor" numeric(15, 2) NOT NULL,
	"data_vencimento" timestamp NOT NULL,
	"data_pagamento" timestamp,
	"status" text DEFAULT 'pendente' NOT NULL,
	"observacoes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"bairro" text NOT NULL,
	"municipio" text NOT NULL,
	"provincia" text NOT NULL,
	"bedrooms" integer NOT NULL,
	"bathrooms" integer NOT NULL,
	"living_rooms" integer NOT NULL,
	"kitchens" integer NOT NULL,
	"area" integer NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"images" text[],
	"amenities" text[],
	"featured" boolean DEFAULT false,
	"status" text DEFAULT 'disponivel' NOT NULL,
	"owner_id" varchar NOT NULL,
	"approval_status" text DEFAULT 'pendente' NOT NULL,
	"rejection_message" text,
	"rejection_acknowledged" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"cliente_id" varchar NOT NULL,
	"valor" numeric(15, 2) NOT NULL,
	"mensagem" text,
	"status" text DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tour_hotspots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_room_id" varchar NOT NULL,
	"to_room_id" varchar NOT NULL,
	"yaw" numeric(10, 6) NOT NULL,
	"pitch" numeric(10, 6) NOT NULL,
	"label" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tour_rooms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tour_id" varchar NOT NULL,
	"name" text NOT NULL,
	"image" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text,
	"password" text NOT NULL,
	"email" text,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"sms" text,
	"user_types" text[] NOT NULL,
	"status" text DEFAULT 'ativo' NOT NULL,
	"address" text,
	"bi" text,
	"profile_image" text,
	"saved_signature" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "virtual_tours" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"starting_room_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"cliente_id" varchar NOT NULL,
	"requested_date_time" timestamp NOT NULL,
	"scheduled_date_time" timestamp,
	"owner_proposed_date_time" timestamp,
	"status" text DEFAULT 'pendente_proprietario' NOT NULL,
	"last_action_by" text,
	"client_message" text,
	"owner_message" text,
	"observacoes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_proprietario_id_users_id_fk" FOREIGN KEY ("proprietario_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_cliente_id_users_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_cliente_id_users_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_hotspots" ADD CONSTRAINT "tour_hotspots_from_room_id_tour_rooms_id_fk" FOREIGN KEY ("from_room_id") REFERENCES "public"."tour_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_hotspots" ADD CONSTRAINT "tour_hotspots_to_room_id_tour_rooms_id_fk" FOREIGN KEY ("to_room_id") REFERENCES "public"."tour_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_rooms" ADD CONSTRAINT "tour_rooms_tour_id_virtual_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."virtual_tours"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "virtual_tours" ADD CONSTRAINT "virtual_tours_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_cliente_id_users_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "advertisements_active_idx" ON "advertisements" USING btree ("active");--> statement-breakpoint
CREATE INDEX "advertisements_order_idx" ON "advertisements" USING btree ("order_index");--> statement-breakpoint
CREATE INDEX "advertisements_active_order_idx" ON "advertisements" USING btree ("active","order_index");--> statement-breakpoint
CREATE INDEX "contracts_proprietario_idx" ON "contracts" USING btree ("proprietario_id");--> statement-breakpoint
CREATE INDEX "contracts_cliente_idx" ON "contracts" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "contracts_property_idx" ON "contracts" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "contracts_status_idx" ON "contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_read_at_idx" ON "notifications" USING btree ("read_at");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_created_at_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_read_at_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "payments_contract_idx" ON "payments" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "properties_owner_idx" ON "properties" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "properties_status_idx" ON "properties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "properties_type_idx" ON "properties" USING btree ("type");--> statement-breakpoint
CREATE INDEX "properties_category_idx" ON "properties" USING btree ("category");--> statement-breakpoint
CREATE INDEX "properties_municipio_idx" ON "properties" USING btree ("municipio");--> statement-breakpoint
CREATE INDEX "properties_provincia_idx" ON "properties" USING btree ("provincia");--> statement-breakpoint
CREATE INDEX "properties_created_at_idx" ON "properties" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "properties_status_featured_idx" ON "properties" USING btree ("status","featured");--> statement-breakpoint
CREATE INDEX "properties_type_status_idx" ON "properties" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "properties_status_created_at_idx" ON "properties" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "properties_approval_status_idx" ON "properties" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "properties_approval_status_owner_idx" ON "properties" USING btree ("approval_status","owner_id");--> statement-breakpoint
CREATE INDEX "proposals_property_idx" ON "proposals" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "proposals_cliente_idx" ON "proposals" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "proposals_status_idx" ON "proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tour_hotspots_from_room_idx" ON "tour_hotspots" USING btree ("from_room_id");--> statement-breakpoint
CREATE INDEX "tour_hotspots_to_room_idx" ON "tour_hotspots" USING btree ("to_room_id");--> statement-breakpoint
CREATE INDEX "tour_rooms_tour_idx" ON "tour_rooms" USING btree ("tour_id");--> statement-breakpoint
CREATE INDEX "virtual_tours_property_idx" ON "virtual_tours" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "visits_property_idx" ON "visits" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "visits_cliente_idx" ON "visits" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "visits_status_idx" ON "visits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "visits_scheduled_date_time_idx" ON "visits" USING btree ("scheduled_date_time");--> statement-breakpoint
CREATE INDEX "visits_cliente_status_idx" ON "visits" USING btree ("cliente_id","status");--> statement-breakpoint
CREATE INDEX "visits_property_status_idx" ON "visits" USING btree ("property_id","status");