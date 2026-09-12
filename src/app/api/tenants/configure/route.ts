import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError, createSessionToken, COOKIE_OPTIONS } from '@/lib/auth';
import { db } from '@/lib/db';
import { tenants } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (isAuthError(auth)) return auth;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const {
      archetype = 'FLEET_OWNER',
      complexityScore = 25,
      companyName,
    } = body;

    const tenantId = auth.tenantId || `ten_custom_${Date.now()}`;

    // 1. Update tenant record in database
    try {
      const [existing] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
      if (existing) {
        await db.update(tenants).set({
          archetype,
          complexityScore,
          isConfigured: true,
          name: companyName || existing.name,
        }).where(eq(tenants.id, tenantId));
      }
    } catch (dbErr) {
      console.warn('[Configure API] DB update warning:', dbErr);
    }

    // 2. Re-issue updated session token with isConfigured: true
    const updatedToken = await createSessionToken({
      userId: auth.userId,
      email: auth.email,
      role: auth.role as 'Operations Director' | 'Fleet Dispatcher' | 'Compliance Officer',
      name: auth.name,
      facility: companyName || auth.facility,
      avatar: auth.avatar,
      tenantId,
      isConfigured: true, // <<-- Now fully unlocked!
      plan: auth.plan || 'GROWTH',
      companyName: companyName || auth.companyName,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Logistics OS workspace successfully assembled and provisioned',
    });

    response.cookies.set({
      ...COOKIE_OPTIONS,
      value: updatedToken,
    });

    return response;
  } catch (err) {
    console.error('[POST /api/tenants/configure]', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
