-- Access rules for the table added in 0009.
-- gst_options: tenant-scoped like every business table (app_rls sees only its workspace's GST options).

ALTER TABLE "gst_options" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "gst_options" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "gst_options";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "gst_options"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
