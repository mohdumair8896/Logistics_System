// ─── Vehicles Feature — Public API ───────────────────────────────────────────
// Import from the vehicles feature using this file:
//   import { useVehicles } from '@/features/vehicles'

export type { Vehicle, ActivityLogItem } from './types';
export { useVehicles, useVehicleById } from './hooks';
export { default as VehiclesTable } from './components/VehiclesTable';
export { default as VehicleDossier } from './components/VehicleDossier';
export { default as AddVehicleModal } from './components/AddVehicleModal';
