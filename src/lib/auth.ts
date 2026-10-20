/**
 * Auth for API route handlers (server-only).
 * ─────────────────────────────────────────────────────────────────
 * Token signing/verification lives in ./session-token (pure crypto, also used by the proxy).
 * requireAuth() additionally checks the server-side session is still active, so sign-out,
 * role changes and removal from a workspace take effect immediately.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE, type SessionPayload } from './session-token';
import { isSessionActive } from './sessions';

export * from './session-token';

/**
 * Validates the session cookie in API route handlers.
 * Returns SessionPayload if valid, or a ready-to-return 401 NextResponse.
 */
export async function requireAuth(
  request: NextRequest
): Promise<SessionPayload | NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, message: 'Invalid or expired session. Please log in again.' },
      { status: 401 }
    );
  }

  // Tokens from before server-side sessions (no sid), or whose session was revoked
  if (!payload.sid || !(await isSessionActive(payload.sid, payload.userId))) {
    return NextResponse.json(
      { success: false, message: 'Your session has ended. Please sign in again.' },
      { status: 401 }
    );
  }

  return payload;
}

/** Type guard: returns true if requireAuth/requireTenant returned an error response. */
export function isAuthError<T>(v: T | NextResponse): v is NextResponse {
  return v instanceof NextResponse;
}

/** A signed-in session that belongs to a company workspace. */
export type TenantSession = SessionPayload & { tenantId: string; sid: string };

/**
 * Like requireAuth, but also requires a workspace. Use for every tenant-scoped route,
 * then run queries inside withTenant(session.tenantId, …) from '@/lib/tenancy'.
 */
export async function requireTenant(request: NextRequest): Promise<TenantSession | NextResponse> {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;
  if (!auth.tenantId) {
    // Sessions issued before workspaces existed carry no tenant: force a fresh sign-in.
    return NextResponse.json(
      { success: false, message: 'Your session has expired. Please sign in again.' },
      { status: 401 }
    );
  }
  return auth as TenantSession;
}
