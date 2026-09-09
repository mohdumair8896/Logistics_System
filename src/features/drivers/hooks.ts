// ─── Drivers Feature — Hooks ──────────────────────────────────────────────────
// All driver-related custom hooks live here.
// Change driver state selectors/filters → only edit this file.

import { useStore } from '@/lib/store';

export function useDrivers() {
  const { drivers, vehicles, addDriver, updateDriver, reassignDriverVehicle } = useStore();
  return { drivers, vehicles, addDriver, updateDriver, reassignDriverVehicle };
}

export function useDriverById(id: string | null) {
  const drivers = useStore(s => s.drivers);
  const vehicles = useStore(s => s.vehicles);
  const driver = drivers.find(d => d.id === id) ?? drivers[0];
  const assignedVehicle = driver ? vehicles.find(v => v.id === driver.vehicleId) ?? null : null;
  return { driver, assignedVehicle };
}
