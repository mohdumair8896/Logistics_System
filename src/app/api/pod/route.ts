// GET /api/pod — POD summaries for the workspace (newest first), so the delivery page can mark trips
// that already have a recorded, hashed POD.

import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { withTenant } from '@/lib/tenancy';
import { podRecords } from '@/lib/schema';
import { requireTenant, isAuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  try {
    const rows = await withTenant(auth.tenantId, tx => tx.select({
      tripId: podRecords.tripId,
      orderId: podRecords.orderId,
      receiverName: podRecords.receiverName,
      confirmation: podRecords.confirmation,
      capturedAt: podRecords.capturedAt,
      damageDeduction: podRecords.damageDeduction,
      recordHash: podRecords.recordHash,
    }).from(podRecords)
      .where(eq(podRecords.tenantId, auth.tenantId))
      .orderBy(desc(podRecords.capturedAt))
      .limit(500));
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/pod]', err);
    return NextResponse.json({ error: 'Failed to fetch POD records' }, { status: 500 });
  }
}
