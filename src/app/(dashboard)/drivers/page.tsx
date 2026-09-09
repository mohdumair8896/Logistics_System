'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import {
  Users, Plus, X, Star, Phone, ShieldCheck, ShieldAlert,
  MessageSquare, Search, RotateCcw
} from 'lucide-react';
import DriverChatModal from '@/components/layout/DriverChatModal';
import { toast } from 'sonner';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { ListStack } from '@/components/ui/ListStack';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { FileUpload } from '@/components/ui/FileUpload';

export default function DriversPage() {
  const { drivers, vehicles, addDriver, reassignDriverVehicle } = useStore();
  const [selected, setSelected] = useState<string | null>(drivers[0]?.id || null);
  const [showAdd, setShowAdd] = useState(false);
  const [reassignModal, setReassignModal] = useState<string | null>(null);
  const [newVehicleSelect, setNewVehicleSelect] = useState<string>('');
  const [chatDriverId, setChatDriverId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    licenseNo: '',
    licenseExpiry: '',
    vehicleId: null as string | null,
    status: 'Available' as const,
    trips: 0,
    rating: 4.8,
    documentVerified: true
  });

  const statusColor: Record<string, string> = {
    'Available': 'badge-green',
    'On Trip': 'badge-blue',
    'Off Duty': 'badge-gray'
  };

  const filteredDrivers = drivers.filter(d =>
    !search ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.phone.includes(search) ||
    d.licenseNo.toLowerCase().includes(search.toLowerCase())
  );

  const selectedDriver = drivers.find(d => d.id === selected) || drivers[0];
  const assignedVehicle = selectedDriver ? vehicles.find(v => v.id === selectedDriver.vehicleId) : null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    // Postel's Law: normalize phone to digits only before saving
    const normalizedForm = { ...form, phone: form.phone.replace(/\D/g, '') };
    addDriver(normalizedForm);
    // Peak-End Rule: positive confirmation at end of flow
    toast.success('Driver Added', { description: `${form.name} has been added to the fleet roster.` });
    setShowAdd(false);
    setForm({ name: '', phone: '', licenseNo: '', licenseExpiry: '', vehicleId: null, status: 'Available', trips: 0, rating: 4.8, documentVerified: true });
  };

  const handleReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;
    reassignDriverVehicle(selectedDriver.id, newVehicleSelect || null);
    setReassignModal(null);
  };

  return (
    <div className="animate-slide-in">
      <div className="page-header">
        <div>
          <div className="page-title">Driver Management & Credentials</div>
          <div className="page-subtitle">Manage your fleet personnel, assign vehicles, and track credentials</div>
          <div style={{ marginTop: 8 }}>
            <AvatarStack
              avatars={drivers.map(d => ({
                id: d.id,
                name: d.name,
                role: d.status,
                status: d.status === 'Available' ? 'online' : d.status === 'On Trip' ? 'busy' : 'offline'
              }))}
              label={`${drivers.filter(d => d.status === 'Available').length} Drivers Standby`}
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Driver
        </button>
      </div>

      {/* Off-duty / license alert */}
      {drivers.filter(d => d.status === 'Off Duty').length > 0 && (
        <AlertBanner variant="info" title={`${drivers.filter(d => d.status === 'Off Duty').length} driver(s) currently off duty`} compact dismissible />
      )}

      <div className="responsive-split-12-1">
        {/* Left Column: Active Drivers Table (Stitch Screen 5) */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-mid)' }}>
              Active Drivers ({drivers.length})
            </div>
            <div style={{ position: 'relative', width: 170 }}>
              <Search size={13} color="var(--text-low)" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 26, fontSize: 11.5, padding: '5px 8px 5px 26px' }}
                placeholder="Search drivers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>Phone</th>
                <th>Vehicle Assigned</th>
                <th>License Expiry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map(d => {
                const veh = vehicles.find(v => v.id === d.vehicleId);
                const isSelected = selectedDriver?.id === d.id;
                return (
                  <tr
                    key={d.id}
                    onClick={() => setSelected(d.id)}
                    style={{ background: isSelected ? 'rgba(59,130,246,0.12)' : '' }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #2a5c9a, var(--brand))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 800 }}>
                          {d.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>{d.name}</span>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>{d.phone}</td>
                    <td>
                      <span className="mono" style={{ fontSize: 12, color: veh ? 'var(--brand)' : 'var(--text-low)' }}>
                        {veh ? veh.vehicleNo : 'Unassigned'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-low)' }}>{d.licenseExpiry}</td>
                    <td><span className={`badge ${statusColor[d.status] || 'badge-gray'}`}>{d.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        {/* Right Column: Driver Profile Dossier (Stitch Screen 5) */}
        <div>
          {selectedDriver ? (
            <div className="card">
              {/* Profile Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #2a5c9a, var(--brand))', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 800 }}>
                  {selectedDriver.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-high)' }}>{selectedDriver.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} fill={i < Math.floor(selectedDriver.rating) ? 'var(--brand)' : 'none'} color={i < Math.floor(selectedDriver.rating) ? 'var(--brand)' : 'var(--border-mid)'} />
                    ))}
                    <span style={{ fontSize: 12, color: 'var(--text-low)', marginLeft: 4 }}>{selectedDriver.rating} Rating</span>
                  </div>
                </div>
                <span className={`badge ${statusColor[selectedDriver.status] || 'badge-gray'}`} style={{ marginLeft: 'auto' }}>
                  {selectedDriver.status}
                </span>
              </div>

              {/* Document Verification Badge (Stitch Screen 5) */}
              <div style={{
                padding: '10px 14px',
                background: selectedDriver.documentVerified ? 'rgba(45, 138, 78, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${selectedDriver.documentVerified ? 'rgba(45, 138, 78, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selectedDriver.documentVerified ? <ShieldCheck size={16} color="var(--brand)" /> : <ShieldAlert size={16} color="var(--brand-dark)" />}
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: selectedDriver.documentVerified ? 'var(--brand)' : 'var(--text-low)' }}>
                    {selectedDriver.documentVerified ? 'DOCUMENT VERIFIED' : 'VERIFICATION PENDING'}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-low)' }}>RTO Verified</span>
              </div>

              {/* Credentials & Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  <span style={{ color: 'var(--text-low)' }}>Contact Phone</span>
                  <span className="mono" style={{ fontWeight: 600, color: 'var(--text-high)' }}>{selectedDriver.phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  <span style={{ color: 'var(--text-low)' }}>Commercial License No.</span>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--brand)' }}>{selectedDriver.licenseNo}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  <span style={{ color: 'var(--text-low)' }}>License Expiry Date</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-high)' }}>{selectedDriver.licenseExpiry}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-low)' }}>Completed Trips</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-high)' }}>{selectedDriver.trips} trips</span>
                </div>
              </div>

              {/* Document Upload Verification — watermelon file-upload pattern */}
              <div className="card" style={{ marginBottom: 16, padding: 14 }}>
                <FileUpload
                  label="Update Commercial License or Medical Certificate"
                  description="Upload scanned DL or fitness cert to update RTO verification"
                  onFileSelect={(f) => console.log('Uploaded driver document:', f.name)}
                />
              </div>

              {/* Current Assignment + Reassign Button (Stitch Screen 5) */}
              <div style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Current Vehicle Assignment
                </div>
                {assignedVehicle ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="mono" style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-high)' }}>
                        {assignedVehicle.vehicleNo}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-low)', marginTop: 2 }}>
                        {assignedVehicle.type} � {assignedVehicle.capacity.toLocaleString()} kg
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setNewVehicleSelect(assignedVehicle.id); setReassignModal(selectedDriver.id); }}
                    >
                      <RotateCcw size={12} /> Reassign Vehicle
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-low)' }}>No vehicle currently assigned</span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => { setNewVehicleSelect(''); setReassignModal(selectedDriver.id); }}
                    >
                      <Plus size={12} /> Assign Vehicle
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setChatDriverId(selectedDriver.id)}
                >
                  <MessageSquare size={14} /> Send Message
                </button>
                <a
                  href={`tel:${selectedDriver.phone}`}
                  className="btn btn-ghost"
                  style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}
                >
                  <Phone size={14} color="var(--icon)" /> Direct Call
                </a>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <Users size={40} color="var(--text-low)" style={{ margin: '0 auto 12px' }} />
              <div style={{ color: 'var(--text-low)', fontSize: 13 }}>Select a driver to view profile</div>
            </div>
          )}
        </div>
      </div>

      {/* Reassign Vehicle Modal (Stitch Screen 5) */}
      {reassignModal && selectedDriver && (
        <div className="modal-overlay" onClick={() => setReassignModal(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <span>Reassign Vehicle for {selectedDriver.name}</span>
              <button onClick={() => setReassignModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleReassign} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Select Available Vehicle</label>
                <select className="form-select" value={newVehicleSelect} onChange={e => setNewVehicleSelect(e.target.value)}>
                  <option value="">� Unassign / No Vehicle �</option>
                  {vehicles.filter(v => v.status === 'Available' || v.id === selectedDriver.vehicleId).map(v => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNo} ({v.type} - {v.capacity.toLocaleString()} kg)
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setReassignModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirm Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Chat Modal */}
      {chatDriverId && (
        <DriverChatModal driverId={chatDriverId} onClose={() => setChatDriverId(null)} />
      )}

      {/* Add Driver Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <span>Add Fleet Personnel & Credentials</span>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Full Legal Name</label>
                <input className="form-input" placeholder="Driver Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input className="form-input" placeholder="+91 9XXXXXXXXX" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Commercial License No.</label>
                  <input className="form-input mono" placeholder="DL-982-XYZ" value={form.licenseNo} onChange={e => setForm({...form, licenseNo: e.target.value})} required />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">License Expiry</label>
                  <input className="form-input" type="date" value={form.licenseExpiry} onChange={e => setForm({...form, licenseExpiry: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Assign Initial Vehicle</label>
                  <select className="form-select" value={form.vehicleId || ''} onChange={e => setForm({...form, vehicleId: e.target.value || null})}>
                    <option value="">� None �</option>
                    {vehicles.filter(v => v.status === 'Available').map(v => (
                      <option key={v.id} value={v.id}>{v.vehicleNo} ({v.type})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Register & Verify Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
