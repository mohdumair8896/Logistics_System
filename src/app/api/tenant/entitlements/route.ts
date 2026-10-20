// GET /api/tenant/entitlements — the signed-in workspace's profile and enabled modules.
// Source of truth for module gating in the sidebar (replaces the old localStorage profile).

import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { requireTenant, isAuthError } from '@/lib/auth';
import { withTenant } from '@/lib/tenancy';
import { tenants, tenantModules, tenantConfigs, tenantSubscriptions } from '@/lib/schema';
import { DEFAULT_ENABLED_MODULES } from '@/lib/entitlements/defaults';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  const tenantId = auth.tenantId;

  try {
    const profile = await withTenant(tenantId, async (tx) => {
      const [[tenant], modules, [config], [subscription]] = await Promise.all([
        tx.select().from(tenants).where(eq(tenants.id, tenantId)),
        tx.select({ code: tenantModules.moduleCode }).from(tenantModules)
          .where(and(eq(tenantModules.tenantId, tenantId), eq(tenantModules.isEnabled, true))),
        tx.select({ autonomyLevel: tenantConfigs.autonomyLevel }).from(tenantConfigs).where(eq(tenantConfigs.tenantId, tenantId)),
        tx.select({ plan: tenantSubscriptions.plan }).from(tenantSubscriptions)
          .where(eq(tenantSubscriptions.tenantId, tenantId))
          .orderBy(desc(tenantSubscriptions.createdAt)).limit(1),
      ]);
      if (!tenant) return null;
      return {
        id: tenant.id,
        name: tenant.name,
        archetype: tenant.archetype,
        plan: subscription?.plan ?? 'GROWTH',
        score: tenant.complexityScore ?? 0,
        // Workspaces that haven't finished /setup get the standard module set
        enabledModules: modules.length > 0 ? modules.map(m => m.code) : [...DEFAULT_ENABLED_MODULES],
        autonomyLevel: config?.autonomyLevel ?? 2,
      };
    });

    if (!profile) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    return NextResponse.json(profile);
  } catch (err) {
    console.error('[GET /api/tenant/entitlements]', err);
    return NextResponse.json({ error: 'Failed to load workspace entitlements' }, { status: 500 });
  }
}
