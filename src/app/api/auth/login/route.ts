/**
 * Login API — POST /api/auth/login
 * ─────────────────────────────────────────────────────────────────
 * Validates credentials, issues a signed HttpOnly session cookie.
 *
 * Demo credential set (replace with DB lookup + bcrypt in production):
 *   admin@precisionlogistics.com      / Logistics2026!
 *   dispatch@precisionlogistics.com   / Logistics2026!
 *   compliance@precisionlogistics.com / Logistics2026!
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, COOKIE_OPTIONS } from '@/lib/auth';

interface DemoUser {
  email: string;
  /** In production this would be a bcrypt hash stored in the DB */
  password: string;
  name: string;
  role: 'Operations Director' | 'Fleet Dispatcher' | 'Compliance Officer';
  facility: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    email: 'admin@precisionlogistics.com',
    password: 'Logistics2026!',
    name: 'Rajesh Varma',
    role: 'Operations Director',
    facility: 'Lucknow Central Hub',
  },
  {
    email: 'dispatch@precisionlogistics.com',
    password: 'Logistics2026!',
    name: 'Ananya Singh',
    role: 'Fleet Dispatcher',
    facility: 'Delhi NCR Corridor Terminal',
  },
  {
    email: 'compliance@precisionlogistics.com',
    password: 'Logistics2026!',
    name: 'Vikram Rathore',
    role: 'Compliance Officer',
    facility: 'Kanpur Regional Terminal',
  },
];

/** Simulates constant-time string comparison to resist timing attacks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still iterate to avoid early-exit timing leak
    let dummy = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      dummy |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const email = body.email.toLowerCase().trim();
    const password = String(body.password);

    // Reject clearly invalid inputs early (without leaking user existence)
    if (email.length > 254 || password.length > 128) {
      await new Promise(r => setTimeout(r, 300));
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Always look up — never short-circuit — to resist user-enumeration via timing
    const user = DEMO_USERS.find(u => u.email === email) ?? null;
    const storedPassword = user?.password ?? 'dummy-password-for-timing';
    const passwordMatch = safeEqual(password, storedPassword);

    if (!user || !passwordMatch) {
      // Fixed delay to prevent timing-based user enumeration
      await new Promise(r => setTimeout(r, 300));
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Build user profile for the session
    const userId = `USR-00${DEMO_USERS.indexOf(user) + 1}`;
    const avatar = user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const token = await createSessionToken({
      userId,
      email: user.email,
      role: user.role,
      name: user.name,
      facility: user.facility,
      avatar,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: userId, email: user.email, name: user.name, role: user.role, facility: user.facility, avatar },
    });

    // HttpOnly cookie — JS cannot read this, preventing XSS token theft
    response.cookies.set({
      ...COOKIE_OPTIONS,
      value: token,
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
