// ─── Orders Feature — Hooks (Real API) ────────────────────────────────────────
// Fetches orders from the real Neon PostgreSQL database via REST API.

'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Order } from './types';

function mapOrder(r: Record<string, unknown>): Order {
  return {
    id: (r.id as string) ?? '',
    customerId: ((r.customerId ?? r.customer_id) as string) ?? '',
    origin: (r.origin as string) ?? '',
    destination: (r.destination as string) ?? '',
    items: (r.items as Order['items']) ?? [],
    totalWeight: Number(r.totalWeight ?? r.total_weight_kg ?? 0),
    status: (r.status as Order['status']) ?? 'Pending',
    createdAt: ((r.createdAt ?? r.created_at) as string) ?? '',
    deadline: (r.deadline as string) ?? '',
    vehicleId: (r.vehicleId ?? r.vehicle_id ?? null) as string | null,
    driverId: (r.driverId ?? r.driver_id ?? null) as string | null,
    distance: Number(r.distance ?? r.distance_km ?? 0),
    freightRate: Number(r.freightRate ?? r.freight_rate ?? 2.0),
    loadingBay: ((r.loadingBay ?? r.loading_bay) as string) ?? '',
  };
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.map(mapOrder));
      }
    } catch (err) {
      console.error('[useOrders] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const addOrder = useCallback(async (o: Omit<Order, 'id' | 'createdAt'>): Promise<string> => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(o),
    });
    const data = await res.json();
    await fetchOrders();
    return data.id ?? '';
  }, [fetchOrders]);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  const scanOrderItem = useCallback(async (orderId: string, productId: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: 'scanItem', productId }),
    });
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return { ...o, items: o.items.map(item => item.productId === productId ? { ...item, scanned: true } : item) };
    }));
  }, []);

  const allocateVehicle = useCallback(async (orderId: string, vehicleId: string, driverId: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: 'allocate', vehicleId, driverId }),
    });
    await fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, addOrder, updateOrder, scanOrderItem, allocateVehicle, refetch: fetchOrders };
}
