// Helpers to call Next.js route handlers directly with a signed session cookie.

import { NextRequest } from 'next/server';
import { createSessionToken, createDriverLinkToken, SESSION_COOKIE } from '@/lib/auth';
import { createSession } from '@/lib/sessions';
import { hashPassword } from '@/lib/passwords';
import type { StaffRole } from '@/lib/permissions';
import { memberships, users } from '@/lib/schema';
import { getTestDb } from './testDb';

export interface TestUser {
  cookie: string;
  sid: string;
  userId: string;
  email: string;
}

/**
 * Signs a user in: makes sure the user (and their membership of `tenantId`) exists, opens a
 * server-side session and returns its cookie. Omit tenantId to simulate a pre-tenancy session.
 * The default user id is derived from tenant + role, so repeated calls reuse the same user.
 */
export async function signIn(
  tenantId: string | undefined,
  role: StaffRole = 'Operations Director',
  opts: { userId?: string; email?: string; name?: string; password?: string } = {},
): Promise<TestUser> {
  const slug = role.toLowerCase().replace(/[^a-z]+/g, '_');
  const userId = opts.userId ?? `usr_${tenantId ?? 'none'}_${slug}`;
  const email = opts.email ?? `${slug}@${tenantId ?? 'none'}.test`;
  const name = opts.name ?? 'Test User';

  const { db } = await getTestDb();
  await db.insert(users).values({
    id: userId,
    email,
    passwordHash: await hashPassword(opts.password ?? 'not-used-in-tests', 4),
    name,
    role,
    tenantId: tenantId ?? null,
  }).onConflictDoNothing();
  if (tenantId) await db.insert(memberships).values({ userId, tenantId, role }).onConflictDoNothing();

  const sid = await createSession(userId, tenantId ?? null);
  const token = await createSessionToken({
    sid,
    userId,
    email,
    role,
    name,
    facility: 'Test Facility',
    avatar: 'TU',
    ...(tenantId ? { tenantId, isConfigured: true, plan: 'GROWTH' } : {}),
  });
  return { cookie: `${SESSION_COOKIE}=${token}`, sid, userId, email };
}

/** Just the cookie of signIn(). */
export async function sessionFor(tenantId: string | undefined, role: StaffRole = 'Operations Director'): Promise<string> {
  return (await signIn(tenantId, role)).cookie;
}

export async function driverAuthFor(tenantId: string, vehicleId: string, tripId: string): Promise<string> {
  const { token } = await createDriverLinkToken(tenantId, vehicleId, tripId);
  return `Driver ${token}`;
}

/** The session cookie a route handler set on its response (e.g. login, invite accept). */
export function cookieFrom(res: Response): string | null {
  const match = res.headers.get('set-cookie')?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return match ? `${SESSION_COOKIE}=${match[1]}` : null;
}

export function request(
  url: string,
  init: { method?: string; cookie?: string; body?: unknown; headers?: Record<string, string> } = {},
): NextRequest {
  const headers: Record<string, string> = { ...(init.headers ?? {}) };
  if (init.cookie) headers.cookie = init.cookie;
  if (init.body !== undefined) headers['content-type'] = 'application/json';
  return new NextRequest(new URL(url, 'http://localhost'), {
    method: init.method ?? 'GET',
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

/** Route context for dynamic segments, e.g. params({ id: 'ORD-1001' }). */
export const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });
