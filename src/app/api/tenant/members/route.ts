// GET /api/tenant/members — the workspace's members and open invitations (Operations Director).
// Each member's resetLinkExpiresAt is set while a password reset link from this workspace is open
// (unused, not withdrawn, not expired), and null otherwise.

import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { memberships, users, invitations, passwordResets } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'team.manage');
  if (denied) return denied;

  try {
    // users and password_resets are system tables (no RLS role access), so these reads run on the
    // system connection with an explicit workspace filter.
    const [members, invites, openResets] = await Promise.all([
      db.select({
        userId: users.id,
        name: users.name,
        email: users.email,
        isActive: users.isActive,
        role: memberships.role,
        joinedAt: memberships.createdAt,
      }).from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(eq(memberships.tenantId, auth.tenantId))
        .orderBy(memberships.createdAt),
      db.select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        createdAt: invitations.createdAt,
        expiresAt: invitations.expiresAt,
      }).from(invitations)
        .where(and(eq(invitations.tenantId, auth.tenantId), isNull(invitations.acceptedAt), isNull(invitations.revokedAt)))
        .orderBy(desc(invitations.createdAt)),
      db.select({ userId: passwordResets.userId, expiresAt: passwordResets.expiresAt }).from(passwordResets)
        .where(and(eq(passwordResets.tenantId, auth.tenantId), isNull(passwordResets.usedAt),
          isNull(passwordResets.revokedAt), gt(passwordResets.expiresAt, sql`now()`))),
    ]);

    // Normally one open link per member (a new one revokes the older ones); keep the latest if not
    const resetExpiry = new Map<string, Date>();
    for (const r of openResets) {
      const seen = resetExpiry.get(r.userId);
      if (!seen || r.expiresAt > seen) resetExpiry.set(r.userId, r.expiresAt);
    }

    const now = Date.now();
    return NextResponse.json({
      members: members.map(m => ({
        ...m,
        isYou: m.userId === auth.userId,
        resetLinkExpiresAt: resetExpiry.get(m.userId)?.toISOString() ?? null,
      })),
      invitations: invites.map(i => ({ ...i, expired: new Date(i.expiresAt).getTime() < now })),
    });
  } catch (err) {
    console.error('[GET /api/tenant/members]', err);
    return NextResponse.json({ error: 'Failed to load team' }, { status: 500 });
  }
}
