// POST   /api/tenant/members/[userId]/password-reset — create a one-time link that lets a teammate
// choose a new password (Operations Director). There's no email provider, so the Director shares it.
// It expires after RESET_TTL_HOURS, and creating one revokes the member's older open links.
// Refused for yourself, for disabled accounts and for accounts that also belong to another
// workspace: the password unlocks that workspace too, and this Director doesn't manage it.
// DELETE /api/tenant/members/[userId]/password-reset — withdraw the member's open links from this
// workspace (e.g. one sent to the wrong person). 404 when there is none.

import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull, ne, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { RESET_TTL_HOURS, hashResetToken, newResetToken, resetPath } from '@/lib/team';
import { memberships, passwordResets, users } from '@/lib/schema';

type Ctx = { params: Promise<{ userId: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'team.manage');
  if (denied) return denied;

  try {
    const { userId } = await params;
    if (userId === auth.userId) {
      return NextResponse.json({ error: "You can't create a reset link for yourself" }, { status: 409 });
    }

    // users and password_resets are system tables (no RLS role access), so this runs on the system
    // connection; membership of this workspace is checked explicitly.
    const [member] = await db.select({ name: users.name, email: users.email, isActive: users.isActive })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(and(eq(memberships.tenantId, auth.tenantId), eq(memberships.userId, userId)));
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    if (member.isActive === false) {
      return NextResponse.json({ error: `${member.name}'s account is disabled` }, { status: 409 });
    }
    const [elsewhere] = await db.select({ tenantId: memberships.tenantId }).from(memberships)
      .where(and(eq(memberships.userId, userId), ne(memberships.tenantId, auth.tenantId))).limit(1);
    if (elsewhere) {
      return NextResponse.json({
        error: `${member.name} also belongs to another LogisticsEdge workspace, so their password can't be reset from here. They can write to support@logisticsedge.io.`,
      }, { status: 409 });
    }

    const token = newResetToken();
    const id = `pwr_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + RESET_TTL_HOURS * 60 * 60 * 1000);

    await db.transaction(async (tx) => {
      // Only the newest link works
      await tx.update(passwordResets).set({ revokedAt: sql`now()` })
        .where(and(eq(passwordResets.userId, userId), isNull(passwordResets.usedAt), isNull(passwordResets.revokedAt)));
      await tx.insert(passwordResets).values({
        id,
        userId,
        tenantId: auth.tenantId,
        tokenHash: hashResetToken(token),
        createdBy: auth.userId,
        expiresAt,
      });
    });

    return NextResponse.json({
      id,
      userId,
      name: member.name,
      email: member.email,
      path: resetPath(token),
      expiresAt: expiresAt.toISOString(),
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/tenant/members/[userId]/password-reset]', err);
    return NextResponse.json({ error: 'Failed to create the reset link' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'team.manage');
  if (denied) return denied;

  try {
    const { userId } = await params;

    // System connection, as in POST: membership of this workspace is checked explicitly
    const [member] = await db.select({ userId: memberships.userId }).from(memberships)
      .where(and(eq(memberships.tenantId, auth.tenantId), eq(memberships.userId, userId)));
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const revoked = await db.update(passwordResets).set({ revokedAt: sql`now()` })
      .where(and(eq(passwordResets.userId, userId), eq(passwordResets.tenantId, auth.tenantId),
        isNull(passwordResets.usedAt), isNull(passwordResets.revokedAt)))
      .returning({ id: passwordResets.id });
    if (revoked.length === 0) {
      return NextResponse.json({ error: 'There is no open reset link to withdraw' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/tenant/members/[userId]/password-reset]', err);
    return NextResponse.json({ error: 'Failed to withdraw the reset link' }, { status: 500 });
  }
}
