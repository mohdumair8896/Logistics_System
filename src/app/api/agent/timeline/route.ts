import { NextRequest, NextResponse } from 'next/server';
import { requireTenant, isAuthError } from '@/lib/auth';
import { runAsTenant } from '@/lib/tenancy';
import { LogisticsEventGraph } from '@/lib/agents/core/eventGraph';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const shipmentId = searchParams.get('shipmentId');

    if (!shipmentId) {
      return NextResponse.json({ success: false, error: 'shipmentId query param required' }, { status: 400 });
    }

    const timeline = await runAsTenant(auth.tenantId, () => LogisticsEventGraph.getShipmentTimeline(shipmentId));

    return NextResponse.json({
      success: true,
      shipmentId,
      eventsCount: timeline.length,
      timeline,
    });
  } catch (error) {
    console.error('[API/Agent/Timeline] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch shipment timeline' }, { status: 500 });
  }
}
