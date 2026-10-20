/**
 * Login API — POST /api/auth/login
 * ─────────────────────────────────────────────────────────────────
 * Validates credentials against the Neon PostgreSQL users table.
 * Passwords are checked by src/lib/passwords.ts (bcrypt); legacy hashes are upgraded on sign-in.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, tenants, tenantSubscriptions, memberships } from '@/lib/schema';
import { and, eq, desc } from 'drizzle-orm';
import { createSessionToken, COOKIE_OPTIONS } from '@/lib/auth';
import { createSession } from '@/lib/sessions';
import { hashPassword, isPasswordTooLong, needsRehash, verifyPassword } from '@/lib/passwords';
import { clientIp, isRateLimited, tooManyRequests } from '@/lib/rateLimit';

const WINDOW_MS = 15 * 60 * 1000;

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

    // Slow down password guessing: per address and per IP
    const ip = clientIp(request);
    if (isRateLimited(`login:email:${email}`, 8, WINDOW_MS) || isRateLimited(`login:ip:${ip}`, 30, WINDOW_MS)) {
      return tooManyRequests();
    }

    if (email.length > 254 || isPasswordTooLong(password)) {
      await new Promise(r => setTimeout(r, 300));
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Look up user in DB
    const [user] = await db.select().from(users).where(eq(users.email, email));

    // Unknown emails are compared against a dummy hash, so they take as long as a wrong password
    const passwordMatch = await verifyPassword(password, user?.passwordHash);

    if (!user || !passwordMatch || !user.isActive) {
      await new Promise(r => setTimeout(r, 300));
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (needsRehash(user.passwordHash, password)) {
      // Rewrite a legacy hash in the current format, unless the password was changed meanwhile
      try {
        await db.update(users).set({ passwordHash: await hashPassword(password) })
          .where(and(eq(users.id, user.id), eq(users.passwordHash, user.passwordHash)));
      } catch (err) {
        console.error('[POST /api/auth/login] password rehash', err);
      }
    }

    const avatar = user.avatar ?? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    // Every staff session belongs to a workspace (tenant): restore it, with the role held there
    const [[tenant], [subscription], [membership]] = user.tenantId
      ? await Promise.all([
          db.select({ name: tenants.name, isConfigured: tenants.isConfigured }).from(tenants).where(eq(tenants.id, user.tenantId)),
          db.select({ plan: tenantSubscriptions.plan }).from(tenantSubscriptions)
            .where(eq(tenantSubscriptions.tenantId, user.tenantId))
            .orderBy(desc(tenantSubscriptions.createdAt)).limit(1),
          db.select({ role: memberships.role }).from(memberships)
            .where(and(eq(memberships.userId, user.id), eq(memberships.tenantId, user.tenantId))),
        ])
      : [[], [], []];
    if (!user.tenantId || !tenant) {
      return NextResponse.json(
        { success: false, message: 'Your account is not linked to a company workspace. Contact your administrator.' },
        { status: 403 }
      );
    }

    const sid = await createSession(user.id, user.tenantId, request.headers.get('user-agent'));
    const token = await createSessionToken({
      sid,
      userId: user.id,
      email: user.email,
      role: membership?.role ?? user.role,
      name: user.name,
      facility: user.facility ?? '',
      avatar,
      tenantId: user.tenantId,
      isConfigured: tenant.isConfigured ?? false,
      plan: subscription?.plan,
      companyName: tenant.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: membership?.role ?? user.role,
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
