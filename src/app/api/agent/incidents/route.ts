// ─── Agent API — GET / PATCH /api/agent/incidents ─────────────────────────────
// Endpoint to view and manage autonomous operational incidents.

import { NextRequest, NextResponse } from 'next/server';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { withTenant } from '@/lib/tenancy';
import { incidents } from '@/lib/schema';
import { and, desc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;

  try {
    const list = await withTenant(auth.tenantId, tx => tx.select().from(incidents)
      .where(eq(incidents.tenantId, auth.tenantId))
      .orderBy(desc(incidents.createdAt)).limit(50));
    return NextResponse.json({ success: true, incidents: list });
  } catch (err: unknown) {
    console.error('[/api/agent/incidents]', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'incident.manage');
  if (denied) return denied;

  try {
    const body = await req.json();
    const { id, status, resolutionNote } = body || {};

    if (typeof id !== 'string' || !id) {
      return NextResponse.json({ success: false, message: 'Missing incident "id"' }, { status: 400 });
    }
    const nextStatus = status ?? 'RESOLVED';
    if (!['OPEN', 'INVESTIGATING', 'AUTO_RESOLVED', 'RESOLVED', 'ESCALATED'].includes(nextStatus)) {
      return NextResponse.json({ success: false, message: 'Invalid incident status' }, { status: 400 });
    }

    const updated = await withTenant(auth.tenantId, tx => tx
      .update(incidents)
      .set({
        status: nextStatus,
        resolvedAt: ['RESOLVED', 'AUTO_RESOLVED'].includes(nextStatus) ? new Date() : null,
        automatedActionTaken: typeof resolutionNote === 'string' && resolutionNote.trim()
          ? resolutionNote.trim().slice(0, 1000)
          : 'Manually verified and resolved by dispatcher',
      })
      .where(and(eq(incidents.tenantId, auth.tenantId), eq(incidents.id, id)))
      .returning({ id: incidents.id }));
    if (updated.length === 0) {
      return NextResponse.json({ success: false, message: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Incident ${id} updated` });
  } catch (err: unknown) {
    console.error('[/api/agent/incidents]', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
