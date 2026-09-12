import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, COOKIE_OPTIONS } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = await createSessionToken({
    userId: 'usr_demo_visitor',
    email: 'guest.demo@logiflow.io',
    role: 'Operations Director',
    name: 'Demo Visitor',
    facility: 'National Logistics Hub',
    avatar: 'DV',
    tenantId: 'ten_abc_transport',
    isDemo: true,
    isConfigured: true,
    plan: 'GROWTH',
    companyName: 'LogiFlow Interactive Demo Sandbox',
  });

  const redirectUrl = new URL('/dashboard?demo=true', request.url);
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set({
    ...COOKIE_OPTIONS,
    value: token,
  });

  return response;
}
