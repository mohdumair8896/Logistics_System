import { NextRequest, NextResponse } from 'next/server';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { runAsTenant, withTenant } from '@/lib/tenancy';
import { eq } from 'drizzle-orm';
import { orders, vehicles, invoices, incidents, drivers } from '@/lib/schema';
import { LogisticsEventGraph } from '@/lib/agents/core/eventGraph';

export const dynamic = 'force-dynamic';

type Risk = { lane: string; detail: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' };

const DAY_MS = 24 * 60 * 60 * 1000;
/** Pending invoices older than this are reported as overdue receivables. */
const RECEIVABLE_OVERDUE_DAYS = 30;

function istGreeting(name: string): string {
  const hour = Number(new Date().toLocaleString('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Kolkata' }));
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return `${part}, ${name.split(' ')[0]}`;
}

export async function GET(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  try {
    // 1. Fetch live data (every number below is computed from these rows; nothing is padded)
    const t = auth.tenantId;
    const [allOrders, allVehicles, allInvoices, allIncidents, allDrivers] = await withTenant(t, tx => Promise.all([
      tx.select({ status: orders.status }).from(orders).where(eq(orders.tenantId, t)),
      tx.select({ status: vehicles.status }).from(vehicles).where(eq(vehicles.tenantId, t)),
      tx.select({ status: invoices.status, total: invoices.total, podSigned: invoices.podSigned, createdAt: invoices.createdAt }).from(invoices).where(eq(invoices.tenantId, t)),
      tx.select({ title: incidents.title, severity: incidents.severity, status: incidents.status }).from(incidents).where(eq(incidents.tenantId, t)),
      tx.select({ name: drivers.name, licenseExpiry: drivers.licenseExpiry }).from(drivers).where(eq(drivers.tenantId, t)),
    ]));

    const activeShipments = allOrders.filter(o => o.status === 'In Transit' || o.status === 'Allocated' || o.status === 'Pending').length;
    const delayedShipments = allOrders.filter(o => o.status === 'Delayed').length;
    const onTrack = Math.max(activeShipments - delayedShipments, 0);

    const openCritical = allIncidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED' && i.status !== 'AUTO_RESOLVED');
    const attentionIncidents = allIncidents.filter(i => (i.severity === 'HIGH' || i.severity === 'MEDIUM') && i.status === 'OPEN').length;

    const sumTotals = (rows: { total: string | null }[]) => rows.reduce((acc, i) => acc + (parseFloat(i.total || '0') || 0), 0);
    const disputedFreightInr = sumTotals(allInvoices.filter(i => i.status === 'Disputed'));
    const now = Date.now();
    const overdueInvoices = allInvoices.filter(i =>
      i.status === 'Pending' && i.createdAt && now - new Date(i.createdAt).getTime() > RECEIVABLE_OVERDUE_DAYS * DAY_MS);
    const overdueReceivablesInr = sumTotals(overdueInvoices);

    const missingPods = allInvoices.filter(i => !i.podSigned && i.status !== 'Paid').length;
    const unavailableTrucks = allVehicles.filter(v => v.status === 'Maintenance').length;
    const expiringLicences = allDrivers.filter(d =>
      d.licenseExpiry && new Date(d.licenseExpiry).getTime() - now <= 30 * DAY_MS);

    // 2. Risks derived from the data above (empty list when nothing needs attention)
    const topRisks: Risk[] = [
      ...openCritical.slice(0, 2).map(i => ({ lane: 'Critical incident', detail: i.title, severity: 'CRITICAL' as const })),
      ...(delayedShipments > 0 ? [{ lane: 'Delayed shipments', detail: `${delayedShipments} shipment(s) are running late`, severity: 'HIGH' as const }] : []),
      ...(expiringLicences.length > 0 ? [{
        lane: 'Driver compliance',
        detail: `${expiringLicences.length} driver licence(s) expired or expiring within 30 days`,
        severity: 'HIGH' as const,
      }] : []),
      ...(overdueInvoices.length > 0 ? [{
        lane: 'Receivables',
        detail: `${overdueInvoices.length} invoice(s) unpaid for more than ${RECEIVABLE_OVERDUE_DAYS} days`,
        severity: 'MEDIUM' as const,
      }] : []),
      ...(unavailableTrucks > 0 ? [{ lane: 'Fleet availability', detail: `${unavailableTrucks} vehicle(s) in maintenance`, severity: 'MEDIUM' as const }] : []),
    ].slice(0, 4);

    const metrics = await runAsTenant(auth.tenantId, () => LogisticsEventGraph.getOperationsMetrics());

    return NextResponse.json({
      success: true,
      data: {
        greeting: istGreeting(auth.name),
        timestamp: new Date().toISOString(),
        summary: {
          activeShipments,
          onTrack,
          requireAttention: attentionIncidents,
          severeExceptions: openCritical.length,
          disputedFreightInr,
          overdueReceivablesInr,
          unavailableTrucks,
          missingPods,
        },
        topRisks,
        metrics,
      },
    });
  } catch (error) {
    console.error('[API/Agent/Brief] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate operational brief' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'proposal.approve');
  if (denied) return denied;
  try {
    // 1-Click "Handle Routine Operations": approves pending low-risk items (autonomy level ≤ 3).
    // Note: approval is recorded here; executing approved actions arrives with the job runner (Phase 1).
    const pendingRoutine = await runAsTenant(auth.tenantId, () => LogisticsEventGraph.getOperationsQueue('PENDING_APPROVAL'));
    const routineItems = pendingRoutine.filter(i => (i.autonomyLevel ?? 3) <= 3);

    let resolvedCount = 0;
    for (const item of routineItems) {
      if (await runAsTenant(auth.tenantId, () => LogisticsEventGraph.resolveApproval(item.id, 'APPROVED', `Batch-approved by ${auth.name}`))) {
        resolvedCount++;
      }
    }

    if (resolvedCount > 0) {
      await runAsTenant(auth.tenantId, () => LogisticsEventGraph.recordEvent({
        eventType: 'PLAYBOOK_EXECUTED',
        actor: 'CONTROL_TOWER',
        title: 'Routine items approved',
        description: `${auth.name} approved ${resolvedCount} routine low-risk item(s) in one batch.`,
        autonomyLevel: 3,
        approvalRequired: false,
        approvalStatus: 'AUTO_APPROVED',
      }));
    }

    return NextResponse.json({
      success: true,
      resolvedCount,
      message: resolvedCount > 0
        ? `Approved ${resolvedCount} routine item(s).`
        : 'No routine items are waiting for approval.',
    });
  } catch (error) {
    console.error('[API/Agent/Brief] POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to execute routine operations' }, { status: 500 });
  }
}
