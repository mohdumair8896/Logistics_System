'use client';
// ─── Drivers Page ─────────────────────────────────────────────────────────────
// This page is intentionally thin (~55 lines).
// All UI components → src/features/drivers/components/
// All state logic  → src/features/drivers/hooks.ts
// All types        → src/features/drivers/types.ts
// All data         → src/features/drivers/data.ts

import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AvatarStack } from '@/components/ui/AvatarStack';
import DriverChatModal from '@/components/layout/DriverChatModal';

import { useDrivers, findDriverWithVehicle } from '@/features/drivers/hooks';
import { useVehicles } from '@/features/vehicles/hooks';
import DriversTable from '@/features/drivers/components/DriversTable';
import DriverDossier from '@/features/drivers/components/DriverDossier';
import AddDriverModal from '@/features/drivers/components/AddDriverModal';
import ReassignVehicleModal from '@/features/drivers/components/ReassignVehicleModal';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/Breadcrumb';

export default function DriversPage() {
  const { drivers } = useDrivers();
  const { vehicles } = useVehicles();
  const [selectedId, setSelectedId] = useState<string | null>(drivers[0]?.id ?? null);
  const [showAdd, setShowAdd] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [chatDriverId, setChatDriverId] = useState<string | null>(null);

  const { driver: selectedDriver, assignedVehicle } = findDriverWithVehicle(selectedId, drivers, vehicles);

  return (
    <div className="animate-slide-in">
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/drivers">Fleet &amp; Roster</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Drivers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="page-header">
        <div>
          <div className="page-title">Driver Management &amp; Credentials</div>
          <div className="page-subtitle">Manage your fleet personnel, assign vehicles, and track credentials</div>
          <div style={{ marginTop: 8 }}>
            <AvatarStack
              avatars={drivers.map(d => ({ id: d.id, name: d.name, role: d.status, status: d.status === 'Available' ? 'online' : d.status === 'On Trip' ? 'busy' : 'offline' }))}
              label={`${drivers.filter(d => d.status === 'Available').length} Drivers Standby`}
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Driver
        </button>
      </div>

      {drivers.filter(d => d.status === 'Off Duty').length > 0 && (
        <AlertBanner variant="info" title={`${drivers.filter(d => d.status === 'Off Duty').length} driver(s) currently off duty`} compact dismissible />
      )}

      <div className="responsive-split-12-1">
        <DriversTable drivers={drivers} vehicles={vehicles} selectedId={selectedId} onSelect={setSelectedId} />
        <div>
          {selectedDriver ? (
            <DriverDossier
              driver={selectedDriver}
              assignedVehicle={assignedVehicle}
              onChat={() => setChatDriverId(selectedDriver.id)}
              onReassign={() => setShowReassign(true)}
            />
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <Users size={40} color="var(--text-low)" style={{ margin: '0 auto 12px' }} />
              <div style={{ color: 'var(--text-low)', fontSize: 13 }}>Select a driver to view profile</div>
            </div>
          )}
        </div>
      </div>

      {chatDriverId && <DriverChatModal driverId={chatDriverId} onClose={() => setChatDriverId(null)} />}
      {showAdd && <AddDriverModal onClose={() => setShowAdd(false)} />}
      {showReassign && selectedDriver && <ReassignVehicleModal driver={selectedDriver} onClose={() => setShowReassign(false)} />}
    </div>
  );
}
