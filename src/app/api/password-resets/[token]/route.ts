// GET  /api/password-resets/[token] — public: whose password this link resets (name, email, expiry)
// POST /api/password-resets/[token] — public: { password } sets a new password, ends every session of
//      that account in every workspace, and signs them in fresh to the workspace that issued the link.
// The link is looked up by the hash of the token; expired, used or superseded links are refused (410).

import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, gt, isNull, ne } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSessionToken, verifySessionToken, COOKIE_OPTIONS, SESSION_COOKIE } from '@/lib/auth';
import { createSession, revokeAllUserSessions, revokeSession } from '@/lib/sessions';
import { checkNewPassword, hashPassword } from '@/lib/passwords';
import { clientIp, isRateLimited, tooManyRequests } from '@/lib/rateLimit';
import { hashResetToken, initials } from '@/lib/team';
import { parseJsonBody } from '@/lib/validation';
import { memberships, passwordResets, tenants, tenantSubscriptions, users } from '@/lib/schema';

type Ctx = { params: Promise<{ token: string }> };

// Length is checked by checkNewPassword() (Unicode characters); this cap only bounds the body.
const resetSchema = z.object({ password: z.string().max(1024) }).strict();

async function findReset(token: string) {
  if (!token || token.length > 100) return null;
  const [row] = await db.select({
    id: passwordResets.id,
    userId: passwordResets.userId,
    tenantId: passwordResets.tenantId,
    expiresAt: passwordResets.expiresAt,
    usedAt: passwordResets.usedAt,
    revokedAt: passwordResets.revokedAt,
    name: users.name,
    email: users.email,
    isActive: users.isActive,
    companyName: tenants.name,
  }).from(passwordResets)
    .innerJoin(users, eq(users.id, passwordResets.userId))
    .innerJoin(tenants, eq(tenants.id, passwordResets.tenantId))
    .where(eq(passwordResets.tokenHash, hashResetToken(token)));
  return row ?? null;
}

async function unusable(reset: NonNullable<Awaited<ReturnType<typeof findReset>>>): Promise<string | null> {
  if (reset.usedAt) return 'This reset link has already been used. Sign in with your new password, or ask your Operations Director for a new link.';
  if (reset.revokedAt) return 'This reset link was withdrawn or replaced by a newer one. Ask your Operations Director for the current link.';
  if (new Date(reset.expiresAt).getTime() < Date.now()) return 'This reset link has expired. Ask your Operations Director for a new one.';
  if (reset.isActive === false) return 'This account is disabled. Ask your Operations Director.';
  // Same rule as issuing: still a member of the issuing workspace, and of no other
  const memberOf = await db.select({ tenantId: memberships.tenantId }).from(memberships)
    .where(eq(memberships.userId, reset.userId));
  if (!memberOf.some(m => m.tenantId === reset.tenantId)) return 'This reset link is no longer valid. Ask your Operations Director.';
  if (memberOf.length > 1) return 'Your account now belongs to more than one workspace, so this link can’t be used. Write to support@logisticsedge.io.';
  return null;
}

export async function GET(request: NextRequest, { params }: Ctx) {
  if (isRateLimited(`reset-view:${clientIp(request)}`, 60, 15 * 60 * 1000)) return tooManyRequests();
  try {
    const { token } = await params;
    const reset = await findReset(token);
    if (!reset) return NextResponse.json({ error: 'Reset link not found' }, { status: 404 });
    const problem = await unusable(reset);
    if (problem) return NextResponse.json({ error: problem }, { status: 410 });

    return NextResponse.json({
      name: reset.name,
      email: reset.email,
      companyName: reset.companyName,
      expiresAt: reset.expiresAt,
    });
  } catch (err) {
    console.error('[GET /api/password-resets/[token]]', err);
    return NextResponse.json({ error: 'Could not load the reset link. Please try again.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  if (isRateLimited(`reset-use:${clientIp(request)}`, 10, 15 * 60 * 1000)) return tooManyRequests();
  try {
    const { token } = await params;
    const reset = await findReset(token);
    if (!reset) return NextResponse.json({ error: 'Reset link not found' }, { status: 404 });
    const problem = await unusable(reset);
    if (problem) return NextResponse.json({ error: problem }, { status: 410 });

    const parsed = await parseJsonBody(request, resetSchema);
    if (!parsed.ok) return parsed.response;
    const { password } = parsed.data;
    const refused = await checkNewPassword(password, { email: reset.email, companyName: reset.companyName });
    if (refused) return NextResponse.json({ error: refused }, { status: 400 });

    const passwordHash = await hashPassword(password);
    const changed = await db.transaction(async (tx) => {
      // Claim the link atomically so it can only be used once
      const claimed = await tx.update(passwordResets).set({ usedAt: new Date() })
        .where(and(eq(passwordResets.id, reset.id), isNull(passwordResets.usedAt), isNull(passwordResets.revokedAt),
          gt(passwordResets.expiresAt, new Date())))
        .returning({ id: passwordResets.id });
      if (claimed.length === 0) return false;

      await tx.update(users).set({ passwordHash }).where(eq(users.id, reset.userId));
      await tx.update(passwordResets).set({ revokedAt: new Date() })
        .where(and(eq(passwordResets.userId, reset.userId), ne(passwordResets.id, reset.id),
          isNull(passwordResets.usedAt), isNull(passwordResets.revokedAt)));
      // Whoever knew the old password is signed out everywhere, together with the change
      await revokeAllUserSessions(reset.userId, tx);
      return true;
    });
    if (!changed) {
      return NextResponse.json({ error: 'This reset link has already been used. Ask your Operations Director for a new link.' }, { status: 410 });
    }

    // Someone else may still be signed in on this browser: end that session, since its cookie is replaced
    const previous = request.cookies.get(SESSION_COOKIE)?.value;
    const prior = previous ? await verifySessionToken(previous) : null;
    if (prior?.sid) await revokeSession(prior.sid).catch(err => console.error('[password reset] revoke previous', err));

    const [[account], [tenant], [membership], [subscription]] = await Promise.all([
      db.select({ facility: users.facility, avatar: users.avatar }).from(users).where(eq(users.id, reset.userId)),
      db.select({ isConfigured: tenants.isConfigured }).from(tenants).where(eq(tenants.id, reset.tenantId)),
      db.select({ role: memberships.role }).from(memberships)
        .where(and(eq(memberships.userId, reset.userId), eq(memberships.tenantId, reset.tenantId))),
      db.select({ plan: tenantSubscriptions.plan }).from(tenantSubscriptions)
        .where(eq(tenantSubscriptions.tenantId, reset.tenantId))
        .orderBy(desc(tenantSubscriptions.createdAt)).limit(1),
    ]);
    if (!membership) {
      // Removed from the workspace a moment ago: the password is changed, but there's nothing to sign in to
      return NextResponse.json({ success: true, redirectUrl: '/login' });
    }

    const sid = await createSession(reset.userId, reset.tenantId, request.headers.get('user-agent'));
    const sessionToken = await createSessionToken({
      sid,
      userId: reset.userId,
      email: reset.email,
      role: membership.role,
      name: reset.name,
      facility: account?.facility ?? '',
      avatar: account?.avatar ?? initials(reset.name),
      tenantId: reset.tenantId,
      isConfigured: tenant?.isConfigured ?? false,
      plan: subscription?.plan,
      companyName: reset.companyName,
    });

    const response = NextResponse.json({ success: true, redirectUrl: '/dashboard' });
    response.cookies.set({ ...COOKIE_OPTIONS, value: sessionToken });
    return response;
  } catch (err) {
    console.error('[POST /api/password-resets/[token]]', err);
    return NextResponse.json({ error: 'Could not reset the password. Please try again.' }, { status: 500 });
  }
}
