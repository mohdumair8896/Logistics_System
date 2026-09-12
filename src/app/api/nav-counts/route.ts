// GET /api/nav-counts — lightweight count aggregator for sidebar badges
// Prevents downloading full tables of orders, trips, and leads across all dashboard pages.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, trips, shipperLeads } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const [[pendingOrders], [activeTrips], [newLeads]] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(orders).where(eq(orders.status, 'Pending')),
      db.select({ count: sql<number>`count(*)::int` }).from(trips).where(eq(trips.status, 'In Transit')),
      db.select({ count: sql<number>`count(*)::int` }).from(shipperLeads).where(eq(shipperLeads.status, 'New')),
    ]);

    return NextResponse.json({
      pendingOrders: pendingOrders?.count ?? 0,
      activeTrips: activeTrips?.count ?? 0,
      newLeads: newLeads?.count ?? 0,
    });
  } catch (err) {
    console.error('[GET /api/nav-counts]', err);
    return NextResponse.json({ pendingOrders: 0, activeTrips: 0, newLeads: 0 });
  }
}
