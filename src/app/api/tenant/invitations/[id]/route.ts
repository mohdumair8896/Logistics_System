// DELETE /api/tenant/invitations/[id] — revoke an open invitation (its link stops working)

import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { withTenant } from '@/lib/tenancy';
import { invitations } from '@/lib/schema';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'team.manage');
  if (denied) return denied;

  try {
    const { id } = await params;
    const revoked = await withTenant(auth.tenantId, tx => tx.update(invitations)
      .set({ revokedAt: sql`now()` })
      .where(and(eq(invitations.tenantId, auth.tenantId), eq(invitations.id, id),
        isNull(invitations.acceptedAt), isNull(invitations.revokedAt)))
      .returning({ id: invitations.id }));
    if (revoked.length === 0) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/tenant/invitations/[id]]', err);
    return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 500 });
  }
}
