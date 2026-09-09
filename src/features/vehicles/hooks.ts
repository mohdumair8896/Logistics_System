// ─── Vehicles Feature — Hooks ─────────────────────────────────────────────────
// All vehicle-related custom hooks live here.
// Change vehicle state selectors/filters → only edit this file.

import { useStore } from '@/lib/store';

export function useVehicles() {
  const { vehicles, drivers, addVehicle, updateVehicle } = useStore();
  return { vehicles, drivers, addVehicle, updateVehicle };
}

export function useVehicleById(id: string | null) {
  const vehicles = useStore(s => s.vehicles);
  const drivers = useStore(s => s.drivers);
  const vehicle = vehicles.find(v => v.id === id) ?? vehicles[0];
  const assignedDriver = vehicle ? drivers.find(d => d.id === vehicle.driverId) ?? null : null;
  return { vehicle, assignedDriver };
}
