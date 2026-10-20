-- Row-Level Security: Postgres itself refuses cross-tenant reads and writes.
--
-- How it is activated (see docs/MIGRATIONS.md):
--   * The app's DB user (neondb_owner on Neon) has BYPASSRLS, so policies never apply to it directly.
--   * Tenant-scoped requests run in withTenant() (src/lib/tenancy.ts), which does
--       SET LOCAL ROLE app_rls; select set_config('app.tenant_id', <tenant>, true)
--     when DB_RLS_ROLE=app_rls is set. app_rls has no BYPASSRLS, so every policy below applies.
--   * System work (login, signup, public tracking lookups, cron sweeps) stays on the owner role.
-- Applying this migration without setting DB_RLS_ROLE changes nothing at runtime.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_rls') THEN
    CREATE ROLE app_rls NOLOGIN NOBYPASSRLS;
  END IF;
END
$$;
--> statement-breakpoint
GRANT app_rls TO CURRENT_USER WITH INHERIT FALSE, SET TRUE;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO app_rls;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_rls;
--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_rls;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_rls;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_rls;
--> statement-breakpoint
-- Tenant-scoped requests never need the global login table (password hashes, all emails).
REVOKE ALL ON "users" FROM app_rls;
--> statement-breakpoint
-- The tenant for the current transaction, or NULL when none is set (then policies match nothing).
CREATE OR REPLACE FUNCTION app_current_tenant() RETURNS text
LANGUAGE sql STABLE
AS $$ SELECT nullif(current_setting('app.tenant_id', true), '') $$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app_current_tenant() TO app_rls;
--> statement-breakpoint
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "customers" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "customers";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "customers"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "products" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "products";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "products"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "inventory" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "inventory" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "inventory";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "inventory"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "drivers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "drivers" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "drivers";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "drivers"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "vehicles" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "vehicles";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "vehicles"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "orders" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "orders";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "orders"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "trips" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "trips" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "trips";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "trips"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "invoices" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "invoices";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "invoices"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "driver_messages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "driver_messages" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "driver_messages";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "driver_messages"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "system_alerts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "system_alerts" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "system_alerts";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "system_alerts"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "shipper_leads" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "shipper_leads" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "shipper_leads";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "shipper_leads"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "knowledge_base" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "knowledge_base" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "knowledge_base";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "knowledge_base"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "gps_pings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "gps_pings" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "gps_pings";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "gps_pings"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "incidents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "incidents" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "incidents";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "incidents"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "agent_workflows" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "agent_workflows" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "agent_workflows";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "agent_workflows"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "agent_audit_logs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "agent_audit_logs" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "agent_audit_logs";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "agent_audit_logs"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "operational_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "operational_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "operational_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "operational_events"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "memberships" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "memberships";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "memberships"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "tenant_modules" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tenant_modules" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "tenant_modules";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "tenant_modules"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "tenant_configs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tenant_configs" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "tenant_configs";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "tenant_configs"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "tenant_subscriptions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tenant_subscriptions" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "tenant_subscriptions";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "tenant_subscriptions"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "usage_counters" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "usage_counters" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "usage_counters";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "usage_counters"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tenants" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "tenants";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "tenants"
  USING ("id" = app_current_tenant())
  WITH CHECK ("id" = app_current_tenant());
