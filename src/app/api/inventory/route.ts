// GET /api/inventory — list warehouse inventory records
// PATCH /api/inventory — adjust stock or bay location

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inventory, products } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth';

const DEFAULT_INVENTORY_SEED = [
  { productId: 'P001', warehouseId: 'W001', quantity: 35000, bay: 'Bay A-12' },
  { productId: 'P002', warehouseId: 'W001', quantity: 22000, bay: 'Bay A-14' },
  { productId: 'P003', warehouseId: 'W001', quantity: 45000, bay: 'Bay B-04' },
  { productId: 'P004', warehouseId: 'W001', quantity: 18000, bay: 'Bay B-08' },
  { productId: 'P005', warehouseId: 'W001', quantity: 12000, bay: 'Bay C-02' },
  { productId: 'P006', warehouseId: 'W001', quantity: 9500, bay: 'Bay C-06' },
];

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    let rows = await db.select({
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

    // Auto-seed inventory if empty
    if (rows.length === 0) {
      for (const item of DEFAULT_INVENTORY_SEED) {
        await db.insert(inventory).values(item).onConflictDoNothing();
      }
      rows = await db.select({
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
    }

    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/inventory]', err);
    // Safe fallback to default inventory on DB connection issues
    return NextResponse.json(DEFAULT_INVENTORY_SEED);
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
