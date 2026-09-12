// GET /api/auth/me
// Returns the currently logged-in user's profile from the JWT session cookie.
// Used by Header, Sidebar, and layout to show real user identity.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  return NextResponse.json({
    id: auth.userId,
    name: auth.name,
    email: auth.email,
    role: auth.role,
    facility: auth.facility,
    avatar: auth.avatar,
    tenantId: auth.tenantId,
    isConfigured: auth.isConfigured !== false,
    plan: auth.plan || 'GROWTH',
    companyName: auth.companyName || 'My Logistics Workspace',
  });
}
