// ─── Agent API — POST /api/agent/event ─────────────────────────────────────────
// Ingests any structured or unformatted event and routes it through the Event Bus.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { agents } from '@/lib/agents/core/registry';
import type { LogisticsEvent } from '@/lib/agents/core/types';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    if (!body || !body.type) {
      return NextResponse.json(
        { success: false, message: 'Missing required event "type"' },
        { status: 400 }
      );
    }

    const event: LogisticsEvent = {
      id: body.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: body.type,
      timestamp: body.timestamp || new Date().toISOString(),
      entityId: body.entityId,
      payload: body.payload || {},
      metadata: {
        ...(body.metadata || {}),
        dispatchedBy: auth.email,
        role: auth.role,
      },
    };

    const results = await agents.publish(event);

    return NextResponse.json({
      success: true,
      event: { id: event.id, type: event.type },
      results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
