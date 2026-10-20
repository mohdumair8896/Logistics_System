import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants, tenantSubscriptions, users, memberships } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { createSessionToken, COOKIE_OPTIONS } from '@/lib/auth';
import { createSession } from '@/lib/sessions';
import { checkNewPassword, hashPassword } from '@/lib/passwords';
import { clientIp, isRateLimited, tooManyRequests } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(`signup:ip:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
      return tooManyRequests('Too many sign-ups from this network. Please try again later.');
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const { companyName, adminName, email, password, plan } = body;

    if (!companyName || !adminName || !email || !password) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanCompany = String(companyName).trim();
    const cleanName = String(adminName).trim();
    const chosenPlan = String(plan || 'GROWTH').toUpperCase();

    if (!['FLEX', 'GROWTH', 'SCALE', 'ENTERPRISE'].includes(chosenPlan)) {
      return NextResponse.json({ success: false, message: 'Unknown plan' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) {
      return NextResponse.json({ success: false, message: 'Enter a valid email address' }, { status: 400 });
    }
    const refused = await checkNewPassword(String(password), { email: cleanEmail, companyName: cleanCompany });
    if (refused) {
      return NextResponse.json({ success: false, message: refused }, { status: 400 });
    }

    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, cleanEmail));
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists. Please sign in.' },
        { status: 409 }
      );
    }

    // Generate unique tenant slug and id
    const baseSlug = cleanCompany.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40) || 'company';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const tenantSlug = `${baseSlug}-${randomSuffix}`;
    const tenantId = `ten_${tenantSlug}`;
    const userId = `usr_${baseSlug}_${randomSuffix}`;

    // Hash password
    const passwordHash = await hashPassword(String(password));
    const avatar = cleanName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD';

    // Tenant, subscription, admin user and membership are created together or not at all
    await db.transaction(async (tx) => {
      // 1. Create tenant record (marked as is_configured: false)
      await tx.insert(tenants).values({
        id: tenantId,
        name: cleanCompany,
        slug: tenantSlug,
        archetype: 'FLEET_OWNER', // default initial placeholder until /setup questionnaire
        country: 'IN',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        complexityScore: 20,
      });

      // 2. Create subscription record
      const maxVehicles = chosenPlan === 'FLEX' ? 25 : chosenPlan === 'GROWTH' ? 100 : chosenPlan === 'SCALE' ? 350 : 2000;
      const maxShipments = chosenPlan === 'FLEX' ? 500 : chosenPlan === 'GROWTH' ? 2500 : chosenPlan === 'SCALE' ? 10000 : 50000;
      const maxAiActions = chosenPlan === 'FLEX' ? 1000 : chosenPlan === 'GROWTH' ? 7500 : chosenPlan === 'SCALE' ? 30000 : 100000;

      await tx.insert(tenantSubscriptions).values({
        id: `sub_${tenantSlug}`,
        tenantId,
        plan: chosenPlan,
        status: 'ACTIVE',
        maxVehicles,
        maxMonthlyShipments: maxShipments,
        maxAiActions,
        spendingLimitCap: chosenPlan === 'ENTERPRISE' ? '250000' : '50000',
      });

      // 3. Create Admin user
      await tx.insert(users).values({
        id: userId,
        email: cleanEmail,
        name: cleanName,
        passwordHash,
        role: 'Operations Director',
        facility: cleanCompany,
        avatar,
        tenantId,
        isActive: true,
      });

      // 4. Admin membership of the new workspace
      await tx.insert(memberships).values({ userId, tenantId, role: 'Operations Director' });
    });

    // 5. Create signed session token with isConfigured: false
    const sid = await createSession(userId, tenantId, request.headers.get('user-agent'));
    const token = await createSessionToken({
      sid,
      userId,
      email: cleanEmail,
      role: 'Operations Director',
      name: cleanName,
      facility: cleanCompany,
      avatar,
      tenantId,
      isConfigured: false, // <<-- Gates user directly into first-time questionnaire!
      plan: chosenPlan,
      companyName: cleanCompany,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Subscription created successfully',
      redirectUrl: '/setup',
    });

    response.cookies.set({
      ...COOKIE_OPTIONS,
      value: token,
    });

    return response;
  } catch (err) {
    console.error('[POST /api/auth/register-subscription]', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
