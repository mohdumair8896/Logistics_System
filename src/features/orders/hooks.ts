// ─── Orders Feature — Hooks (Real API) ────────────────────────────────────────
// Fetches orders from the real Neon PostgreSQL database via REST API.

'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Order } from './types';
import { apiMutate } from '@/lib/apiClient';

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

  /** Creates an order. Returns the order ID, or null if the server refused. */
  const addOrder = useCallback(async (o: Omit<Order, 'id' | 'createdAt'>): Promise<string | null> => {
    const result = await apiMutate<{ id: string }>('/api/orders', 'POST', o);
    await fetchOrders();
    return result.ok ? result.data.id : null;
  }, [fetchOrders]);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>): Promise<boolean> => {
    const result = await apiMutate(`/api/orders/${id}`, 'PATCH', updates);
    if (result.ok) setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    return result.ok;
  }, []);

  const scanOrderItem = useCallback(async (orderId: string, productId: string): Promise<boolean> => {
    const result = await apiMutate(`/api/orders/${orderId}`, 'PATCH', { _action: 'scanItem', productId });
    if (!result.ok) return false;
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return { ...o, items: o.items.map(item => item.productId === productId ? { ...item, scanned: true } : item) };
    }));
    return true;
  }, []);

  /** Allocates a vehicle + driver. Pass overrideReason to assign a busy vehicle or unavailable driver. */
  const allocateVehicle = useCallback(async (orderId: string, vehicleId: string, driverId: string, overrideReason?: string): Promise<boolean> => {
    const result = await apiMutate(`/api/orders/${orderId}`, 'PATCH', {
      _action: 'allocate', vehicleId, driverId, ...(overrideReason ? { overrideReason } : {}),
    });
    await fetchOrders();
    return result.ok;
  }, [fetchOrders]);

  return { orders, loading, addOrder, updateOrder, scanOrderItem, allocateVehicle, refetch: fetchOrders };
}
