'use client';
// ─── Vehicles Feature — VehiclesTable Component ───────────────────────────────
// The vehicle list table with search & filter.
// To change the vehicle table UI → edit ONLY this file.

import { useState } from 'react';
import { Search } from 'lucide-react';
import { getStatusBadgeClass } from '@/lib/formatters';
import type { Vehicle } from '../types';
import type { Driver } from '@/features/drivers/types';

interface Props {
  vehicles: Vehicle[];
  drivers: Driver[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const DOT_COLOR: Record<string, string> = {
  'Available': 'dot-green',
  'In Transit': 'dot-blue',
  'Maintenance': 'dot-red'
};

export default function VehiclesTable({ vehicles, drivers, selectedId, onSelect }: Props) {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [search, setSearch] = useState('');

  const filtered = vehicles.filter(v => {
    const matchesStatus = filterStatus === 'All' || v.status === filterStatus;
    const matchesSearch = !search ||
      v.vehicleNo.toLowerCase().includes(search.toLowerCase()) ||
      v.type.toLowerCase().includes(search.toLowerCase()) ||
      v.location.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['All', 'Available', 'In Transit', 'Maintenance'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                fontSize: 11, padding: '4px 8px', borderRadius: 6,
                border: '1px solid var(--border)',
                background: filterStatus === st ? 'rgba(59,130,246,0.2)' : 'var(--surface-2)',
                color: filterStatus === st ? 'var(--brand)' : 'var(--text-mid)',
                fontWeight: 600, cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', width: 160 }}>
          <Search size={13} color="var(--text-low)" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
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
            {filtered.map(v => {
              const drv = drivers.find(d => d.id === v.driverId);
              return (
                <tr
                  key={v.id}
                  onClick={() => onSelect(v.id)}
                  style={{ background: selectedId === v.id ? 'rgba(59,130,246,0.12)' : '', cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`status-dot ${DOT_COLOR[v.status] || 'dot-gray'}`} />
                      <span className="mono" style={{ color: 'var(--text-high)', fontWeight: 700, fontSize: 12 }}>
                        {v.vehicleNo}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>{v.type.split(' ')[0]}</td>
                  <td><span className="mono" style={{ fontSize: 12 }}>{v.capacity.toLocaleString()} kg</span></td>
                  <td><span className={`badge ${getStatusBadgeClass(v.status)}`}>{v.status}</span></td>
                  <td style={{ fontSize: 12, color: drv ? 'var(--text-high)' : 'var(--text-low)' }}>
                    {drv?.name || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
