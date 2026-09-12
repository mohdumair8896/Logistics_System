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

export interface InventoryItem {
  id?: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  bay: string;
  productName?: string;
  unit?: string;
}

const fallbackInventory: InventoryItem[] = [
  { productId: 'P001', warehouseId: 'W001', quantity: 35000, bay: 'Bay A-12' },
  { productId: 'P002', warehouseId: 'W001', quantity: 22000, bay: 'Bay A-14' },
  { productId: 'P003', warehouseId: 'W001', quantity: 45000, bay: 'Bay B-04' },
  { productId: 'P004', warehouseId: 'W001', quantity: 18000, bay: 'Bay B-08' },
  { productId: 'P005', warehouseId: 'W001', quantity: 12000, bay: 'Bay C-02' },
  { productId: 'P006', warehouseId: 'W001', quantity: 9500, bay: 'Bay C-06' },
];

export function useWarehouse() {
  const { orders, scanOrderItem, refetch: refetchOrders } = useOrders();
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();
  const { drivers } = useDrivers();
  const { addTrip } = useTrips();
  const { products } = useProducts();
  const [inventory, setInventory] = useState<InventoryItem[]>(fallbackInventory);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setInventory(data);
        }
      }
    } catch {
      // Retain fallback on network failure
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const allocatedOrders = orders.filter(o => o.status === 'Allocated');

  // confirmLoading: mark order as In Transit, deduct inventory via API
  const confirmLoading = useCallback(async (orderId: string, bay = 'Bay 4') => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'In Transit', loadingBay: bay }),
    });

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
