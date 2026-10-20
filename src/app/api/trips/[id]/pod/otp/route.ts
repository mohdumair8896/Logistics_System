// GET /api/trips/[id]/pod/otp — the trip's consignee delivery OTP, for the dispatcher to send to the
// consignee before delivery (never to the driver). At handover the receiver reads it out and the POD
// records whether it matched. The code is derived per trip (src/lib/session-token.ts), so asking again
// returns the same code.

import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { withTenant } from '@/lib/tenancy';
import { customers, orders, tenants, trips } from '@/lib/schema';
import { requireTenant, isAuthError, deliveryOtp } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'trip.dispatch');
  if (denied) return denied;
  try {
    const { id } = await params;
    const found = await withTenant(auth.tenantId, async (tx) => {
      const [trip] = await tx.select({ id: trips.id, orderId: trips.orderId, status: trips.status })
        .from(trips).where(and(eq(trips.tenantId, auth.tenantId), eq(trips.id, id)));
      if (!trip) return null;
      const [tenant] = await tx.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, auth.tenantId));
      const [customer] = trip.orderId
        ? await tx.select({ name: customers.name, phone: customers.phone }).from(orders)
          .innerJoin(customers, and(eq(customers.tenantId, orders.tenantId), eq(customers.id, orders.customerId)))
          .where(and(eq(orders.tenantId, auth.tenantId), eq(orders.id, trip.orderId)))
        : [];
      return { trip, transporter: tenant?.name ?? 'Your transporter', customer: customer ?? null };
    });
    if (!found) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    if (found.trip.status === 'Cancelled') {
      return NextResponse.json({ error: 'This trip was cancelled' }, { status: 409 });
    }

    const otp = await deliveryOtp(auth.tenantId, id);
    const message = `${found.transporter}: delivery code for trip ${id} is ${otp}. Tell it to the driver only when the goods reach you. `
      + `ट्रिप ${id} का डिलीवरी कोड ${otp} है। माल मिलने पर ही ड्राइवर को बताएं।`;
    const digits = (found.customer?.phone ?? '').replace(/\D/g, '');
    const waNumber = digits.length === 10 ? `91${digits}` : digits.length >= 11 ? digits : null;

    return NextResponse.json({
      otp,
      message,
      customerName: found.customer?.name ?? null,
      whatsappUrl: waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}` : null,
    });
  } catch (err) {
    console.error('[GET /api/trips/[id]/pod/otp]', err);
    return NextResponse.json({ error: 'Failed to get the delivery OTP' }, { status: 500 });
  }
}
