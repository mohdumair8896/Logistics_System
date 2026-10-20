// ─── Best-effort rate limiting (per server instance) ──────────────────────────
// Sliding-window counters in memory. Good enough to blunt password guessing and form spam on a
// single instance; swap for Upstash Redis to share limits across instances (docs/TECH_STACK.md).

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const buckets = new Map<string, number[]>();

/** Records a hit for `key`; true when more than `max` hits happened within `windowMs`. */
export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter(t => now - t < windowMs);
  recent.push(now);
  buckets.set(key, recent);
  if (buckets.size > 20_000) buckets.clear(); // bound memory
  return recent.length > max;
}

export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

export function tooManyRequests(message = 'Too many attempts. Please wait a few minutes and try again.'): NextResponse {
  return NextResponse.json({ success: false, error: message, message }, { status: 429 });
}

/** For tests. */
export function resetRateLimits(): void {
  buckets.clear();
}
