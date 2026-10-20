// GET /api/alerts — list active (non-dismissed) alerts
// POST /api/alerts — create a real system alert
// DELETE /api/alerts — dismiss all active alerts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { systemAlerts } from '@/lib/schema';
import { and, eq, isNull, desc, sql } from 'drizzle-orm';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { withTenant } from '@/lib/tenancy';
import { parseJsonBody } from '@/lib/validation';

const createAlertSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  severity: z.enum(['info', 'warning', 'critical']),
  category: z.enum(['Weather', 'Fleet', 'Driver', 'Route', 'Warehouse', 'Cold-Chain', 'Geofence']),
}).strict();

export async function GET(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  try {
    const rows = await withTenant(auth.tenantId, tx => tx.select()
      .from(systemAlerts)
      .where(and(eq(systemAlerts.tenantId, auth.tenantId), isNull(systemAlerts.dismissedAt)))
      .orderBy(desc(systemAlerts.createdAt))
      .limit(50));

    // Map DB format to app format
    const mapped = rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      severity: r.severity,
      category: r.category,
      timestamp: r.createdAt
        ? new Date(r.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
        : 'Just now',
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    console.error('[GET /api/alerts]', err);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'alert.manage');
  if (denied) return denied;
  try {
    const parsed = await parseJsonBody(req, createAlertSchema);
    if (!parsed.ok) return parsed.response;
    const [created] = await withTenant(auth.tenantId, tx => tx.insert(systemAlerts)
      .values({ ...parsed.data, tenantId: auth.tenantId })
      .returning());
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('[POST /api/alerts]', err);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'alert.manage');
  if (denied) return denied;
  try {
    await withTenant(auth.tenantId, tx => tx.update(systemAlerts)
      .set({ dismissedAt: sql`now()` })
      .where(and(eq(systemAlerts.tenantId, auth.tenantId), isNull(systemAlerts.dismissedAt))));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/alerts]', err);
    return NextResponse.json({ error: 'Failed to dismiss all alerts' }, { status: 500 });
  }
}
