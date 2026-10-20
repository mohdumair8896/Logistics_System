/**
 * Signed tokens (pure crypto, no database) — safe to import from src/proxy.ts.
 * ─────────────────────────────────────────────────────────────────
 * Uses HMAC-SHA256 via Web Crypto API.
 * Session tokens are: base64(UTF-8 JSON payload) + "." + base64(HMAC signature).
 * Whether a session is still active (not signed out / revoked) is checked in
 * requireAuth() in src/lib/auth.ts against the sessions table.
 *
 * In production set AUTH_SECRET to a random 32+ char string.
 */

export interface SessionPayload {
  /** Server-side session id (sessions table); revoking it ends the session everywhere. */
  sid?: string;
  userId: string;
  email: string;
  role: string;
  name: string;
  facility: string;
  avatar: string;
  exp: number; // Unix timestamp (seconds)
  tenantId?: string;
  isConfigured?: boolean;
  plan?: string;
  companyName?: string;
}

/** Cookie name used for the session token */
export const SESSION_COOKIE = 'lms_session';

/** Session lifetime: 8 hours */
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    // Fail closed in production: a guessable secret would let anyone forge sessions.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[AUTH] AUTH_SECRET must be set to a random string of 32+ characters');
    }
    return 'dev-fallback-secret-min-32-chars-replace-me!!';
  }
  return secret;
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const buf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  // btoa over Uint8Array
  return btoa(Array.from(new Uint8Array(buf), b => String.fromCharCode(b)).join(''));
}

/** Timing-safe string comparison via XOR of char codes to resist timing attacks */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** base64 of UTF-8 bytes — plain btoa() throws on names like "राम" or "José". */
function encodeJson(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function decodeJson<T>(b64: string): T {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

/** Creates a signed session token string. */
export async function createSessionToken(
  payload: Omit<SessionPayload, 'exp'>
): Promise<string> {
  const full: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const data = encodeJson(full);
  const sig = await hmacSign(data, getSecret());
  return `${data}.${sig}`;
}

/**
 * Verifies the token signature and expiry (not revocation — see requireAuth).
 * Returns the payload on success, or null on any failure.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const dotIdx = token.lastIndexOf('.');
    if (dotIdx === -1) return null;
    const data = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);
    const expected = await hmacSign(data, getSecret());
    if (!safeEqual(expected, sig)) return null;
    const payload = decodeJson<SessionPayload>(data);
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Cookie options applied when setting the session cookie. */
export const COOKIE_OPTIONS = {
  name: SESSION_COOKIE,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
};

// ─── Driver GPS link tokens ───────────────────────────────────────────────────
// A dispatcher-issued, expiring token that lets one driver phone post GPS for
// exactly one vehicle + trip. Signed with a key derived from AUTH_SECRET so it
// can never be used as (or forged from) a staff session token.

export interface DriverLinkPayload {
  kind: 'driver-link';
  tenantId: string;
  vehicleId: string;
  tripId: string;
  exp: number; // Unix timestamp (seconds)
}

/** Driver links stay valid for 3 days — long enough for a multi-day trip. */
const DRIVER_LINK_TTL_SECONDS = 3 * 24 * 60 * 60;

function driverLinkSecret(): string {
  return `${getSecret()}:driver-link`;
}

function toBase64Url(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  return b64 + '='.repeat((4 - (b64.length % 4)) % 4);
}

export async function createDriverLinkToken(tenantId: string, vehicleId: string, tripId: string): Promise<{ token: string; exp: number }> {
  const payload: DriverLinkPayload = {
    kind: 'driver-link',
    tenantId,
    vehicleId,
    tripId,
    exp: Math.floor(Date.now() / 1000) + DRIVER_LINK_TTL_SECONDS,
  };
  const data = toBase64Url(encodeJson(payload));
  const sig = toBase64Url(await hmacSign(data, driverLinkSecret()));
  return { token: `${data}.${sig}`, exp: payload.exp };
}

/** Returns the payload if the token is authentic and unexpired, otherwise null. */
export async function verifyDriverLinkToken(token: string): Promise<DriverLinkPayload | null> {
  try {
    const dotIdx = token.lastIndexOf('.');
    if (dotIdx === -1) return null;
    const data = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);
    const expected = toBase64Url(await hmacSign(data, driverLinkSecret()));
    if (!safeEqual(expected, sig)) return null;
    const payload = decodeJson<DriverLinkPayload>(fromBase64Url(data));
    if (payload.kind !== 'driver-link' || !payload.tenantId || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ─── Consignee delivery OTP ───────────────────────────────────────────────────
// A 6-digit code per trip that the transporter sends to the consignee before delivery. At handover the
// receiver reads it out, and the POD records whether it matched. Derived rather than stored, with its
// own key, so a trip always has the same code and it can't be worked out from a session or driver link.

function deliveryOtpSecret(): string {
  return `${getSecret()}:delivery-otp`;
}

export async function deliveryOtp(tenantId: string, tripId: string): Promise<string> {
  const sig = atob(await hmacSign(`${tenantId}:${tripId}`, deliveryOtpSecret()));
  const n = ((sig.charCodeAt(0) << 24) | (sig.charCodeAt(1) << 16) | (sig.charCodeAt(2) << 8) | sig.charCodeAt(3)) >>> 0;
  return String(n % 1_000_000).padStart(6, '0');
}

export async function verifyDeliveryOtp(tenantId: string, tripId: string, code: string): Promise<boolean> {
  return safeEqual(await deliveryOtp(tenantId, tripId), code.trim());
}
