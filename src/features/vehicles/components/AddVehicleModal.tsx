'use client';
// ─── Vehicles Feature — AddVehicleModal Component ─────────────────────────────
// The "Add New Vehicle" modal form.
// To change the add vehicle form → edit ONLY this file.

import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { useVehicles } from '@/features/vehicles/hooks';


interface Props {
  onClose: () => void;
}

export default function AddVehicleModal({ onClose }: Props) {
  const { addVehicle } = useVehicles();
  const [form, setForm] = useState({
    vehicleNo: '',
    type: 'Heavy Duty Truck',
    capacity: 10000,
    location: 'Central Distribution Hub',
    lastService: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addVehicle({ ...form, currentLoad: 0, status: 'Available', driverId: null });
    toast.success('Vehicle Registered', { description: `${form.vehicleNo} has been added to the fleet.` });
    onClose();
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-title">
            <span>Add Vehicle to Fleet Roster</span>
            <button type="button" onClick={onClose} className="modal-close-btn" aria-label="Close modal">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Vehicle Registration Number</label>
              <input className="form-input mono" placeholder="UP32 XX 1234" value={form.vehicleNo} onChange={e => setForm({ ...form, vehicleNo: e.target.value })} required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option>Heavy Duty Truck</option>
                  <option>Medium Truck</option>
                  <option>Multi-Axle Trailer</option>
                  <option>Light Commercial Vehicle</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Capacity (kg)</label>
                <input className="form-input" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: +e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Base Hub Location</label>
              <input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Register Vehicle</button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
