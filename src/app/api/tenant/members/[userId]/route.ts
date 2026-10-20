// PATCH  /api/tenant/members/[userId] — change a teammate's role
// DELETE /api/tenant/members/[userId] — remove a teammate from the workspace
// Both end the teammate's sessions in this workspace so the change applies immediately.
// A workspace always keeps at least one Operations Director, and you can't change or remove yourself.

import { NextRequest, NextResponse } from 'next/server';
import { and, eq, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission, STAFF_ROLES } from '@/lib/permissions';
import { parseJsonBody } from '@/lib/validation';
import { revokeUserSessions } from '@/lib/sessions';
import { memberships, users } from '@/lib/schema';

const DIRECTOR = 'Operations Director';
const updateSchema = z.object({ role: z.enum(STAFF_ROLES) }).strict();

type Ctx = { params: Promise<{ userId: string }> };

async function countDirectors(tx: Pick<typeof db, 'select'>, tenantId: string): Promise<number> {
  const [row] = await tx.select({ n: sql<number>`count(*)::int` }).from(memberships)
    .where(and(eq(memberships.tenantId, tenantId), eq(memberships.role, DIRECTOR)));
  return row?.n ?? 0;
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'team.manage');
  if (denied) return denied;

  try {
    const { userId } = await params;
    if (userId === auth.userId) {
      return NextResponse.json({ error: "You can't change your own role" }, { status: 409 });
    }
    const parsed = await parseJsonBody(request, updateSchema);
    if (!parsed.ok) return parsed.response;
    const { role } = parsed.data;

    const result = await db.transaction(async (tx) => {
      const [member] = await tx.select().from(memberships)
        .where(and(eq(memberships.tenantId, auth.tenantId), eq(memberships.userId, userId))).for('update');
      if (!member) return 'not-found' as const;
      if (member.role === DIRECTOR && role !== DIRECTOR && (await countDirectors(tx, auth.tenantId)) <= 1) {
        return 'last-director' as const;
      }
      await tx.update(memberships).set({ role })
        .where(and(eq(memberships.tenantId, auth.tenantId), eq(memberships.userId, userId)));
      // Keep the legacy users.role in step for the user's default workspace
      await tx.update(users).set({ role }).where(and(eq(users.id, userId), eq(users.tenantId, auth.tenantId)));
      return 'ok' as const;
    });

    if (result === 'not-found') return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    if (result === 'last-director') {
      return NextResponse.json({ error: 'A workspace needs at least one Operations Director' }, { status: 409 });
    }
    const sessionsEnded = await revokeUserSessions(userId, auth.tenantId);
    return NextResponse.json({ success: true, role, sessionsEnded });
  } catch (err) {
    console.error('[PATCH /api/tenant/members/[userId]]', err);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'team.manage');
  if (denied) return denied;

  try {
    const { userId } = await params;
    if (userId === auth.userId) {
      return NextResponse.json({ error: "You can't remove yourself" }, { status: 409 });
    }

    const result = await db.transaction(async (tx) => {
      const [member] = await tx.select().from(memberships)
        .where(and(eq(memberships.tenantId, auth.tenantId), eq(memberships.userId, userId))).for('update');
      if (!member) return 'not-found' as const;
      if (member.role === DIRECTOR && (await countDirectors(tx, auth.tenantId)) <= 1) return 'last-director' as const;

      await tx.delete(memberships).where(and(eq(memberships.tenantId, auth.tenantId), eq(memberships.userId, userId)));
      // If this was their default workspace, fall back to another membership (or none)
      const [other] = await tx.select({ tenantId: memberships.tenantId }).from(memberships)
        .where(and(eq(memberships.userId, userId), ne(memberships.tenantId, auth.tenantId))).limit(1);
      await tx.update(users).set({ tenantId: other?.tenantId ?? null })
        .where(and(eq(users.id, userId), eq(users.tenantId, auth.tenantId)));
      return 'ok' as const;
    });

    if (result === 'not-found') return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    if (result === 'last-director') {
      return NextResponse.json({ error: 'A workspace needs at least one Operations Director' }, { status: 409 });
    }
    const sessionsEnded = await revokeUserSessions(userId, auth.tenantId);
    return NextResponse.json({ success: true, sessionsEnded });
  } catch (err) {
    console.error('[DELETE /api/tenant/members/[userId]]', err);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
