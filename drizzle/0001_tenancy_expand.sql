CREATE TABLE "id_counters" (
	"kind" varchar(20) PRIMARY KEY NOT NULL,
	"last_value" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"user_id" varchar(50) NOT NULL,
	"tenant_id" varchar(50) NOT NULL,
	"role" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "memberships_user_id_tenant_id_pk" PRIMARY KEY("user_id","tenant_id")
);
--> statement-breakpoint
ALTER TABLE "drivers" DROP CONSTRAINT "drivers_license_no_unique";--> statement-breakpoint
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_vehicle_no_unique";--> statement-breakpoint
ALTER TABLE "agent_audit_logs" ADD COLUMN "tenant_id" varchar(50);--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD COLUMN "tenant_id" varchar(50);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "tenant_id" varchar(50);--> statement-breakpoint
ALTER TABLE "driver_messages" ADD COLUMN "tenant_id" varchar(50);--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "tenant_id" varchar(50);--> statement-breakpoint
ALTER TABLE "gps_pings" ADD COLUMN "tenant_id" varchar(50);--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "tenant_id" varchar(50);--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "tenant_id" varchar(50);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "tenant_id" varchar(50);--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD COLUMN "tenant_id" varchar(50);--> statement-breakpoint
ALTER TABLE "operational_events" ADD COLUMN "tenant_id" varchar(50);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tenant_id" varchar(50);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tenant_id" varchar(50);--> statement-breakpoint
ALTER TABLE "shipper_leads" ADD COLUMN "tenant_id" varchar(50);--> statement-breakpoint
ALTER TABLE "system_alerts" ADD COLUMN "tenant_id" varchar(50);--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "tenant_id" varchar(50);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "tenant_id" varchar(50);--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_memberships_tenant" ON "memberships" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "agent_audit_logs" ADD CONSTRAINT "agent_audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD CONSTRAINT "agent_workflows_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_messages" ADD CONSTRAINT "driver_messages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gps_pings" ADD CONSTRAINT "gps_pings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operational_events" ADD CONSTRAINT "operational_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipper_leads" ADD CONSTRAINT "shipper_leads_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_alerts" ADD CONSTRAINT "system_alerts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agent_audit_logs_tenant_created" ON "agent_audit_logs" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_agent_workflows_tenant_created" ON "agent_workflows" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_customers_tenant" ON "customers" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "idx_driver_messages_tenant_driver" ON "driver_messages" USING btree ("tenant_id","driver_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_drivers_tenant_status" ON "drivers" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_gps_pings_tenant_vehicle_created" ON "gps_pings" USING btree ("tenant_id","vehicle_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_incidents_tenant_status" ON "incidents" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_inventory_tenant_product" ON "inventory" USING btree ("tenant_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_tenant_status" ON "invoices" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_invoices_tenant_order" ON "invoices" USING btree ("tenant_id","order_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_base_tenant" ON "knowledge_base" USING btree ("tenant_id","category");--> statement-breakpoint
CREATE INDEX "idx_op_events_tenant_created" ON "operational_events" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_op_events_tenant_approval" ON "operational_events" USING btree ("tenant_id","approval_status");--> statement-breakpoint
CREATE INDEX "idx_orders_tenant_status_created" ON "orders" USING btree ("tenant_id","status","created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_tenant_customer" ON "orders" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "idx_products_tenant" ON "products" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "idx_shipper_leads_tenant_status" ON "shipper_leads" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_system_alerts_tenant_created" ON "system_alerts" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_trips_tenant_status" ON "trips" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_trips_tenant_order" ON "trips" USING btree ("tenant_id","order_id");--> statement-breakpoint
CREATE INDEX "idx_vehicles_tenant_status" ON "vehicles" USING btree ("tenant_id","status");--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "uq_drivers_tenant_license_no" UNIQUE("tenant_id","license_no");--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "uq_vehicles_tenant_vehicle_no" UNIQUE("tenant_id","vehicle_no");