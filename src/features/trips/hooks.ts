// ─── Trips Feature — Hooks (Real API) ─────────────────────────────────────────
// Fetches trips from the real Neon PostgreSQL database via REST API.

'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Trip } from './types';
import { apiMutate } from '@/lib/apiClient';

function mapTrip(r: Record<string, unknown>): Trip {
  return {
    id: (r.id as string) ?? '',
    orderId: ((r.orderId ?? r.order_id) as string) ?? '',
    vehicleId: ((r.vehicleId ?? r.vehicle_id) as string) ?? '',
    driverId: ((r.driverId ?? r.driver_id) as string) ?? '',
    origin: (r.origin as string) ?? '',
    destination: (r.destination as string) ?? '',
    distance: Number(r.distance ?? r.distance_km ?? 0),
    load: Number(r.load ?? r.load_kg ?? 0),
    status: (r.status as Trip['status']) ?? 'In Transit',
    progress: Number(r.progress ?? 0),
    startedAt: ((r.startedAt ?? r.started_at) as string) ?? '',
    eta: (r.eta ?? null) as string | null,
    completedAt: (r.completedAt ?? r.completed_at ?? null) as string | null,
    speedKmH: (r.speedKmH ?? r.speed_kmh) != null ? Number(r.speedKmH ?? r.speed_kmh) : undefined,
    fuelPercent: (r.fuelPercent ?? r.fuel_percent) != null ? Number(r.fuelPercent ?? r.fuel_percent) : undefined,
    cargoTemp: ((r.cargoTemp ?? r.cargo_temp) as string | null | undefined) ?? undefined,
    geofenceStatus: (r.geofenceStatus ?? r.geofence_status) as Trip['geofenceStatus'] | undefined,
    checkpoints: (r.checkpoints as Trip['checkpoints']) ?? [],
    lat: r.lat as string | null | undefined,
    lng: r.lng as string | null | undefined,
    updatedAt: (r.updatedAt ?? r.created_at) as string | null | undefined,
  };
}

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch('/api/trips');
      const data = await res.json();
      setTrips(data.map(mapTrip));
    } catch (err) {
      console.error('[useTrips] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /** Creates a trip for an allocated order. Returns the trip ID, or null if the server refused. */
  const addTrip = useCallback(async (orderId: string): Promise<string | null> => {
    const result = await apiMutate<{ id: string }>('/api/trips', 'POST', { orderId });
    await fetchAll();
    return result.ok ? result.data.id : null;
  }, [fetchAll]);

  const updateTrip = useCallback(async (id: string, updates: Partial<Trip>): Promise<boolean> => {
    const result = await apiMutate(`/api/trips/${id}`, 'PATCH', updates);
    if (result.ok) setTrips(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    return result.ok;
  }, []);

  /** Marks a trip delivered (frees the vehicle and driver). Returns false if the server refused. */
  const completeDelivery = useCallback(async (tripId: string): Promise<boolean> => {
    const result = await apiMutate(`/api/trips/${tripId}`, 'PATCH', { _action: 'complete' });
    await fetchAll();
    return result.ok;
  }, [fetchAll]);

  return { trips, loading, addTrip, updateTrip, completeDelivery, refetch: fetchAll };
}
