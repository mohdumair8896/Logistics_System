// DELETE /api/alerts/[id] — dismiss an alert (sets dismissedAt timestamp)

import { NextRequest, NextResponse } from 'next/server';
import { systemAlerts } from '@/lib/schema';
import { and, eq, sql } from 'drizzle-orm';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { withTenant } from '@/lib/tenancy';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'alert.manage');
  if (denied) return denied;
  try {
    const { id } = await params;
    const updated = await withTenant(auth.tenantId, tx => tx.update(systemAlerts)
      .set({ dismissedAt: sql`now()` })
      .where(and(eq(systemAlerts.tenantId, auth.tenantId), eq(systemAlerts.id, id)))
      .returning({ id: systemAlerts.id }));
    if (updated.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/alerts/[id]]', err);
    return NextResponse.json({ error: 'Failed to dismiss alert' }, { status: 500 });
  }
}
