'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import {
  Truck, Plus, X, CheckCircle, AlertTriangle, MessageSquare, Phone,
  Search, Filter, Wrench, Package, ShieldCheck, Gauge, Fuel
} from 'lucide-react';
import DriverChatModal from '@/components/layout/DriverChatModal';

export default function VehiclesPage() {
  const { vehicles, drivers, addVehicle } = useStore();
  const [selected, setSelected] = useState<string | null>(vehicles[0]?.id || null);
  const [showAdd, setShowAdd] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [chatDriverId, setChatDriverId] = useState<string | null>(null);

  const [form, setForm] = useState({
    vehicleNo: '',
    type: 'Heavy Duty Truck',
    capacity: 10000,
    location: 'Lucknow Central Hub',
    lastService: ''
  });

  const statusColor: Record<string, string> = {
    'Available': 'badge-green',
    'In Transit': 'badge-blue',
    'Maintenance': 'badge-red'
  };
  const dotColor: Record<string, string> = {
    'Available': 'dot-green',
    'In Transit': 'dot-blue',
    'Maintenance': 'dot-red'
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesStatus = filterStatus === 'All' || v.status === filterStatus;
    const matchesSearch = !search ||
      v.vehicleNo.toLowerCase().includes(search.toLowerCase()) ||
      v.type.toLowerCase().includes(search.toLowerCase()) ||
      v.location.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const selectedVehicle = vehicles.find(v => v.id === selected) || vehicles[0];
  const assignedDriver = selectedVehicle ? drivers.find(d => d.id === selectedVehicle.driverId) : null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addVehicle({ ...form, currentLoad: 0, status: 'Available', driverId: null });
    setShowAdd(false);
    setForm({ vehicleNo: '', type: 'Heavy Duty Truck', capacity: 10000, location: 'Lucknow Central Hub', lastService: '' });
  };

  return (
    <div className="animate-slide-in">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="page-title">Fleet Roster & Telematics</div>
            <span className="badge badge-blue" style={{ fontSize: 11, fontWeight: 700 }}>
              142 Total Fleet Vehicles
            </span>
          </div>
          <div className="page-subtitle">Real-time asset telemetry, maintenance records & driver pairing</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add New Vehicle
        </button>
      </div>

      <div className="responsive-split-12-1">
        {/* Left Column: Vehicle List Table with Search & Filters (Stitch Screen 4) */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Top Search & Filter Bar */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['All', 'Available', 'In Transit', 'Maintenance'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  style={{
                    fontSize: 11,
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: filterStatus === st ? 'rgba(59,130,246,0.2)' : 'var(--bg-tertiary)',
                    color: filterStatus === st ? '#60a5fa' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: 160 }}>
              <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 26, fontSize: 11.5, padding: '5px 8px 5px 26px' }}
                placeholder="Search fleet..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle No.</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Assigned Driver</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map(v => {
                const drv = drivers.find(d => d.id === v.driverId);
                const isSelected = selectedVehicle?.id === v.id;
                return (
                  <tr
                    key={v.id}
                    onClick={() => setSelected(v.id)}
                    style={{ background: isSelected ? 'rgba(59,130,246,0.12)' : '' }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`status-dot ${dotColor[v.status] || 'dot-gray'}`} />
                        <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 12 }}>
                          {v.vehicleNo}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{v.type.split(' ')[0]}</td>
                    <td><span className="mono" style={{ fontSize: 12 }}>{v.capacity.toLocaleString()} kg</span></td>
                    <td><span className={`badge ${statusColor[v.status] || 'badge-gray'}`}>{v.status}</span></td>
                    <td style={{ fontSize: 12, color: drv ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {drv?.name || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        {/* Right Column: Vehicle Dossier & Activity Log (Stitch Screen 4) */}
        <div>
          {selectedVehicle ? (
            <div className="card">
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.08))', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Truck size={24} color="var(--accent)" />
                  </div>
                  <div>
                    <div className="mono" style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)' }}>
                      {selectedVehicle.vehicleNo}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                      {selectedVehicle.type} • {selectedVehicle.id}
                    </div>
                  </div>
                </div>
                <span className={`badge ${statusColor[selectedVehicle.status] || 'badge-gray'}`} style={{ fontSize: 12 }}>
                  {selectedVehicle.status}
                </span>
              </div>

              {/* Gauges row: Fuel & Odometer */}
              <div className="grid-2" style={{ gap: 10, marginBottom: 16 }}>
                <div className="hud-gauge">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="hud-gauge-label">Fuel Level</span>
                    <Fuel size={13} color="#34d399" />
                  </div>
                  <div className="hud-gauge-value" style={{ color: '#34d399' }}>{selectedVehicle.fuelLevel || 88}%</div>
                </div>
                <div className="hud-gauge">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="hud-gauge-label">Odometer</span>
                    <Gauge size={13} color="#60a5fa" />
                  </div>
                  <div className="hud-gauge-value">{selectedVehicle.odometerKm?.toLocaleString() || '48,250'} km</div>
                </div>
              </div>

              {/* Specs List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Rated Payload Capacity</span>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedVehicle.capacity.toLocaleString()} kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Current Assigned Load</span>
                  <span className="mono" style={{ fontWeight: 700, color: selectedVehicle.currentLoad > 0 ? '#38bdf8' : 'var(--text-muted)' }}>
                    {selectedVehicle.currentLoad.toLocaleString()} kg
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Stationed Hub Location</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedVehicle.location}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Last Service Inspection</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{selectedVehicle.lastService || '2026-08-15'}</span>
                </div>
              </div>

              {/* Load Capacity Bar */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Capacity Utilization</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {Math.round((selectedVehicle.currentLoad / selectedVehicle.capacity) * 100)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(selectedVehicle.currentLoad / selectedVehicle.capacity) * 100}%` }} />
                </div>
              </div>

              {/* Assigned Driver Card with Direct Chat Modal Trigger */}
              <div style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 10, marginBottom: 16, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Assigned Fleet Driver
                </div>
                {assignedDriver ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #F59E0B, #D97706)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1C1917', fontWeight: 800, fontSize: 12 }}>
                        {assignedDriver.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{assignedDriver.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{assignedDriver.phone}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setChatDriverId(assignedDriver.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 10px' }}
                        title="Chat with Driver"
                      >
                        <MessageSquare size={13} color="#60a5fa" />
                      </button>
                      <a href={`tel:${assignedDriver.phone}`} className="btn btn-secondary btn-sm" style={{ padding: '6px 10px' }} title="Call Driver">
                        <Phone size={13} color="#34d399" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No driver currently assigned to this vehicle</div>
                )}
              </div>

              {/* Recent Activity Log (Stitch Screen 4) */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Recent Vehicle Activity Log
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(selectedVehicle.activityLog || [
                    { id: 'ACT-1', title: 'Maintenance Completed (Full Service)', timestamp: 'Aug 24, 09:00 AM', type: 'maintenance' },
                    { id: 'ACT-2', title: 'Delivery Logged: ORD-992', timestamp: 'Aug 22, 14:30 PM', type: 'delivery' },
                    { id: 'ACT-3', title: 'Tire Pressure & Brake Check Passed', timestamp: 'Aug 15, 11:15 AM', type: 'inspection' }
                  ]).map(act => (
                    <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, padding: '8px 10px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                      {act.type === 'maintenance' ? <Wrench size={14} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} /> :
                       act.type === 'delivery' ? <Package size={14} color="#3b82f6" style={{ marginTop: 2, flexShrink: 0 }} /> :
                       <ShieldCheck size={14} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{act.title}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>{act.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <Truck size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Select a vehicle to inspect telemetry</div>
            </div>
          )}
        </div>
      </div>

      {/* Driver Chat Modal */}
      {chatDriverId && (
        <DriverChatModal driverId={chatDriverId} onClose={() => setChatDriverId(null)} />
      )}

      {/* Add Vehicle Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <span>Add Vehicle to Fleet Roster</span>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Vehicle Registration Number</label>
                <input className="form-input mono" placeholder="UP32 XX 1234" value={form.vehicleNo} onChange={e => setForm({...form, vehicleNo: e.target.value})} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option>Heavy Duty Truck</option>
                    <option>Medium Truck</option>
                    <option>Multi-Axle Trailer</option>
                    <option>Light Commercial Vehicle</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity (kg)</label>
                  <input className="form-input" type="number" value={form.capacity} onChange={e => setForm({...form, capacity: +e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Base Hub Location</label>
                <input className="form-input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Register Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
