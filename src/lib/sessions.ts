// ─── Server-side sessions (server-only) ───────────────────────────────────────
// Each sign-in creates a row; the token carries its id (sid). requireAuth() rejects a token whose
// session was revoked (sign-out, role change, removal from a workspace).
// Active checks are cached per server instance for a short time to avoid a query per request;
// revocations made by this instance take effect immediately, other instances within CACHE_MS.

import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from './db';
import { sessions } from './schema';
import { SESSION_TTL_SECONDS } from './session-token';

const CACHE_MS = 30_000;
const cache = new Map<string, { active: boolean; userId: string; until: number }>();

/** Pass a transaction to open the session together with other changes (e.g. a password change). */
export async function createSession(
  userId: string, tenantId: string | null, userAgent?: string | null, exec: Pick<typeof db, 'insert'> = db,
): Promise<string> {
  const sid = crypto.randomUUID();
  await exec.insert(sessions).values({
    id: sid,
    userId,
    tenantId,
    userAgent: userAgent ? userAgent.slice(0, 300) : null,
    expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
  });
  return sid;
}

/** True if the session exists, belongs to `userId`, isn't revoked and hasn't expired. */
export async function isSessionActive(sid: string, userId: string): Promise<boolean> {
  const hit = cache.get(sid);
  if (hit && hit.until > Date.now()) return hit.active && hit.userId === userId;

  const [row] = await db.select({ id: sessions.id }).from(sessions)
    .where(and(eq(sessions.id, sid), eq(sessions.userId, userId), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())));
  const active = !!row;
  cache.set(sid, { active, userId, until: Date.now() + CACHE_MS });
  if (cache.size > 10_000) cache.clear(); // bound memory
  return active;
}

export async function revokeSession(sid: string): Promise<void> {
  await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.id, sid), isNull(sessions.revokedAt)));
  cache.delete(sid);
}

/** Ends every active session of `userId` in `tenantId` (after a role change or removal). */
export async function revokeUserSessions(userId: string, tenantId: string): Promise<number> {
  const revoked = await db.update(sessions).set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), eq(sessions.tenantId, tenantId), isNull(sessions.revokedAt)))
    .returning({ id: sessions.id });
  for (const r of revoked) cache.delete(r.id);
  return revoked.length;
}

/**
 * Ends every active session of `userId` in every workspace, including sessions without one
 * (after a password reset). Pass a transaction to revoke together with the password change.
 */
export async function revokeAllUserSessions(userId: string, exec: Pick<typeof db, 'update'> = db): Promise<number> {
  const revoked = await exec.update(sessions).set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))
    .returning({ id: sessions.id });
  for (const r of revoked) cache.delete(r.id);
  return revoked.length;
}


