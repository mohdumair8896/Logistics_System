// ─── Vehicles Feature — Hooks (Real API) ──────────────────────────────────────
// Fetches vehicles from the real Neon PostgreSQL database via REST API.

'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Vehicle } from './types';
import type { Driver } from '@/features/drivers/types';

// ─── DB row → Vehicle type mapper ─────────────────────────────────────────────
export function mapVehicle(r: Record<string, unknown>): Vehicle {
  return {
    id: (r.id as string) ?? '',
    vehicleNo: ((r.vehicleNo ?? r.vehicle_no) as string) ?? '',
    type: (r.type as string) ?? 'Heavy Duty Truck',
    capacity: Number(r.capacity ?? r.capacity_kg ?? 0),
    currentLoad: Number(r.currentLoad ?? r.current_load_kg ?? 0),
    status: (r.status as Vehicle['status']) ?? 'Available',
    driverId: (r.driverId ?? r.driver_id ?? null) as string | null,
    location: (r.location as string) ?? '',
    lastService: ((r.lastService ?? r.last_service) as string) ?? '',
    odometerKm: Number(r.odometerKm ?? r.odometer_km ?? 0),
    fuelLevel: Number(r.fuelLevel ?? r.fuel_level ?? 100),
    activityLog: ((r.activityLog ?? r.activity_log) as Vehicle['activityLog']) ?? [],
  };
}

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch('/api/vehicles');
      const data = await res.json();
      if (Array.isArray(data)) {
        setVehicles(data.map(mapVehicle));
      }
    } catch (err) {
      console.error('[useVehicles] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const addVehicle = useCallback(
    async (v: Omit<Vehicle, 'id'>) => {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v),
      });
      if (res.ok) await fetchVehicles();
    },
    [fetchVehicles]
  );

  const updateVehicle = useCallback(async (id: string, updates: Partial<Vehicle>) => {
    await fetch(`/api/vehicles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  }, []);

  return { vehicles, loading, addVehicle, updateVehicle, refetch: fetchVehicles };
}

/** Pure selector to find vehicle and assigned driver from pre-fetched lists */
export function findVehicleWithDriver(
  id: string | null,
  vehicles: Vehicle[],
  drivers: Driver[]
) {
  const vehicle = vehicles.find((v) => v.id === id) ?? vehicles[0] ?? null;
  const assignedDriver = vehicle ? drivers.find((d) => d.id === vehicle.driverId) ?? null : null;
  return { vehicle, assignedDriver };
}
