'use client';
// ─── Vehicles Page ────────────────────────────────────────────────────────────
// This page is intentionally thin (~50 lines).
// All UI components → src/features/vehicles/components/
// All state logic  → src/features/vehicles/hooks.ts
// All types        → src/features/vehicles/types.ts
// All data         → src/features/vehicles/data.ts

import { useState } from 'react';
import { Plus, Truck } from 'lucide-react';
import { AlertBanner } from '@/components/ui/AlertBanner';
import DriverChatModal from '@/components/layout/DriverChatModal';

import { useVehicles, findVehicleWithDriver } from '@/features/vehicles/hooks';
import { useDrivers } from '@/features/drivers/hooks';
import VehiclesTable from '@/features/vehicles/components/VehiclesTable';
import VehicleDossier from '@/features/vehicles/components/VehicleDossier';
import AddVehicleModal from '@/features/vehicles/components/AddVehicleModal';

export default function VehiclesPage() {
  const { vehicles } = useVehicles();
  const { drivers } = useDrivers();
  const [selectedId, setSelectedId] = useState<string | null>(vehicles[0]?.id ?? null);
  const [showAdd, setShowAdd] = useState(false);
  const [chatDriverId, setChatDriverId] = useState<string | null>(null);

  const { vehicle: selectedVehicle, assignedDriver } = findVehicleWithDriver(selectedId, vehicles, drivers);

  return (
    <div className="animate-slide-in">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="page-title">Fleet Roster &amp; Telematics</div>
            <span className="badge badge-blue" style={{ fontSize: 11, fontWeight: 700 }}>142 Total Fleet Vehicles</span>
          </div>
          <div className="page-subtitle">Real-time asset telemetry, maintenance records &amp; driver pairing</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add New Vehicle
        </button>
      </div>

      {vehicles.filter(v => v.status === 'Maintenance').length > 0 && (
        <AlertBanner variant="warning" title={`${vehicles.filter(v => v.status === 'Maintenance').length} vehicle(s) currently in maintenance`} dismissible>
          Schedule service completion checks and reassign drivers to available units.
        </AlertBanner>
      )}

      <div className="responsive-split-12-1">
        <VehiclesTable vehicles={vehicles} drivers={drivers} selectedId={selectedId} onSelect={setSelectedId} />

        <div>
          {selectedVehicle ? (
            <VehicleDossier vehicle={selectedVehicle} assignedDriver={assignedDriver} onChatDriver={setChatDriverId} />
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <Truck size={40} color="var(--text-low)" style={{ margin: '0 auto 12px' }} />
              <div style={{ color: 'var(--text-low)', fontSize: 13 }}>Select a vehicle to inspect telemetry</div>
            </div>
          )}
        </div>
      </div>

      {chatDriverId && <DriverChatModal driverId={chatDriverId} onClose={() => setChatDriverId(null)} />}
      {showAdd && <AddVehicleModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}