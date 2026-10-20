// ─── Warehouse Feature — Hooks (Real API) ────────────────────────────────────
// Connects warehouse staging and inventory to Neon PostgreSQL.

'use client';
import { useState, useEffect, useCallback } from 'react';
import { useOrders } from '@/features/orders/hooks';
import { useCustomers } from '@/features/customers/hooks';
import { useVehicles } from '@/features/vehicles/hooks';
import { useDrivers } from '@/features/drivers/hooks';
import { useTrips } from '@/features/trips/hooks';
import { useProducts } from '@/features/products/hooks';
import { apiMutate } from '@/lib/apiClient';

export interface InventoryItem {
  id?: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  bay: string;
  productName?: string;
  unit?: string;
}

export function useWarehouse() {
  const { orders, scanOrderItem, refetch: refetchOrders } = useOrders();
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();
  const { drivers } = useDrivers();
  const { addTrip } = useTrips();
  const { products } = useProducts();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setInventory(data);
      }
    } catch {
      // Keep the last loaded stock on a network failure
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const allocatedOrders = orders.filter(o => o.status === 'Allocated');

  // confirmLoading: mark order as In Transit, deduct inventory via API
  const confirmLoading = useCallback(async (orderId: string, bay = 'Bay 4'): Promise<boolean> => {
    const result = await apiMutate(`/api/orders/${orderId}`, 'PATCH', { status: 'In Transit', loadingBay: bay });
    if (!result.ok) return false; // don't deduct stock for a load that didn't leave

    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder?.items) {
      for (const it of targetOrder.items) {
        await fetch('/api/inventory', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: it.productId,
            quantityDeduction: it.quantity,
          }),
        }).catch(() => null);
      }
      await fetchInventory();
    }

    await refetchOrders();
    return true;
  }, [orders, refetchOrders, fetchInventory]);

  return {
    orders,
    allocatedOrders,
    inventory,
    vehicles,
    drivers,
    customers,
    products,
    confirmLoading,
    addTrip,
    scanOrderItem,
    refetchInventory: fetchInventory,
  };
}
