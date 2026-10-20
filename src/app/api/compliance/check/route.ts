// GET /api/compliance/check
// Compliance automation engine — runs checks and creates DB alerts automatically.
// Call this endpoint via:
//   - Vercel Cron (nightly): sweeps every workspace, each in its own tenant transaction
//   - A signed-in user: checks only that user's workspace
//
// Checks performed:
//   1. Driver license expiry (30-day, 7-day, expired)
//   2. Vehicle last service overdue (>90 days)
//   3. Unverified driver documents
//   4. Vehicles without assigned drivers that are 'In Transit'
//
// Phase 6 roadmap:
//   - Add Insurance/PUC expiry tracking
//   - Integrate MoRTH Vahan API for real license verification
//   - WhatsApp alerts to drivers whose licenses expire in 7 days

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { drivers, vehicles, systemAlerts, tenants } from '@/lib/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { publishToAbly } from '@/lib/ably-server';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { withTenant } from '@/lib/tenancy';

interface ComplianceResult {
  checksRun: number;
  alertsCreated: number;
  issues: string[];
}

const DAY_MS = 1000 * 60 * 60 * 24;

/** Runs every check for one workspace and records new alerts there. */
async function runComplianceForTenant(tenantId: string): Promise<ComplianceResult> {
  const result: ComplianceResult = { checksRun: 0, alertsCreated: 0, issues: [] };
  const today = new Date();

  await withTenant(tenantId, async (tx) => {
    const [allDrivers, allVehicles, activeAlerts] = await Promise.all([
      tx.select().from(drivers).where(eq(drivers.tenantId, tenantId)),
      tx.select().from(vehicles).where(eq(vehicles.tenantId, tenantId)),
      tx.select({ title: systemAlerts.title }).from(systemAlerts)
        .where(and(eq(systemAlerts.tenantId, tenantId), isNull(systemAlerts.dismissedAt))),
    ]);

    const existingTitles = new Set(activeAlerts.map(a => a.title));
    const alertsToInsert: { tenantId: string; title: string; description: string; severity: string; category: string }[] = [];

    const queueAlert = (severity: string, category: string, title: string, description: string) => {
      if (!existingTitles.has(title)) {
        existingTitles.add(title);
        alertsToInsert.push({ tenantId, title, description, severity, category });
        result.alertsCreated++;
      }
      result.issues.push(description);
    };

    // ─── 1. License Expiry Checks ──────────────────────────────────────────────
    result.checksRun++;
    for (const driver of allDrivers) {
      if (!driver.licenseExpiry) continue;
      const expiry = new Date(driver.licenseExpiry);
      const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / DAY_MS);

      if (daysLeft < 0) {
        queueAlert('critical', 'Driver', `License EXPIRED: ${driver.name}`,
          `${driver.name}'s commercial license expired ${Math.abs(daysLeft)} day(s) ago (${driver.licenseExpiry}). Vehicle operations suspended until renewal.`);
      } else if (daysLeft <= 7) {
        queueAlert('critical', 'Driver', `License Expiring in ${daysLeft}d: ${driver.name}`,
          `${driver.name}'s commercial license expires in ${daysLeft} day(s) on ${driver.licenseExpiry}. Immediate renewal required.`);
      } else if (daysLeft <= 30) {
        queueAlert('warning', 'Driver', `License Renewal Due: ${driver.name}`,
          `${driver.name}'s license expires in ${daysLeft} days (${driver.licenseExpiry}). Schedule renewal before dispatch.`);
      }
    }

    // ─── 2. Unverified Documents ───────────────────────────────────────────────
    result.checksRun++;
    for (const driver of allDrivers.filter(d => !d.documentVerified)) {
      queueAlert('warning', 'Driver', `Documents Unverified: ${driver.name}`,
        `${driver.name} (${driver.id}) has unverified compliance documents. Cannot be dispatched until HR verification is complete.`);
    }

    // ─── 3. Vehicle Service Overdue ────────────────────────────────────────────
    result.checksRun++;
    for (const vehicle of allVehicles) {
      if (!vehicle.lastService) continue;
      const daysSinceService = Math.ceil((today.getTime() - new Date(vehicle.lastService).getTime()) / DAY_MS);
      if (daysSinceService > 90) {
        queueAlert('warning', 'Fleet', `Service Overdue: ${vehicle.vehicleNo}`,
          `Vehicle ${vehicle.vehicleNo} last serviced ${daysSinceService} days ago (${vehicle.lastService}). Mandatory maintenance inspection overdue. Remove from active roster.`);
      }
    }

    // ─── 4. In Transit vehicles without driver ─────────────────────────────────
    result.checksRun++;
    for (const v of allVehicles.filter(v => v.status === 'In Transit' && !v.driverId)) {
      queueAlert('critical', 'Fleet', `Ghost Trip Detected: ${v.vehicleNo}`,
        `Vehicle ${v.vehicleNo} shows 'In Transit' but has no assigned driver. Possible data integrity issue — investigate immediately.`);
    }

    if (alertsToInsert.length > 0) {
      await tx.insert(systemAlerts).values(alertsToInsert);
    }
  });

  if (result.alertsCreated > 0) {
    await publishToAbly(`tenant:${tenantId}:alerts`, 'compliance-check', {
      alertsCreated: result.alertsCreated,
      issues: result.issues.slice(0, 3),
    });
  }
  return result;
}

export async function GET(req: NextRequest) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set on the project.
  const cronSecret = process.env.CRON_SECRET;
  const isAuthorizedCron = !!cronSecret && req.headers.get('authorization') === `Bearer ${cronSecret}`;

  try {
    if (isAuthorizedCron) {
      // System sweep across workspaces; one tenant's failure doesn't stop the others
      const allTenants = await db.select({ id: tenants.id }).from(tenants);
      let alertsCreated = 0;
      const failedTenants: string[] = [];
      for (const t of allTenants) {
        try {
          alertsCreated += (await runComplianceForTenant(t.id)).alertsCreated;
        } catch (err) {
          console.error(`[GET /api/compliance/check] tenant ${t.id} failed`, err);
          failedTenants.push(t.id);
        }
      }
      return NextResponse.json({
        success: failedTenants.length === 0,
        tenantsChecked: allTenants.length,
        alertsCreated,
        failedTenants: failedTenants.length,
        timestamp: new Date().toISOString(),
      }, { status: failedTenants.length === 0 ? 200 : 500 });
    }

    const auth = await requireTenant(req);
    if (isAuthError(auth)) return auth;
    const denied = requirePermission(auth, 'compliance.run');
    if (denied) return denied;
    const result = await runComplianceForTenant(auth.tenantId);
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
      message: result.alertsCreated > 0
        ? `${result.alertsCreated} compliance alert(s) created`
        : 'All compliance checks passed — no issues found',
    });
  } catch (err) {
    console.error('[GET /api/compliance/check]', err);
    return NextResponse.json({ error: 'Compliance check failed' }, { status: 500 });
  }
}
