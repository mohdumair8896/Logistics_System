-- Access rules for the table added in 0011.
-- pod_records: tenant-scoped like every business table (app_rls sees only its workspace's PODs).
-- It is also append-only for every role: a POD record and its SHA-256 are written once at delivery, and
-- a changed row would no longer match its hash anyway. To purge records under a retention policy, an
-- administrator disables the trigger for that maintenance job, which is itself a visible, deliberate act.

ALTER TABLE "pod_records" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "pod_records" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "pod_records";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "pod_records"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
CREATE OR REPLACE FUNCTION pod_records_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'pod_records is append-only: % is not allowed', TG_OP;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS pod_records_append_only ON "pod_records";
--> statement-breakpoint
CREATE TRIGGER pod_records_append_only
  BEFORE UPDATE OR DELETE ON "pod_records"
  FOR EACH ROW EXECUTE FUNCTION pod_records_append_only();
