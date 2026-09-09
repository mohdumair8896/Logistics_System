'use client';
// ─── Drivers Feature — ReassignVehicleModal Component ────────────────────────
// The modal to reassign a vehicle to a driver.
// To change the reassign form → edit ONLY this file.

import { X } from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { useStore } from '@/lib/store';
import type { Driver } from '../types';

interface Props {
  driver: Driver;
  onClose: () => void;
}

export default function ReassignVehicleModal({ driver, onClose }: Props) {
  const { vehicles, reassignDriverVehicle } = useStore();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    reassignDriverVehicle(driver.id, (fd.get('vehicleId') as string) || null);
    onClose();
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
          <div className="modal-title">
            <span>Reassign Vehicle for {driver.name}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer' }}><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Select Available Vehicle</label>
              <select className="form-select" name="vehicleId" defaultValue={driver.vehicleId || ''}>
                <option value="">— Unassign / No Vehicle —</option>
                {vehicles.filter(v => v.status === 'Available' || v.id === driver.vehicleId).map(v => (
                  <option key={v.id} value={v.id}>{v.vehicleNo} ({v.type} - {v.capacity.toLocaleString()} kg)</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirm Assignment</button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
