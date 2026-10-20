// ─── Agent API — POST /api/agent/driver-chat ──────────────────────────────────
// Dedicated endpoint for driver communications in Hindi / Hinglish / English.

import { NextRequest, NextResponse } from 'next/server';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { runAsTenant, withTenant } from '@/lib/tenancy';
import { agents } from '@/lib/agents/core/registry';
import { driverMessages } from '@/lib/schema';
import { and, eq, desc } from 'drizzle-orm';
import type { LogisticsEvent } from '@/lib/agents/core/types';

export async function POST(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'agent.run');
  if (denied) return denied;

  try {
    const body = await req.json();
    const { driverId, text, channel = 'WHATSAPP' } = body || {};

    if (!driverId || !text) {
      return NextResponse.json(
        { success: false, message: 'Both "driverId" and "text" are required' },
        { status: 400 }
      );
    }

    // Sanitize message to strip malicious script/HTML injection while preserving operational intent
    const sanitizedText = String(text)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();

    const event: LogisticsEvent = {
      id: `evt-msg-${Date.now()}`,
      type: 'DRIVER_MESSAGE_RECEIVED',
      timestamp: new Date().toISOString(),
      entityId: driverId,
      payload: { driverId, text: sanitizedText || String(text).trim(), channel },
    };

    const results = await runAsTenant(auth.tenantId, () => agents.publish(event));
    const driverResult = results.find((r) => r.agentId === 'driver-agent');

    return NextResponse.json({
      success: true,
      driverResult,
      allResults: results,
    });
  } catch (err: unknown) {
    console.error('[/api/agent/driver-chat]', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const driverId = searchParams.get('driverId');

  try {
    const messages = await withTenant(auth.tenantId, tx => tx.select().from(driverMessages)
      .where(driverId
        ? and(eq(driverMessages.tenantId, auth.tenantId), eq(driverMessages.driverId, driverId))
        : eq(driverMessages.tenantId, auth.tenantId))
      .orderBy(desc(driverMessages.createdAt))
      .limit(50));

    return NextResponse.json({ success: true, messages: messages.reverse() });
  } catch (err: unknown) {
    console.error('[/api/agent/driver-chat]', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
