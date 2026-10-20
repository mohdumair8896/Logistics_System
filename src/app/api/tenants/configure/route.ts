// POST /api/tenants/configure — save the /setup questionnaire for the signed-in workspace:
// archetype + score on the tenant, enabled modules (tenant_modules), autonomy level and
// integrations (tenant_configs). Then re-issue the session with isConfigured: true.

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireTenant, isAuthError, createSessionToken, COOKIE_OPTIONS } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { withTenant } from '@/lib/tenancy';
import { parseJsonBody } from '@/lib/validation';
import { tenants, tenantModules, tenantConfigs } from '@/lib/schema';

const moduleCode = z.string().regex(/^[A-Z][A-Z0-9_]{1,49}$/, 'Invalid module code');

const configureSchema = z.object({
  archetype: z.string().regex(/^[A-Z0-9_]{2,40}$/).optional().default('FLEET_OWNER'),
  complexityScore: z.number().int().min(0).max(100).optional().default(25),
  companyName: z.string().trim().min(1).max(150).optional(),
  enabledModules: z.array(moduleCode).max(50).optional(),
  autonomyLevel: z.number().int().min(0).max(5).optional(),
  activeIntegrations: z.array(z.string().trim().min(1).max(50)).max(50).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenant(request);
    if (isAuthError(auth)) return auth;
    const denied = requirePermission(auth, 'tenant.configure');
    if (denied) return denied;

    const parsed = await parseJsonBody(request, configureSchema);
    if (!parsed.ok) return parsed.response;
    const { archetype, complexityScore, companyName, enabledModules, autonomyLevel, activeIntegrations } = parsed.data;
    const tenantId = auth.tenantId;

    const tenantName = await withTenant(tenantId, async (tx) => {
      const [existing] = await tx.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, tenantId));
      if (!existing) return null;

      await tx.update(tenants).set({
        archetype,
        complexityScore,
        isConfigured: true,
        name: companyName || existing.name,
      }).where(eq(tenants.id, tenantId));

      // Module entitlements: replace the set with what the questionnaire recommended
      if (enabledModules) {
        await tx.delete(tenantModules).where(eq(tenantModules.tenantId, tenantId));
        const unique = Array.from(new Set(enabledModules));
        if (unique.length > 0) {
          await tx.insert(tenantModules).values(unique.map(code => ({ tenantId, moduleCode: code, isEnabled: true })));
        }
      }

      if (autonomyLevel !== undefined || activeIntegrations !== undefined) {
        const values = {
          ...(autonomyLevel !== undefined ? { autonomyLevel } : {}),
          ...(activeIntegrations !== undefined ? { activeIntegrations } : {}),
          updatedAt: new Date(),
        };
        await tx.insert(tenantConfigs).values({ tenantId, ...values })
          .onConflictDoUpdate({ target: tenantConfigs.tenantId, set: values });
      }

      return companyName || existing.name;
    });

    if (!tenantName) {
      return NextResponse.json({ success: false, message: 'Workspace not found' }, { status: 404 });
    }

    // Re-issue the session token with isConfigured: true
    const updatedToken = await createSessionToken({
      sid: auth.sid, // same server-side session, refreshed claims
      userId: auth.userId,
      email: auth.email,
      role: auth.role,
      name: auth.name,
      facility: companyName || auth.facility,
      avatar: auth.avatar,
      tenantId,
      isConfigured: true, // <<-- Now fully unlocked!
      plan: auth.plan || 'GROWTH',
      companyName: tenantName,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Logistics OS workspace successfully assembled and provisioned',
    });

    response.cookies.set({
      ...COOKIE_OPTIONS,
      value: updatedToken,
    });

    return response;
  } catch (err) {
    console.error('[POST /api/tenants/configure]', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
