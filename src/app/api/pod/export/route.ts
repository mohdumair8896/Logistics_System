// GET /api/pod/export?tripId=TRP-1001            — one trip's POD
// GET /api/pod/export?from=2026-10-01&to=2026-10-31 — every POD captured on those days (India time)
// Downloads a JSON audit file: each stored record, its SHA-256 re-checked now, the signature check, and
// the facts about how records are made that a section 63 (Bharatiya Sakshya Adhiniyam) certificate asks
// for. The file supports a certificate; it is not one (see buildPodAuditExport).

import { NextRequest, NextResponse } from 'next/server';
import { and, asc, eq, gte, lt } from 'drizzle-orm';
import { withTenant } from '@/lib/tenancy';
import { podRecords, tenants } from '@/lib/schema';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { isoDate } from '@/lib/validation';
import { buildPodAuditExport } from '@/features/delivery/pod';

const MAX_DAYS = 366;
const MAX_RECORDS = 2000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Midnight at the start of an India calendar day (IST is UTC+05:30 all year). */
const istMidnight = (day: string) => new Date(`${day}T00:00:00+05:30`);

export async function GET(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'pod.export');
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId')?.trim() ?? '';
    const from = searchParams.get('from') ?? '';
    const to = searchParams.get('to') ?? '';

    let scope: { tripId: string } | { from: string; to: string };
    let where;
    if (tripId) {
      if (tripId.length > 20) return NextResponse.json({ error: 'Unknown trip' }, { status: 400 });
      scope = { tripId };
      where = and(eq(podRecords.tenantId, auth.tenantId), eq(podRecords.tripId, tripId));
    } else {
      if (!isoDate.safeParse(from).success || !isoDate.safeParse(to).success) {
        return NextResponse.json({ error: 'Give tripId, or from and to as YYYY-MM-DD' }, { status: 400 });
      }
      const start = istMidnight(from);
      const end = new Date(istMidnight(to).getTime() + DAY_MS);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        return NextResponse.json({ error: '"to" must be on or after "from"' }, { status: 400 });
      }
      if (end.getTime() - start.getTime() > MAX_DAYS * DAY_MS) {
        return NextResponse.json({ error: `Export at most ${MAX_DAYS} days at a time` }, { status: 400 });
      }
      scope = { from, to };
      where = and(eq(podRecords.tenantId, auth.tenantId), gte(podRecords.capturedAt, start), lt(podRecords.capturedAt, end));
    }

    const { rows, workspaceName } = await withTenant(auth.tenantId, async (tx) => {
      const [tenant] = await tx.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, auth.tenantId));
      const found = await tx.select({
        id: podRecords.id, tripId: podRecords.tripId, orderId: podRecords.orderId,
        capturedAt: podRecords.capturedAt, createdAt: podRecords.createdAt, createdBy: podRecords.createdBy,
        record: podRecords.record, recordHash: podRecords.recordHash, signaturePng: podRecords.signaturePng,
      }).from(podRecords).where(where).orderBy(asc(podRecords.capturedAt)).limit(MAX_RECORDS + 1);
      return { rows: found, workspaceName: tenant?.name ?? '' };
    });
    if (tripId && rows.length === 0) {
      return NextResponse.json({ error: 'No POD recorded for this trip' }, { status: 404 });
    }
    if (rows.length > MAX_RECORDS) {
      return NextResponse.json({ error: `More than ${MAX_RECORDS} PODs in that range. Export a shorter range.` }, { status: 400 });
    }

    const file = await buildPodAuditExport(rows, {
      generatedAt: new Date(),
      generatedBy: { userId: auth.userId, name: auth.name, role: auth.role },
      workspace: { id: auth.tenantId, name: workspaceName },
      scope,
    });
    const name = tripId ? `pod-audit-${tripId}` : `pod-audit-${from}-to-${to}`;
    return new NextResponse(JSON.stringify(file, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${name.replace(/[^A-Za-z0-9._-]/g, '_')}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[GET /api/pod/export]', err);
    return NextResponse.json({ error: 'Failed to build the POD audit export' }, { status: 500 });
  }
}
