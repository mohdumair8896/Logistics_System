'use client';
// ─── Drivers Feature — DriversTable Component ─────────────────────────────────
// The driver list table with search.
// To change the driver table UI → edit ONLY this file.

import { useState } from 'react';
import { Search } from 'lucide-react';
import type { Driver } from '../types';
import type { Vehicle } from '@/features/vehicles/types';

interface Props {
  drivers: Driver[];
  vehicles: Vehicle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
  'Available': 'badge-green',
  'On Trip': 'badge-blue',
  'Off Duty': 'badge-gray'
};

export default function DriversTable({ drivers, vehicles, selectedId, onSelect }: Props) {
  const [search, setSearch] = useState('');

  const filtered = drivers.filter(d =>
    !search ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.phone.includes(search) ||
    d.licenseNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-mid)' }}>Active Drivers ({drivers.length})</div>
        <div style={{ position: 'relative', width: 170 }}>
          <Search size={13} color="var(--text-low)" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="form-input" style={{ paddingLeft: 26, fontSize: 11.5, padding: '5px 8px 5px 26px' }} placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)} />
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
            {filtered.map(d => {
              const veh = vehicles.find(v => v.id === d.vehicleId);
              return (
                <tr key={d.id} onClick={() => onSelect(d.id)} style={{ background: selectedId === d.id ? 'rgba(59,130,246,0.12)' : '', cursor: 'pointer' }}>
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
                  <td><span className={`badge ${STATUS_COLOR[d.status] || 'badge-gray'}`}>{d.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
