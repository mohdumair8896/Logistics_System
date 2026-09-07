/**
 * API Authentication Guard
 * ─────────────────────────────────────────────────────────────────
 * Call requireAuth(request) at the top of every API handler.
 * Returns the validated SessionPayload, or a ready-to-return 401 NextResponse.
 *
 * Usage:
 *   const authResult = await requireAuth(request);
 *   if (isAuthError(authResult)) return authResult;  // 401
 *   const user = authResult; // SessionPayload
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SessionPayload, SESSION_COOKIE } from './auth';

/** In-memory rate limiter (per-IP, max 60 requests per minute) */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true; // allowed
  }
  if (entry.count >= RATE_LIMIT) return false; // blocked
  entry.count++;
  return true; // allowed
}

/** Validates the session cookie and enforces rate limit. */
export async function requireAuth(
  request: NextRequest
): Promise<SessionPayload | NextResponse> {
  // Rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, message: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(RATE_LIMIT),
        },
      }
    );
  }

  // Auth check
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

  return payload;
}

/** Type guard: returns true if requireAuth returned an error response. */
export function isAuthError(v: SessionPayload | NextResponse): v is NextResponse {
  return v instanceof NextResponse;
}

// ── Input Allowlists ─────────────────────────────────────────────

export const ALLOWED_ORDER_STATUSES = new Set([
  'all', 'pending', 'allocated', 'staged', 'in transit', 'delivered', 'cancelled',
]);

export const ALLOWED_VEHICLE_STATUSES = new Set([
  'all', 'available', 'allocated', 'in transit', 'maintenance',
]);

/**
 * Sanitises a status query param against an allowlist.
 * Returns the original (un-lowercased) string if valid, null otherwise.
 */
export function sanitizeStatus(
  raw: string | null,
  allowed: Set<string>
): string | null {
  if (!raw) return null;
  return allowed.has(raw.toLowerCase().trim()) ? raw : null;
}
