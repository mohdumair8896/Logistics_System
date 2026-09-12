'use client';
// ─── Drivers Feature — DriversTable Component ─────────────────────────────────
// The driver list table with search.
// To change the driver table UI → edit ONLY this file.

import { useState } from 'react';
import { Search, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { BadgeWithDot } from '@/components/ui/BadgeWithDot';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/HoverCard';
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/Empty';
import type { Driver } from '../types';
import type { Vehicle } from '@/features/vehicles/types';

interface Props {
  drivers: Driver[];
  vehicles: Vehicle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

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
        <div className="input-group input-group-sm" style={{ width: 180 }}>
          <Search size={13} />
          <input placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '36px 16px' }}>
          <Empty>
            <EmptyMedia>
              <Users size={32} color="var(--text-low)" />
            </EmptyMedia>
            <EmptyTitle>No drivers found</EmptyTitle>
            <EmptyDescription>No fleet operators match &quot;{search}&quot;</EmptyDescription>
          </Empty>
        </div>
      ) : (
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
                  <tr key={d.id} onClick={() => onSelect(d.id)} style={{ background: selectedId === d.id ? 'var(--brand-10, rgba(0,87,255,0.08))' : '', cursor: 'pointer' }}>
                    <td>
                      <HoverCard openDelay={150}>
                        <HoverCardTrigger render={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                            <Avatar
                              name={d.name}
                              size="sm"
                              status={d.status === 'Available' ? 'online' : d.status === 'On Trip' ? 'busy' : 'offline'}
                            />
                            <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>{d.name}</span>
                          </div>
                        } />
                        <HoverCardContent className="w-64">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar name={d.name} size="sm" status={d.status === 'Available' ? 'online' : 'busy'} />
                            <div>
                              <div className="font-bold text-xs text-[var(--text-high)]">{d.name}</div>
                              <div className="text-[10px] text-[var(--text-low)]">{d.licenseNo || 'Commercial HMV'}</div>
                            </div>
                          </div>
                          <div className="text-[11px] text-[var(--text-mid)] space-y-1">
                            <div>Phone: {d.phone || '+91 98765 43210'}</div>
                            <div>Completed Trips: {d.trips ?? 0}</div>
                            <div>Safety Rating: ★ {d.rating ?? 4.9}</div>
                            <div>Vehicle: {veh ? veh.vehicleNo : 'Unassigned'}</div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>{d.phone}</td>
                    <td>
                      <span className="mono" style={{ fontSize: 12, color: veh ? 'var(--brand)' : 'var(--text-low)' }}>
                        {veh ? veh.vehicleNo : 'Unassigned'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-low)' }}>{d.licenseExpiry}</td>
                    <td>
                      <BadgeWithDot
                        color={d.status === 'Available' ? 'success' : d.status === 'On Trip' ? 'brand' : 'gray'}
                        size="sm"
                        pulse={d.status === 'On Trip'}
                      >
                        {d.status}
                      </BadgeWithDot>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
