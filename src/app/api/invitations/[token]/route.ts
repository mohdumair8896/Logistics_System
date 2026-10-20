// GET  /api/invitations/[token] — public: what this invite is for (workspace, role, email)
// POST /api/invitations/[token] — public: accept it and sign in
//   • new email      → { name, password } creates the account
//   • existing email → { password } confirms it's them, then adds the workspace
// The invite is looked up by the hash of the token; expired, revoked or used invites are refused.

import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSessionToken, verifySessionToken, COOKIE_OPTIONS, SESSION_COOKIE } from '@/lib/auth';
import { createSession, revokeSession } from '@/lib/sessions';
import { checkNewPassword, hashPassword, verifyPassword } from '@/lib/passwords';
import { clientIp, isRateLimited, tooManyRequests } from '@/lib/rateLimit';
import { hashInviteToken, initials } from '@/lib/team';
import { parseJsonBody } from '@/lib/validation';
import { invitations, tenants, users, memberships, tenantSubscriptions } from '@/lib/schema';

type Ctx = { params: Promise<{ token: string }> };

const acceptSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  // New passwords are checked by checkNewPassword() (Unicode characters); this cap only bounds the body
  password: z.string().min(1).max(1024),
}).strict();

async function findInvite(token: string) {
  if (!token || token.length > 100) return null;
  const [row] = await db.select({
    id: invitations.id,
    tenantId: invitations.tenantId,
    email: invitations.email,
    role: invitations.role,
    expiresAt: invitations.expiresAt,
    acceptedAt: invitations.acceptedAt,
    revokedAt: invitations.revokedAt,
    companyName: tenants.name,
    isConfigured: tenants.isConfigured,
  }).from(invitations)
    .innerJoin(tenants, eq(tenants.id, invitations.tenantId))
    .where(eq(invitations.tokenHash, hashInviteToken(token)));
  return row ?? null;
}

function unusable(invite: NonNullable<Awaited<ReturnType<typeof findInvite>>>): string | null {
  if (invite.acceptedAt) return 'This invitation has already been used. Sign in instead.';
  if (invite.revokedAt) return 'This invitation was withdrawn. Ask your administrator for a new one.';
  if (new Date(invite.expiresAt).getTime() < Date.now()) return 'This invitation has expired. Ask your administrator for a new one.';
  return null;
}

export async function GET(request: NextRequest, { params }: Ctx) {
  if (isRateLimited(`invite-view:${clientIp(request)}`, 60, 15 * 60 * 1000)) return tooManyRequests();
  try {
    const { token } = await params;
    const invite = await findInvite(token);
    if (!invite) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    const problem = unusable(invite);
    if (problem) return NextResponse.json({ error: problem }, { status: 410 });

    const [account] = await db.select({ id: users.id }).from(users).where(eq(users.email, invite.email));
    return NextResponse.json({
      companyName: invite.companyName,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      accountExists: !!account,
    });
  } catch (err) {
    console.error('[GET /api/invitations/[token]]', err);
    return NextResponse.json({ error: 'Could not load the invitation. Please try again.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  if (isRateLimited(`invite-accept:${clientIp(request)}`, 10, 15 * 60 * 1000)) return tooManyRequests();
  try {
    const { token } = await params;
    const invite = await findInvite(token);
    if (!invite) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    const problem = unusable(invite);
    if (problem) return NextResponse.json({ error: problem }, { status: 410 });

    const parsed = await parseJsonBody(request, acceptSchema);
    if (!parsed.ok) return parsed.response;
    const { name, password } = parsed.data;

    const [account] = await db.select().from(users).where(eq(users.email, invite.email));
    if (account) {
      // Existing account: prove it's them before adding a workspace
      if (!account.isActive || !(await verifyPassword(password, account.passwordHash))) {
        await new Promise(r => setTimeout(r, 300));
        return NextResponse.json({ error: 'Incorrect password for this account' }, { status: 401 });
      }
    } else {
      if (!name) return NextResponse.json({ error: 'Enter your name' }, { status: 400 });
      const refused = await checkNewPassword(password, { email: invite.email, companyName: invite.companyName });
      if (refused) return NextResponse.json({ error: refused }, { status: 400 });
    }

    const userId = account?.id ?? `usr_${crypto.randomUUID()}`;
    const displayName = account?.name ?? name!;
    const accepted = await db.transaction(async (tx) => {
      // Claim the invite atomically so it can only be used once
      const claimed = await tx.update(invitations).set({ acceptedAt: new Date() })
        .where(and(eq(invitations.id, invite.id), isNull(invitations.acceptedAt), isNull(invitations.revokedAt)))
        .returning({ id: invitations.id });
      if (claimed.length === 0) return false;

      if (!account) {
        await tx.insert(users).values({
          id: userId,
          email: invite.email,
          passwordHash: await hashPassword(password),
          name: displayName,
          role: invite.role,
          facility: invite.companyName,
          avatar: initials(displayName),
          tenantId: invite.tenantId,
          isActive: true,
        });
      } else if (!account.tenantId) {
        await tx.update(users).set({ tenantId: invite.tenantId, role: invite.role }).where(eq(users.id, userId));
      }
      await tx.insert(memberships).values({ userId, tenantId: invite.tenantId, role: invite.role })
        .onConflictDoUpdate({ target: [memberships.userId, memberships.tenantId], set: { role: invite.role } });
      return true;
    });
    if (!accepted) return NextResponse.json({ error: 'This invitation has already been used. Sign in instead.' }, { status: 410 });

    // Someone else may still be signed in on this browser: end that session, since its cookie is replaced
    const previous = request.cookies.get(SESSION_COOKIE)?.value;
    const prior = previous ? await verifySessionToken(previous) : null;
    if (prior?.sid) await revokeSession(prior.sid).catch(err => console.error('[invite accept] revoke previous', err));

    const [subscription] = await db.select({ plan: tenantSubscriptions.plan }).from(tenantSubscriptions)
      .where(eq(tenantSubscriptions.tenantId, invite.tenantId)).limit(1);
    const sid = await createSession(userId, invite.tenantId, request.headers.get('user-agent'));
    const sessionToken = await createSessionToken({
      sid,
      userId,
      email: invite.email,
      role: invite.role,
      name: displayName,
      facility: invite.companyName,
      avatar: account?.avatar ?? initials(displayName),
      tenantId: invite.tenantId,
      isConfigured: invite.isConfigured ?? true,
      plan: subscription?.plan,
      companyName: invite.companyName,
    });

    const response = NextResponse.json({ success: true, redirectUrl: '/dashboard' });
    response.cookies.set({ ...COOKIE_OPTIONS, value: sessionToken });
    return response;
  } catch (err) {
    console.error('[POST /api/invitations/[token]]', err);
    return NextResponse.json({ error: 'Could not accept the invitation. Please try again.' }, { status: 500 });
  }
}
