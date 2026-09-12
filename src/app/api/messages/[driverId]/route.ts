// GET /api/messages/[driverId] — fetch message history with a driver
// POST /api/messages/[driverId] — send a message to a driver (dispatcher → driver)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { driverMessages } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ driverId: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { driverId } = await params;
    const rows = await db.select()
      .from(driverMessages)
      .where(eq(driverMessages.driverId, driverId))
      .orderBy(asc(driverMessages.createdAt));

    const mapped = rows.map(r => ({
      id: r.id,
      sender: r.sender,
      text: r.text,
      time: r.createdAt
        ? new Date(r.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : 'Unknown',
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    console.error('[GET /api/messages/[driverId]]', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ driverId: string }> }) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  try {
    const { driverId } = await params;
    const body = await req.json();
    const { text, sender = 'dispatcher' } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    const [created] = await db.insert(driverMessages).values({
      driverId,
      sender,
      text: text.trim(),
    }).returning();

    // TODO: Phase 4 — after saving to DB, send WhatsApp via Meta Cloud API:
    // if (sender === 'dispatcher') await sendWhatsApp(driverPhone, text);

    return NextResponse.json({
      id: created.id,
      sender: created.sender,
      text: created.text,
      time: new Date(created.createdAt!).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/messages/[driverId]]', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
