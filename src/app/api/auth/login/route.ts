/**
 * Login API — POST /api/auth/login
 * ─────────────────────────────────────────────────────────────────
 * Validates credentials, issues a signed HttpOnly session cookie.
 *
 * Demo credential set (replace with DB lookup + bcrypt in production):
 *   admin@precisionlogistics.com      / Logistics2026!   → Operations Director
 *   dispatch@precisionlogistics.com   / Logistics2026!   → Fleet Dispatcher
 *   compliance@precisionlogistics.com / Logistics2026!   → Compliance Officer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, COOKIE_OPTIONS, safeEqual } from '@/lib/auth';

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
    name: 'Alex Morgan',
    role: 'Operations Director',
    facility: 'Central Distribution Hub',
  },
  {
    email: 'dispatch@precisionlogistics.com',
    password: 'Logistics2026!',
    name: 'Sam Rivera',
    role: 'Fleet Dispatcher',
    facility: 'North Corridor Terminal',
  },
  {
    email: 'compliance@precisionlogistics.com',
    password: 'Logistics2026!',
    name: 'Jordan Patel',
    role: 'Compliance Officer',
    facility: 'West Regional Terminal',
  },
];

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
