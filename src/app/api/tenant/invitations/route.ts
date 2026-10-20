// POST /api/tenant/invitations — invite a teammate by email with a role (Operations Director).
// Returns a one-time invite link to share (WhatsApp, email…); it expires after INVITE_TTL_DAYS.

import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission, STAFF_ROLES } from '@/lib/permissions';
import { withTenant } from '@/lib/tenancy';
import { parseJsonBody } from '@/lib/validation';
import { INVITE_TTL_DAYS, hashInviteToken, invitePath, newInviteToken } from '@/lib/team';
import { memberships, users, invitations } from '@/lib/schema';

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(STAFF_ROLES),
}).strict();

export async function POST(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'team.manage');
  if (denied) return denied;

  try {
    const parsed = await parseJsonBody(request, inviteSchema);
    if (!parsed.ok) return parsed.response;
    const { email, role } = parsed.data;

    // Already a member of this workspace? (users is global, so check on the system connection)
    const [existing] = await db.select({ id: users.id }).from(users)
      .innerJoin(memberships, and(eq(memberships.userId, users.id), eq(memberships.tenantId, auth.tenantId)))
      .where(eq(users.email, email));
    if (existing) {
      return NextResponse.json({ error: `${email} is already a member of this workspace` }, { status: 409 });
    }

    const token = newInviteToken();
    const id = `inv_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    await withTenant(auth.tenantId, async (tx) => {
      // One open invite per email: revoke older ones so only the newest link works
      await tx.update(invitations).set({ revokedAt: sql`now()` })
        .where(and(eq(invitations.tenantId, auth.tenantId), eq(invitations.email, email),
          isNull(invitations.acceptedAt), isNull(invitations.revokedAt)));
      await tx.insert(invitations).values({
        id,
        tenantId: auth.tenantId,
        email,
        role,
        tokenHash: hashInviteToken(token),
        invitedBy: auth.userId,
        expiresAt,
      });
    });

    return NextResponse.json({ id, email, role, path: invitePath(token), expiresAt: expiresAt.toISOString() }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/tenant/invitations]', err);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}
