/**
 * Next.js Proxy — src/proxy.ts  (Next 16 name for middleware.ts)
 * ─────────────────────────────────────────────────────────────────
 * Runs on every request before any page or route renders.
 *
 * Responsibilities:
 *   1. Force HTTPS in production
 *   2. Server-side auth guard — redirect to /login before React renders
 *   3. Set all security headers (CSP, HSTS, Permissions-Policy, etc.).
 *      This is the single source of truth for them — next.config.ts only sets cache headers.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from './lib/session-token';

// ── Route Definitions ────────────────────────────────────────────

/** Dashboard page paths requiring an authenticated session */
const PROTECTED_PAGE_PREFIXES = [
  '/dashboard',
  '/agent-ops',
  '/shipments',
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
  '/compliance',
  '/settings',
];

/** Pages that need device sensors. The driver app streams GPS from the phone. */
const DRIVER_APP_PREFIX = '/driver-app';

// ── Security headers ─────────────────────────────────────────────

const isDev = process.env.NODE_ENV === 'development';

// Analytics script hosts, allowed only when the matching ID is configured (src/lib/analytics.ts).
// Their beacons go to https: origins, which connect-src already allows.
const posthogAssets = (process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com')
  .replace(/\/$/, '').replace('.i.posthog.com', '-assets.i.posthog.com');
const ANALYTICS_SCRIPT_HOSTS = [
  process.env.NEXT_PUBLIC_GA_ID ? 'https://www.googletagmanager.com' : '',
  process.env.NEXT_PUBLIC_CLARITY_ID ? 'https://www.clarity.ms https://*.clarity.ms' : '',
  process.env.NEXT_PUBLIC_POSTHOG_KEY ? posthogAssets : '',
].filter(Boolean).join(' ');

// React needs 'unsafe-eval' only in development (debug stack reconstruction).
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}${ANALYTICS_SCRIPT_HOSTS ? ' ' + ANALYTICS_SCRIPT_HOSTS : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https: wss:",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const DEFAULT_PERMISSIONS = 'camera=(), microphone=(), geolocation=(), payment=()';
const DRIVER_APP_PERMISSIONS = 'camera=(self), microphone=(), geolocation=(self), payment=()';

function isPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

// ── Proxy ────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const proto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host');

  // 1. Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && proto === 'http' && host) {
    const httpsUrl = `https://${host}${pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(httpsUrl, { status: 301 });
  }

  // 2. Server-side auth guard for protected pages
  const isProtectedPage = PROTECTED_PAGE_PREFIXES.some(prefix => isPrefix(pathname, prefix));

  if (isProtectedPage) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // First-Time Login Guard: If customer has paid but hasn't completed 7-stage setup, hold at /setup
    if (session.isConfigured === false && pathname !== '/setup') {
      return NextResponse.redirect(new URL('/setup', request.url));
    }
  }

  // Guard /setup: Must have an active session (or redirect to /login)
  if (pathname === '/setup') {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', '/setup');
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Attach security headers to every response
  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set(
    'Permissions-Policy',
    isPrefix(pathname, DRIVER_APP_PREFIX) ? DRIVER_APP_PERMISSIONS : DEFAULT_PERMISSIONS,
  );
  response.headers.set('Content-Security-Policy', CSP);

  return response;
}

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
