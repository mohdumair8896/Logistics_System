// GET /api/inventory — list warehouse inventory records
// PATCH /api/inventory — adjust stock or bay location

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { inventory, products } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { withTenant } from '@/lib/tenancy';
import { parseJsonBody } from '@/lib/validation';

const adjustSchema = z.object({
  productId: z.string().min(1).max(20),
  quantityDeduction: z.number().min(0).max(10_000_000).optional(),
  bay: z.string().trim().max(20).optional(),
}).strict();

export async function GET(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;

  try {
    const rows = await withTenant(auth.tenantId, tx => tx.select({
      id: inventory.id,
      productId: inventory.productId,
      warehouseId: inventory.warehouseId,
      quantity: inventory.quantity,
      bay: inventory.bay,
      productName: products.name,
      unit: products.unit,
    })
      .from(inventory)
      .leftJoin(products, and(eq(inventory.productId, products.id), eq(products.tenantId, auth.tenantId)))
      .where(eq(inventory.tenantId, auth.tenantId)));

    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/inventory]', err);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'warehouse.load');
  if (denied) return denied;

  try {
    const parsed = await parseJsonBody(request, adjustSchema);
    if (!parsed.ok) return parsed.response;
    const { productId, quantityDeduction, bay } = parsed.data;

    return await withTenant(auth.tenantId, async tx => {
      const [existing] = await tx
        .select()
        .from(inventory)
        .where(and(eq(inventory.tenantId, auth.tenantId), eq(inventory.productId, productId)))
        .limit(1)
        .for('update');
      if (!existing) return NextResponse.json({ error: 'Item not found in inventory' }, { status: 404 });

      const newQty = quantityDeduction
        ? Math.max(0, (existing.quantity ?? 0) - quantityDeduction)
        : existing.quantity;

      await tx
        .update(inventory)
        .set({ quantity: newQty, bay: bay || existing.bay, updatedAt: new Date() })
        .where(and(eq(inventory.tenantId, auth.tenantId), eq(inventory.id, existing.id)));

      return NextResponse.json({ success: true, updatedQty: newQty });
    });
  } catch (err) {
    console.error('[PATCH /api/inventory]', err);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}
