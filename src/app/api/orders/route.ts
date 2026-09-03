import { NextResponse } from 'next/server';
import { initialOrders } from '@/lib/mockData';
import { OrderService } from '@/lib/services/orderService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let results = initialOrders;
  if (status && status !== 'All') {
    results = results.filter(o => o.status.toLowerCase() === status.toLowerCase());
  }

  return NextResponse.json({
    success: true,
    count: results.length,
    data: results,
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = OrderService.validateOrder(body);

    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        errors: validation.errors
      }, { status: 400 });
    }

    const newOrder = {
      ...body,
      id: `ORD-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };

    return NextResponse.json({
      success: true,
      data: newOrder,
      message: 'Order created and queued for allocation'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Invalid request payload'
    }, { status: 500 });
  }
}
