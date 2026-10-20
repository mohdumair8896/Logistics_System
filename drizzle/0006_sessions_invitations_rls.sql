-- Access rules for the tables added in 0005.
-- invitations: tenant-scoped like every business table (app_rls sees only its workspace's invites).
-- sessions: system table, read and written only by the owner role (login, logout, revocation),
--           so the restricted role gets no access at all (ALTER DEFAULT PRIVILEGES granted it).

ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "invitations" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "invitations";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "invitations"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
--> statement-breakpoint
REVOKE ALL ON "sessions" FROM app_rls;
