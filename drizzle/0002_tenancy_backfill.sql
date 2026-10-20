-- Tenancy backfill: give every existing row an owning tenant. Idempotent (only touches NULLs),
-- so it is safe to re-run if rows were written by old code between deploy steps.

-- 1. A workspace for data created before tenancy existed (seed/demo data and unlinked staff).
--    Reassign rows later if they really belong to a customer (see docs/MIGRATIONS.md).
INSERT INTO "tenants" ("id", "name", "slug", "archetype", "country", "currency", "timezone", "complexity_score", "is_configured")
VALUES ('ten_legacy_workspace', 'Legacy Workspace', 'legacy-workspace', 'FLEET_OWNER', 'IN', 'INR', 'Asia/Kolkata', 25, true)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint

-- 2. Signup admins were created as usr_<slug>_<nnnn> alongside tenant ten_<slug>-<nnnn>,
--    but the user row never stored the link. Restore it.
UPDATE "users" AS u
SET "tenant_id" = t."id"
FROM "tenants" AS t
WHERE u."tenant_id" IS NULL
  AND u."id" ~ '^usr_.+_[0-9]{4}$'
  AND t."id" = 'ten_' || regexp_replace(substr(u."id", 5), '_([0-9]{4})$', '-\1');
--> statement-breakpoint

-- 3. Remaining users (seeded staff) belong to the legacy workspace.
UPDATE "users" SET "tenant_id" = 'ten_legacy_workspace' WHERE "tenant_id" IS NULL;
--> statement-breakpoint

-- 4. Memberships mirror each user's default workspace and role.
INSERT INTO "memberships" ("user_id", "tenant_id", "role")
SELECT "id", "tenant_id", "role" FROM "users" WHERE "tenant_id" IS NOT NULL
ON CONFLICT DO NOTHING;
--> statement-breakpoint

-- 5. Business rows that predate tenancy go to the legacy workspace.
UPDATE "customers" SET "tenant_id" = 'ten_legacy_workspace' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "products" SET "tenant_id" = 'ten_legacy_workspace' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "inventory" SET "tenant_id" = 'ten_legacy_workspace' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "drivers" SET "tenant_id" = 'ten_legacy_workspace' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "vehicles" SET "tenant_id" = 'ten_legacy_workspace' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "orders" SET "tenant_id" = 'ten_legacy_workspace' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "trips" SET "tenant_id" = 'ten_legacy_workspace' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "invoices" SET "tenant_id" = 'ten_legacy_workspace' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "driver_messages" SET "tenant_id" = 'ten_legacy_workspace' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "system_alerts" SET "tenant_id" = 'ten_legacy_workspace' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "shipper_leads" SET "tenant_id" = 'ten_legacy_workspace' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "knowledge_base" SET "tenant_id" = 'ten_legacy_workspace' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "gps_pings" SET "tenant_id" = 'ten_legacy_workspace' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "incidents" SET "tenant_id" = 'ten_legacy_workspace' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "agent_workflows" SET "tenant_id" = 'ten_legacy_workspace' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "agent_audit_logs" SET "tenant_id" = 'ten_legacy_workspace' WHERE "tenant_id" IS NULL;
--> statement-breakpoint
UPDATE "operational_events" SET "tenant_id" = 'ten_legacy_workspace' WHERE "tenant_id" IS NULL;
--> statement-breakpoint

-- 6. Seed the ID counters with the highest number already used, so the next ID continues from it.
--    Kinds and starting values must match ID_KINDS in src/lib/ids.ts.
INSERT INTO "id_counters" ("kind", "last_value")
SELECT 'ORD', coalesce(max(nullif(regexp_replace("id", '[^0-9]', '', 'g'), '')::bigint), 1000) FROM "orders"
UNION ALL SELECT 'TRP', coalesce(max(nullif(regexp_replace("id", '[^0-9]', '', 'g'), '')::bigint), 1000) FROM "trips"
UNION ALL SELECT 'INV', coalesce(max(nullif(regexp_replace("id", '[^0-9]', '', 'g'), '')::bigint), 1000) FROM "invoices"
UNION ALL SELECT 'CUST', coalesce(max(nullif(regexp_replace("id", '[^0-9]', '', 'g'), '')::bigint), 0) FROM "customers"
UNION ALL SELECT 'DRV', coalesce(max(nullif(regexp_replace("id", '[^0-9]', '', 'g'), '')::bigint), 0) FROM "drivers"
UNION ALL SELECT 'VEH', coalesce(max(nullif(regexp_replace("id", '[^0-9]', '', 'g'), '')::bigint), 0) FROM "vehicles"
UNION ALL SELECT 'LEAD', coalesce(max(nullif(regexp_replace("id", '[^0-9]', '', 'g'), '')::bigint), 1000) FROM "shipper_leads"
UNION ALL SELECT 'KB', coalesce(max(nullif(regexp_replace("id", '[^0-9]', '', 'g'), '')::bigint), 100) FROM "knowledge_base"
ON CONFLICT ("kind") DO UPDATE SET "last_value" = greatest("id_counters"."last_value", excluded."last_value");
