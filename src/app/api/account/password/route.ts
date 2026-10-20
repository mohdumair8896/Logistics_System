// POST /api/account/password — signed in: { currentPassword, newPassword } changes your own password.
// Together with the change, every session of the account in every workspace ends and open reset links
// are withdrawn; this browser gets a fresh session in place of the one it came with.

import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSessionToken, isAuthError, requireAuth, COOKIE_OPTIONS } from '@/lib/auth';
import { createSession, revokeAllUserSessions } from '@/lib/sessions';
import { checkNewPassword, hashPassword, verifyPassword } from '@/lib/passwords';
import { isRateLimited, tooManyRequests } from '@/lib/rateLimit';
import { parseJsonBody } from '@/lib/validation';
import { passwordResets, users } from '@/lib/schema';

// Length is checked by checkNewPassword() (Unicode characters); these caps only bound the body.
const changeSchema = z.object({
  currentPassword: z.string().max(1024),
  newPassword: z.string().max(1024),
}).strict();

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const parsed = await parseJsonBody(request, changeSchema);
    if (!parsed.ok) return parsed.response;
    const { currentPassword, newPassword } = parsed.data;

    const refused = await checkNewPassword(newPassword, { email: auth.email, companyName: auth.companyName });
    if (refused) return NextResponse.json({ error: refused }, { status: 400 });
    if (newPassword === currentPassword) {
      return NextResponse.json({ error: 'The new password is the same as your current one.' }, { status: 400 });
    }

    // Someone using a borrowed, signed-in browser can't guess the current password quickly
    if (isRateLimited(`password-change:${auth.userId}`, 5, 15 * 60 * 1000)) return tooManyRequests();

    const [account] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, auth.userId));
    if (!account || !(await verifyPassword(currentPassword, account.passwordHash))) {
      return NextResponse.json({ error: 'Your current password isn’t correct.' }, { status: 401 });
    }

    const passwordHash = await hashPassword(newPassword);
    const changed = await db.transaction(async (tx) => {
      // Only if the password is still the one just checked: a reset may have replaced it meanwhile
      const updated = await tx.update(users).set({ passwordHash })
        .where(and(eq(users.id, auth.userId), eq(users.passwordHash, account.passwordHash)))
        .returning({ id: users.id });
      if (updated.length === 0) return null;

      await tx.update(passwordResets).set({ revokedAt: new Date() })
        .where(and(eq(passwordResets.userId, auth.userId), isNull(passwordResets.usedAt), isNull(passwordResets.revokedAt)));
      // Whoever knew the old password is signed out everywhere, this browser included...
      const ended = await revokeAllUserSessions(auth.userId, tx);
      // ...which continues in a new session, so a copy of its old cookie stops working too
      const sid = await createSession(auth.userId, auth.tenantId ?? null, request.headers.get('user-agent'), tx);
      return { sid, otherSessionsEnded: Math.max(0, ended - 1) };
    });
    if (!changed) {
      return NextResponse.json({ error: 'Your password was changed somewhere else a moment ago. Sign in again.' }, { status: 409 });
    }

    // Same claims as before, with the new session id (createSessionToken sets a fresh expiry)
    const sessionToken = await createSessionToken({ ...auth, sid: changed.sid });
    const response = NextResponse.json({ success: true, otherSessionsEnded: changed.otherSessionsEnded });
    response.cookies.set({ ...COOKIE_OPTIONS, value: sessionToken });
    return response;
  } catch (err) {
    console.error('[POST /api/account/password]', err);
    return NextResponse.json({ error: 'Could not change the password. Please try again.' }, { status: 500 });
  }
}
