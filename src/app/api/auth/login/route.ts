/**
 * Login API — POST /api/auth/login
 * ─────────────────────────────────────────────────────────────────
 * Validates credentials against the Neon PostgreSQL users table.
 * Uses bcrypt for secure password comparison.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { createSessionToken, COOKIE_OPTIONS } from '@/lib/auth';

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

    if (email.length > 254 || password.length > 128) {
      await new Promise(r => setTimeout(r, 300));
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Look up user in DB
    const [user] = await db.select().from(users).where(eq(users.email, email));

    // Always do bcrypt compare to resist timing attacks
    const dummyHash = '$2a$12$dummy.hash.to.prevent.timing.attack.xxxxxxxxxxxxxx';
    const hashToCompare = user?.passwordHash ?? dummyHash;
    const passwordMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !passwordMatch || !user.isActive) {
      await new Promise(r => setTimeout(r, 300));
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const avatar = user.avatar ?? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'Operations Director' | 'Fleet Dispatcher' | 'Compliance Officer',
      name: user.name,
      facility: user.facility ?? '',
      avatar,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        facility: user.facility,
        avatar,
      },
    });

    response.cookies.set({
      ...COOKIE_OPTIONS,
      value: token,
    });

    return response;
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
