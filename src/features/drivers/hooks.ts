// ─── Drivers Feature — Hooks (Real API) ──────────────────────────────────────
// Fetches drivers from the real Neon PostgreSQL database via REST API.

'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Driver } from './types';
import type { Vehicle } from '@/features/vehicles/types';

export function mapDriver(r: Record<string, unknown>): Driver {
  return {
    id: (r.id as string) ?? '',
    name: (r.name as string) ?? '',
    phone: (r.phone as string) ?? '',
    licenseNo: ((r.licenseNo ?? r.license_no) as string) ?? '',
    licenseExpiry: ((r.licenseExpiry ?? r.license_expiry) as string) ?? '',
    vehicleId: (r.vehicleId ?? r.vehicle_id ?? null) as string | null,
    status: (r.status as Driver['status']) ?? 'Available',
    trips: Number(r.trips ?? r.trips_count ?? 0),
    rating: parseFloat((r.rating as string) ?? '5.0'),
    documentVerified: Boolean(r.documentVerified ?? r.document_verified ?? false),
  };
}

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch('/api/drivers');
      const data = await res.json();
      if (Array.isArray(data)) {
        setDrivers(data.map(mapDriver));
      }
    } catch (err) {
      console.error('[useDrivers] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const addDriver = useCallback(async (d: Omit<Driver, 'id'>) => {
    const res = await fetch('/api/drivers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d),
    });
    if (res.ok) await fetchDrivers();
  }, [fetchDrivers]);

  const updateDriver = useCallback(async (id: string, updates: Partial<Driver>) => {
    await fetch(`/api/drivers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  }, []);

  const reassignDriverVehicle = useCallback(
    async (driverId: string, newVehicleId: string | null) => {
      await fetch(`/api/drivers/${driverId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _action: 'reassignVehicle', newVehicleId }),
      });
      await fetchDrivers();
    },
    [fetchDrivers]
  );

  return { drivers, loading, addDriver, updateDriver, reassignDriverVehicle, refetch: fetchDrivers };
}

/** Pure selector to find driver and assigned vehicle from pre-fetched lists */
export function findDriverWithVehicle(
  id: string | null,
  drivers: Driver[],
  vehicles: Vehicle[]
) {
  const driver = drivers.find((d) => d.id === id) ?? drivers[0] ?? null;
  const assignedVehicle = driver ? vehicles.find((v) => v.id === driver.vehicleId) ?? null : null;
  return { driver, assignedVehicle };
}
