import { NextRequest, NextResponse } from 'next/server';
import { initialOrders } from '@/lib/mockData';
import { requireAuth, isAuthError, sanitizeStatus, ALLOWED_ORDER_STATUSES } from '@/lib/apiAuth';
import { validateOrderPost } from '@/lib/validators';

export async function GET(request: NextRequest) {
  // Auth guard — 401 if no valid session
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get('status');

  // Allowlist the status param — reject anything not in the set
  const status = sanitizeStatus(rawStatus, ALLOWED_ORDER_STATUSES);
  if (rawStatus && !status) {
    return NextResponse.json(
      { success: false, message: 'Invalid status filter value' },
      { status: 400 }
    );
  }

  let results = initialOrders;
  if (status && status.toLowerCase() !== 'all') {
    results = results.filter(o => o.status.toLowerCase() === status.toLowerCase());
  }

  return NextResponse.json({
    success: true,
    count: results.length,
    data: results,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  // Auth guard
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const raw = await request.json().catch(() => null);

    // Validate + strip non-allowlisted fields (mass-assignment protection)
    const validation = validateOrderPost(raw);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, errors: validation.errors },
        { status: 400 }
      );
    }

    // Build the new order strictly from validated data — never spread raw body
    const validated = validation.data!;
    const newOrder = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      customerId: validated.customerId,
      origin: validated.origin,
      destination: validated.destination,
      totalWeight: validated.totalWeight,
      items: validated.items ?? [],
      distance: validated.distance ?? 0,
      freightRate: validated.freightRate ?? 0,
      loadingBay: validated.loadingBay ?? '',
      status: 'Pending' as const,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: auth.userId,
    };

    return NextResponse.json(
      {
        success: true,
        data: newOrder,
        message: 'Order created and queued for allocation',
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request payload' },
      { status: 400 }
    );
  }
}
