/**
 * Logout API — POST /api/auth/logout
 * ─────────────────────────────────────────────────────────────────
 * Clears the session cookie by setting maxAge=0.
 */

import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';

export async function POST() {
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
