// GET /api/inventory — list warehouse inventory records
// PATCH /api/inventory — adjust stock or bay location

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inventory, products } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const rows = await db.select({
      id: inventory.id,
      productId: inventory.productId,
      warehouseId: inventory.warehouseId,
      quantity: inventory.quantity,
      bay: inventory.bay,
      productName: products.name,
      unit: products.unit,
    })
    .from(inventory)
    .leftJoin(products, eq(inventory.productId, products.id));

    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/inventory]', err);
    return NextResponse.json([]);
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const { productId, quantityDeduction, bay } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.productId, productId))
      .limit(1);

    if (existing) {
      const newQty = quantityDeduction
        ? Math.max(0, (existing.quantity ?? 0) - Number(quantityDeduction))
        : existing.quantity;

      await db
        .update(inventory)
        .set({
          quantity: newQty,
          bay: bay || existing.bay,
          updatedAt: new Date(),
        })
        .where(eq(inventory.id, existing.id));

      return NextResponse.json({ success: true, updatedQty: newQty });
    }

    return NextResponse.json({ error: 'Item not found in inventory' }, { status: 404 });
  } catch (err) {
    console.error('[PATCH /api/inventory]', err);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}
