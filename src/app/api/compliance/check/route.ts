// GET /api/compliance/check
// Compliance automation engine — runs checks and creates DB alerts automatically.
// Call this endpoint via:
//   - A cron job (e.g., Vercel Cron at midnight daily)
//   - A manual trigger from the Compliance dashboard
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
import { drivers, vehicles, systemAlerts } from '@/lib/schema';
import { isNull } from 'drizzle-orm';
import { publishToAbly } from '@/lib/ably-server';
import { requireAuth, isAuthError } from '@/lib/auth';

interface ComplianceResult {
  checksRun: number;
  alertsCreated: number;
  issues: string[];
}

export async function GET(req: NextRequest) {
  // Allow both cron (secret header) and authenticated user requests
  const cronSecret = req.headers.get('x-cron-secret');
  const isAuthorizedCron = process.env.CRON_SECRET
    ? cronSecret === process.env.CRON_SECRET
    : process.env.NODE_ENV === 'development' && !!cronSecret;

  if (!isAuthorizedCron) {
    const auth = await requireAuth(req);
    if (isAuthError(auth)) return auth;
  }

  const result: ComplianceResult = { checksRun: 0, alertsCreated: 0, issues: [] };
  const today = new Date();
  const in7Days = new Date(today); in7Days.setDate(today.getDate() + 7);
  const in30Days = new Date(today); in30Days.setDate(today.getDate() + 30);

  try {
    const [allDrivers, allVehicles, activeAlerts] = await Promise.all([
      db.select().from(drivers),
      db.select().from(vehicles),
      db.select({ title: systemAlerts.title }).from(systemAlerts).where(isNull(systemAlerts.dismissedAt)),
    ]);

    const existingTitles = new Set(activeAlerts.map(a => a.title));
    const alertsToInsert: { title: string; description: string; severity: string; category: string }[] = [];

    const queueAlert = (severity: string, category: string, title: string, description: string) => {
      if (!existingTitles.has(title)) {
        existingTitles.add(title);
        alertsToInsert.push({ title, description, severity, category });
        result.alertsCreated++;
      }
      result.issues.push(description);
    };

    // ─── 1. License Expiry Checks ──────────────────────────────────────────────
    result.checksRun++;
    for (const driver of allDrivers) {
      if (!driver.licenseExpiry) continue;
      const expiry = new Date(driver.licenseExpiry);
      const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        // Already expired
        const alertMsg = `${driver.name}'s commercial license expired ${Math.abs(daysLeft)} day(s) ago (${driver.licenseExpiry}). Vehicle operations suspended until renewal.`;
        queueAlert('critical', 'Driver', `License EXPIRED: ${driver.name}`, alertMsg);
      } else if (daysLeft <= 7) {
        // Expires within 7 days
        const alertMsg = `${driver.name}'s commercial license expires in ${daysLeft} day(s) on ${driver.licenseExpiry}. Immediate renewal required.`;
        queueAlert('critical', 'Driver', `License Expiring in ${daysLeft}d: ${driver.name}`, alertMsg);
      } else if (daysLeft <= 30) {
        // Expires within 30 days
        const alertMsg = `${driver.name}'s license expires in ${daysLeft} days (${driver.licenseExpiry}). Schedule renewal before dispatch.`;
        queueAlert('warning', 'Driver', `License Renewal Due: ${driver.name}`, alertMsg);
      }
    }

    // ─── 2. Unverified Documents ───────────────────────────────────────────────
    result.checksRun++;
    const unverifiedDrivers = allDrivers.filter(d => !d.documentVerified);
    for (const driver of unverifiedDrivers) {
      const alertMsg = `${driver.name} (${driver.id}) has unverified compliance documents. Cannot be dispatched until HR verification is complete.`;
      queueAlert('warning', 'Driver', `Documents Unverified: ${driver.name}`, alertMsg);
    }

    // ─── 3. Vehicle Service Overdue ────────────────────────────────────────────
    result.checksRun++;
    for (const vehicle of allVehicles) {
      if (!vehicle.lastService) continue;
      const lastService = new Date(vehicle.lastService);
      const daysSinceService = Math.ceil((today.getTime() - lastService.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceService > 90) {
        const alertMsg = `Vehicle ${vehicle.vehicleNo} last serviced ${daysSinceService} days ago (${vehicle.lastService}). Mandatory maintenance inspection overdue. Remove from active roster.`;
        queueAlert('warning', 'Fleet', `Service Overdue: ${vehicle.vehicleNo}`, alertMsg);
      }
    }

    // ─── 4. In Transit vehicles without driver ─────────────────────────────────
    result.checksRun++;
    const ghostVehicles = allVehicles.filter(v => v.status === 'In Transit' && !v.driverId);
    for (const v of ghostVehicles) {
      const alertMsg = `Vehicle ${v.vehicleNo} shows 'In Transit' but has no assigned driver. Possible data integrity issue — investigate immediately.`;
      queueAlert('critical', 'Fleet', `Ghost Trip Detected: ${v.vehicleNo}`, alertMsg);
    }

    // Batch insert new alerts
    if (alertsToInsert.length > 0) {
      await db.insert(systemAlerts).values(alertsToInsert);
    }

    // ─── Broadcast new alerts via Ably ────────────────────────────────────────
    if (result.alertsCreated > 0) {
      await publishToAbly('alerts', 'compliance-check', {
        alertsCreated: result.alertsCreated,
        issues: result.issues.slice(0, 3),
      });
    }

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
    return NextResponse.json({ error: 'Compliance check failed', details: String(err) }, { status: 500 });
  }
}
