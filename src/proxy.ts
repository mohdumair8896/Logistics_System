/**
 * Next.js Edge Middleware (src/middleware.ts)
 * ─────────────────────────────────────────────────────────────────
 * Runs on EVERY request at the Edge before any page or route renders.
 *
 * Responsibilities:
 *   1. Force HTTPS in production
 *   2. Server-side auth guard — redirect to /login before React renders
 *   3. Set all security headers (CSP, HSTS, Permissions-Policy, etc.)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from './lib/auth';

// ── Route Definitions ────────────────────────────────────────────

/** Dashboard page paths requiring an authenticated session */
const PROTECTED_PAGE_PREFIXES = [
  '/dashboard',
  '/vehicles',
  '/drivers',
  '/orders',
  '/allocation',
  '/warehouse',
  '/trips',
  '/tracking',
  '/delivery',
  '/invoices',
  '/leads',
  '/knowledge-base',
];

// ── Content Security Policy ──────────────────────────────────────

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https:",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ');

// ── Middleware ────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const proto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host');

  // 1. Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && proto === 'http' && host) {
    const httpsUrl = `https://${host}${pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(httpsUrl, { status: 301 });
  }

  // 2. Server-side auth guard for protected pages
  const isProtectedPage = PROTECTED_PAGE_PREFIXES.some(prefix =>
    pathname === prefix || pathname.startsWith(prefix + '/')
  );

  if (isProtectedPage) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    let session = null;
    if (token) {
      session = await verifySessionToken(token);
    }
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Attach security headers to every response
  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.headers.set('Content-Security-Policy', CSP);

  return response;
}

// Next.js 16 alias support
export { middleware as proxy };

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static  (JS/CSS bundles)
     * - _next/image   (image optimiser)
     * - favicon.ico
     * - frames/       (animation frame assets)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|frames).*)',
  ],
};
