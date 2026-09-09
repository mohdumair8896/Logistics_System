'use client';
// ─── Drivers Feature — AddDriverModal Component ───────────────────────────────
// The "Add Driver" modal form.
// To change the add driver form → edit ONLY this file.

import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { useStore } from '@/lib/store';

interface Props {
  onClose: () => void;
}

export default function AddDriverModal({ onClose }: Props) {
  const { addDriver, vehicles } = useStore();
  const [form, setForm] = useState({
    name: '', phone: '', licenseNo: '', licenseExpiry: '',
    vehicleId: null as string | null,
    status: 'Available' as const,
    trips: 0, rating: 4.8, documentVerified: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDriver({ ...form, phone: form.phone.replace(/\D/g, '') });
    toast.success('Driver Added', { description: `${form.name} has been added to the fleet roster.` });
    onClose();
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-title">
            <span>Add Fleet Personnel &amp; Credentials</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Full Legal Name</label>
              <input className="form-input" placeholder="Driver Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input className="form-input" placeholder="+91 9XXXXXXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Commercial License No.</label>
                <input className="form-input mono" placeholder="DL-982-XYZ" value={form.licenseNo} onChange={e => setForm({ ...form, licenseNo: e.target.value })} required />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">License Expiry</label>
                <input className="form-input" type="date" value={form.licenseExpiry} onChange={e => setForm({ ...form, licenseExpiry: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Assign Initial Vehicle</label>
                <select className="form-select" value={form.vehicleId || ''} onChange={e => setForm({ ...form, vehicleId: e.target.value || null })}>
                  <option value="">— None —</option>
                  {vehicles.filter(v => v.status === 'Available').map(v => (
                    <option key={v.id} value={v.id}>{v.vehicleNo} ({v.type})</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Register &amp; Verify Driver</button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
