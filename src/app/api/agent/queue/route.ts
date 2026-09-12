import { NextResponse } from 'next/server';
import { LogisticsEventGraph } from '@/lib/agents/core/eventGraph';
import { ActionEngine } from '@/lib/agents/core/actionEngine';
import type { AutonomyLevel } from '@/lib/agents/core/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | null;

    const queueItems = await LogisticsEventGraph.getOperationsQueue(status || undefined);
    const metrics = await LogisticsEventGraph.getOperationsMetrics();

    // Group items into Critical, Attention, and Routine
    const critical = queueItems.filter(i => (i.autonomyLevel ?? 3) >= 4 || (i.evidence?.financialImpactInr !== undefined && i.evidence.financialImpactInr > 5000));
    const attention = queueItems.filter(i => i.approvalStatus === 'PENDING_APPROVAL' && !critical.includes(i));
    const routine = queueItems.filter(i => i.approvalStatus === 'AUTO_APPROVED' || i.approvalStatus === 'APPROVED');

    return NextResponse.json({
      success: true,
      data: {
        all: queueItems,
        critical,
        attention,
        routine,
        metrics,
        autonomyLevel: ActionEngine.getAutonomyLevel(),
      },
    });
  } catch (error) {
    console.error('[API/Agent/Queue] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch operations queue' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, decision, notes, newAutonomyLevel } = body;

    // Handle autonomy level update
    if (typeof newAutonomyLevel === 'number') {
      ActionEngine.setAutonomyLevel(newAutonomyLevel as AutonomyLevel);
      return NextResponse.json({
        success: true,
        message: `Autonomy level updated to Level ${newAutonomyLevel}`,
        autonomyLevel: ActionEngine.getAutonomyLevel(),
      });
    }

    if (!eventId || !decision) {
      return NextResponse.json({ success: false, error: 'eventId and decision (APPROVED|REJECTED) are required' }, { status: 400 });
    }

    const resolved = await LogisticsEventGraph.resolveApproval(eventId, decision, notes);

    return NextResponse.json({
      success: true,
      eventId,
      decision,
      resolved,
      message: `Action [${decision}] successfully recorded in Event Graph.`,
    });
  } catch (error) {
    console.error('[API/Agent/Queue] POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update queue item' }, { status: 500 });
  }
}
