CREATE TABLE "agent_audit_logs" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar(50) NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"entity_id" varchar(50),
	"message" text NOT NULL,
	"payload" json DEFAULT '{}'::json,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_workflows" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar(50) NOT NULL,
	"trigger_event" varchar(50) NOT NULL,
	"status" varchar(30) NOT NULL,
	"reasoning_steps" json DEFAULT '[]'::json,
	"outcome_summary" text,
	"duration_ms" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"contact" varchar(100),
	"phone" varchar(20),
	"address" text,
	"gstin" varchar(20),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "driver_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" varchar(20),
	"sender" varchar(20) NOT NULL,
	"text" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"license_no" varchar(30) NOT NULL,
	"license_expiry" date NOT NULL,
	"vehicle_id" varchar(20),
	"status" varchar(20) DEFAULT 'Available',
	"trips_count" integer DEFAULT 0,
	"rating" numeric(3, 1) DEFAULT '5.0',
	"document_verified" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "drivers_license_no_unique" UNIQUE("license_no")
);
--> statement-breakpoint
CREATE TABLE "gps_pings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" varchar(20),
	"trip_id" varchar(20),
	"lat" numeric(10, 7) NOT NULL,
	"lng" numeric(10, 7) NOT NULL,
	"speed_kmh" numeric(6, 2),
	"accuracy" numeric(8, 2),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"trip_id" varchar(20),
	"order_id" varchar(20),
	"vehicle_id" varchar(20),
	"driver_id" varchar(20),
	"type" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" varchar(30) DEFAULT 'OPEN',
	"automated_action_taken" text,
	"root_cause" text,
	"financial_impact" numeric(10, 2) DEFAULT '0',
	"resolved_at" timestamp with time zone,
	"metadata" json DEFAULT '{}'::json,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar(20),
	"warehouse_id" varchar(20) NOT NULL,
	"quantity" integer DEFAULT 0,
	"bay" varchar(20),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"order_id" varchar(20),
	"customer_id" varchar(20),
	"trip_id" varchar(20),
	"freight" numeric(12, 2),
	"loading_charge" numeric(10, 2),
	"unloading_charge" numeric(10, 2),
	"damage_deduction" numeric(10, 2) DEFAULT '0',
	"subtotal" numeric(12, 2),
	"gst" numeric(10, 2),
	"total" numeric(12, 2),
	"status" varchar(20) DEFAULT 'Pending',
	"pod_signed" boolean DEFAULT false,
	"pod_image_url" text,
	"pdf_url" text,
	"receiver_name" varchar(100),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"category" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"keywords" json DEFAULT '[]'::json,
	"last_updated" date DEFAULT CURRENT_DATE,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "operational_events" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" varchar(20),
	"trip_id" varchar(20),
	"vehicle_id" varchar(20),
	"driver_id" varchar(20),
	"event_type" varchar(50) NOT NULL,
	"actor" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text,
	"lat" numeric(10, 7),
	"lng" numeric(10, 7),
	"payload" json DEFAULT '{}'::json,
	"evidence" json DEFAULT '{}'::json,
	"policy_id" varchar(50),
	"autonomy_level" integer DEFAULT 3,
	"approval_required" boolean DEFAULT false,
	"approval_status" varchar(30) DEFAULT 'AUTO_APPROVED',
	"action_draft" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"customer_id" varchar(20),
	"origin" text NOT NULL,
	"destination" text NOT NULL,
	"items" json DEFAULT '[]'::json,
	"total_weight_kg" integer NOT NULL,
	"status" varchar(20) DEFAULT 'Pending',
	"vehicle_id" varchar(20),
	"driver_id" varchar(20),
	"distance_km" integer,
	"freight_rate" numeric(5, 2),
	"loading_bay" varchar(20),
	"deadline" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"category" varchar(100),
	"price_per_kg" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shipper_leads" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"shipper_name" varchar(100) NOT NULL,
	"company_name" varchar(200),
	"phone" varchar(20),
	"email" varchar(255),
	"origin_hub" text,
	"destination_hub" text,
	"cargo_type" varchar(50),
	"estimated_weight_kg" integer,
	"freight_quote" numeric(12, 2),
	"target_delivery_date" date,
	"is_urgent" boolean DEFAULT false,
	"status" varchar(20) DEFAULT 'New',
	"transcript_snippet" text,
	"associated_order_id" varchar(20),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"severity" varchar(20) NOT NULL,
	"category" varchar(30) NOT NULL,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenant_configs" (
	"tenant_id" varchar(60) PRIMARY KEY NOT NULL,
	"autonomy_level" integer DEFAULT 2,
	"auto_approve_limit_amount" numeric(10, 2) DEFAULT '5000',
	"detention_grace_hours" integer DEFAULT 2,
	"sla_grace_minutes" integer DEFAULT 60,
	"driver_comm_channel" varchar(30) DEFAULT 'WHATSAPP',
	"custom_fields" json DEFAULT '{}'::json,
	"active_integrations" json DEFAULT '[]'::json,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenant_modules" (
	"id" varchar(60) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar(60) NOT NULL,
	"module_code" varchar(50) NOT NULL,
	"is_enabled" boolean DEFAULT true,
	"enabled_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenant_subscriptions" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(60) NOT NULL,
	"plan" varchar(30) NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE',
	"max_vehicles" integer DEFAULT 100,
	"max_monthly_shipments" integer DEFAULT 2500,
	"max_ai_actions" integer DEFAULT 7500,
	"renews_at" timestamp with time zone,
	"spending_limit_cap" numeric(12, 2) DEFAULT '50000',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"archetype" varchar(40) NOT NULL,
	"country" varchar(10) DEFAULT 'IN',
	"currency" varchar(5) DEFAULT 'INR',
	"timezone" varchar(50) DEFAULT 'Asia/Kolkata',
	"complexity_score" integer DEFAULT 25,
	"is_configured" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"order_id" varchar(20),
	"vehicle_id" varchar(20),
	"driver_id" varchar(20),
	"origin" text NOT NULL,
	"destination" text NOT NULL,
	"distance_km" integer NOT NULL,
	"load_kg" integer,
	"status" varchar(20) DEFAULT 'In Transit',
	"progress" integer DEFAULT 0,
	"started_at" text,
	"eta" text,
	"completed_at" text,
	"speed_kmh" integer,
	"fuel_percent" integer,
	"cargo_temp" text,
	"geofence_status" varchar(30),
	"checkpoints" json DEFAULT '[]'::json,
	"lat" numeric(10, 7),
	"lng" numeric(10, 7),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "usage_counters" (
	"id" varchar(60) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar(60) NOT NULL,
	"metric_period" varchar(7) NOT NULL,
	"shipments_count" integer DEFAULT 0,
	"ai_actions_count" integer DEFAULT 0,
	"whatsapp_messages_count" integer DEFAULT 0,
	"ocr_documents_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"role" varchar(50) NOT NULL,
	"facility" varchar(100),
	"avatar" varchar(10),
	"tenant_id" varchar(50),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"vehicle_no" varchar(20) NOT NULL,
	"type" varchar(50) NOT NULL,
	"capacity_kg" integer NOT NULL,
	"current_load_kg" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'Available',
	"driver_id" varchar(20),
	"location" text,
	"last_service" date,
	"odometer_km" integer DEFAULT 0,
	"fuel_level" integer DEFAULT 100,
	"traccar_device_id" integer,
	"lat" numeric(10, 7),
	"lng" numeric(10, 7),
	"activity_log" json DEFAULT '[]'::json,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "vehicles_vehicle_no_unique" UNIQUE("vehicle_no")
);
--> statement-breakpoint
ALTER TABLE "driver_messages" ADD CONSTRAINT "driver_messages_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gps_pings" ADD CONSTRAINT "gps_pings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_configs" ADD CONSTRAINT "tenant_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_modules" ADD CONSTRAINT "tenant_modules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_op_events_shipment_created" ON "operational_events" USING btree ("shipment_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_op_events_approval_status" ON "operational_events" USING btree ("approval_status","created_at");--> statement-breakpoint
CREATE INDEX "idx_op_events_event_type" ON "operational_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_tenant_modules_lookup" ON "tenant_modules" USING btree ("tenant_id","module_code");--> statement-breakpoint
CREATE INDEX "idx_usage_tenant_period" ON "usage_counters" USING btree ("tenant_id","metric_period");