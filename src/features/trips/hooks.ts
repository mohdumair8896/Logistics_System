// ─── Trips Feature — Hooks (Real API) ─────────────────────────────────────────
// Fetches trips from the real Neon PostgreSQL database via REST API.

'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Trip } from './types';

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
    speedKmH: (r.speedKmH ?? r.speed_kmh) !== undefined ? Number(r.speedKmH ?? r.speed_kmh) : undefined,
    fuelPercent: (r.fuelPercent ?? r.fuel_percent) !== undefined ? Number(r.fuelPercent ?? r.fuel_percent) : undefined,
    cargoTemp: (r.cargoTemp ?? r.cargo_temp) as string | undefined,
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

  const addTrip = useCallback(async (orderId: string): Promise<string> => {
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
    const data = await res.json();
    await fetchAll();
    return data.id ?? '';
  }, [fetchAll]);

  const updateTrip = useCallback(async (id: string, updates: Partial<Trip>) => {
    await fetch(`/api/trips/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setTrips(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const completeDelivery = useCallback(async (tripId: string) => {
    await fetch(`/api/trips/${tripId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: 'complete' }),
    });
    await fetchAll();
  }, [fetchAll]);

  return { trips, loading, addTrip, updateTrip, completeDelivery, refetch: fetchAll };
}
