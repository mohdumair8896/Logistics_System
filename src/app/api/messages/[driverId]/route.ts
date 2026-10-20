// GET /api/messages/[driverId] — fetch message history with a driver
// POST /api/messages/[driverId] — send a message to a driver (dispatcher → driver)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { driverMessages, drivers } from '@/lib/schema';
import { and, eq, asc } from 'drizzle-orm';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { withTenant } from '@/lib/tenancy';
import { parseJsonBody } from '@/lib/validation';

const sendMessageSchema = z.object({
  text: z.string().trim().min(1, 'Message text is required').max(2000),
  sender: z.enum(['dispatcher', 'driver']).optional().default('dispatcher'),
}).strict();

const istTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

export async function GET(request: NextRequest, { params }: { params: Promise<{ driverId: string }> }) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  try {
    const { driverId } = await params;
    const rows = await withTenant(auth.tenantId, tx => tx.select()
      .from(driverMessages)
      .where(and(eq(driverMessages.tenantId, auth.tenantId), eq(driverMessages.driverId, driverId)))
      .orderBy(asc(driverMessages.createdAt)));

    const mapped = rows.map(r => ({
      id: r.id,
      sender: r.sender,
      text: r.text,
      time: r.createdAt ? istTime(new Date(r.createdAt)) : 'Unknown',
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    console.error('[GET /api/messages/[driverId]]', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ driverId: string }> }) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'message.send');
  if (denied) return denied;
  try {
    const { driverId } = await params;
    const parsed = await parseJsonBody(req, sendMessageSchema);
    if (!parsed.ok) return parsed.response;
    const { text, sender } = parsed.data;

    return await withTenant(auth.tenantId, async tx => {
      const [driver] = await tx.select({ id: drivers.id }).from(drivers)
        .where(and(eq(drivers.tenantId, auth.tenantId), eq(drivers.id, driverId)));
      if (!driver) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });

      const [created] = await tx.insert(driverMessages).values({
        tenantId: auth.tenantId,
        driverId,
        sender,
        text,
      }).returning();

      // TODO: Phase 4 — after saving to DB, send WhatsApp via Meta Cloud API:
      // if (sender === 'dispatcher') await sendWhatsApp(driverPhone, text);

      return NextResponse.json({
        id: created.id,
        sender: created.sender,
        text: created.text,
        time: istTime(new Date(created.createdAt!)),
      }, { status: 201 });
    });
  } catch (err) {
    console.error('[POST /api/messages/[driverId]]', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
