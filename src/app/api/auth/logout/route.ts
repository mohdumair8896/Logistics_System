/**
 * Logout API — POST /api/auth/logout
 * ─────────────────────────────────────────────────────────────────
 * Revokes the server-side session (so a copied cookie stops working too)
 * and clears the session cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { revokeSession } from '@/lib/sessions';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifySessionToken(token) : null;
  if (payload?.sid) {
    try {
      await revokeSession(payload.sid);
    } catch (err) {
      console.error('[POST /api/auth/logout] revoke failed', err);
    }
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

  // Expire the session cookie immediately
  response.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
