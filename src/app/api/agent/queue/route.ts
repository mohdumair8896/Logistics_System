import { NextRequest, NextResponse } from 'next/server';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { runAsTenant } from '@/lib/tenancy';
import { db } from '@/lib/db';
import { agentAuditLogs } from '@/lib/schema';
import { LogisticsEventGraph } from '@/lib/agents/core/eventGraph';
import { ActionEngine } from '@/lib/agents/core/actionEngine';
import type { AutonomyLevel } from '@/lib/agents/core/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | null;

    const queueItems = await runAsTenant(auth.tenantId, () => LogisticsEventGraph.getOperationsQueue(status || undefined));
    const metrics = await runAsTenant(auth.tenantId, () => LogisticsEventGraph.getOperationsMetrics());

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
        autonomyLevel: await runAsTenant(auth.tenantId, () => ActionEngine.getAutonomyLevel()),
      },
    });
  } catch (error) {
    console.error('[API/Agent/Queue] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch operations queue' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }
    const { eventId, decision, notes, newAutonomyLevel } = body;

    // Handle autonomy level update (Operations Director only)
    if (newAutonomyLevel !== undefined) {
      const denied = requirePermission(auth, 'autonomy.configure');
      if (denied) return denied;
      if (!Number.isInteger(newAutonomyLevel) || newAutonomyLevel < 0 || newAutonomyLevel > 5) {
        return NextResponse.json({ success: false, error: 'newAutonomyLevel must be an integer from 0 to 5' }, { status: 400 });
      }
      await runAsTenant(auth.tenantId, () => ActionEngine.setAutonomyLevel(newAutonomyLevel as AutonomyLevel));
      return NextResponse.json({
        success: true,
        message: `Autonomy level updated to Level ${newAutonomyLevel}`,
        autonomyLevel: await runAsTenant(auth.tenantId, () => ActionEngine.getAutonomyLevel()),
      });
    }

    const deniedApproval = requirePermission(auth, 'proposal.approve');
    if (deniedApproval) return deniedApproval;

    if (typeof eventId !== 'string' || (decision !== 'APPROVED' && decision !== 'REJECTED')) {
      return NextResponse.json({ success: false, error: 'eventId and decision (APPROVED|REJECTED) are required' }, { status: 400 });
    }

    const cleanNotes = typeof notes === 'string' && notes.trim() ? notes.trim().slice(0, 500) : undefined;
    const resolved = await runAsTenant(auth.tenantId, () => LogisticsEventGraph.resolveApproval(eventId, decision, cleanNotes));

    // Record who made the decision (audit trail)
    await db.insert(agentAuditLogs).values({
      tenantId: auth.tenantId,
      agentId: 'approvals-queue',
      eventType: `ACTION_${decision}`,
      entityId: eventId,
      message: `${decision} by ${auth.name} (${auth.role})`,
      payload: { userId: auth.userId, notes: cleanNotes ?? null },
    }).catch(err => console.error('[API/Agent/Queue] audit log failed:', err));

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
