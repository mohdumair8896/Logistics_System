/**
 * Auth Session Utilities
 * ─────────────────────────────────────────────────────────────────
 * Uses HMAC-SHA256 via Web Crypto API — fully Edge Runtime compatible.
 * Tokens are: base64(JSON payload) + "." + base64(HMAC signature)
 *
 * In production set AUTH_SECRET to a random 32+ char string.
 */

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  facility: string;
  avatar: string;
  exp: number; // Unix timestamp (seconds)
}

/** Cookie name used for the session token */
export const SESSION_COOKIE = 'lms_session';

/** Session lifetime: 8 hours */
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    // Warn loudly in production; fall back to a weak dev secret otherwise
    if (process.env.NODE_ENV === 'production') {
      console.error('[AUTH] AUTH_SECRET env var is not set — sessions are insecure!');
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

async function hmacVerify(data: string, sig: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(data, secret);
  // Constant-time comparison via XOR of char codes
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}

/** Creates a signed session token string. */
export async function createSessionToken(
  payload: Omit<SessionPayload, 'exp'>
): Promise<string> {
  const full: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const data = btoa(JSON.stringify(full));
  const sig = await hmacSign(data, getSecret());
  return `${data}.${sig}`;
}

/**
 * Verifies the token signature and expiry.
 * Returns the payload on success, or null on any failure.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const dotIdx = token.lastIndexOf('.');
    if (dotIdx === -1) return null;
    const data = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);
    const valid = await hmacVerify(data, sig, getSecret());
    if (!valid) return null;
    const payload: SessionPayload = JSON.parse(atob(data));
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
