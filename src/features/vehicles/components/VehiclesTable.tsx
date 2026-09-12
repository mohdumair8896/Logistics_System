'use client';
// ─── Vehicles Feature — VehiclesTable Component ───────────────────────────────
// The vehicle list table with search & filter.
// To change the vehicle table UI → edit ONLY this file.

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { BadgeWithDot } from '@/components/ui/BadgeWithDot';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/HoverCard';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/Empty';
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
                background: filterStatus === st ? 'var(--brand-10, rgba(0,87,255,0.08))' : 'var(--surface-2)',
                border: filterStatus === st ? '1px solid var(--brand-20, rgba(0,87,255,0.2))' : '1px solid var(--border)',
                color: filterStatus === st ? 'var(--brand)' : 'var(--text-mid)',
                fontWeight: 600, cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}
        </div>
        <div className="input-group input-group-sm" style={{ width: 180 }}>
          <Search size={13} />
          <input
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '36px 16px' }}>
                  <Empty className="border-none bg-transparent">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" />
                      <EmptyTitle>No vehicles found</EmptyTitle>
                      <EmptyDescription>
                        No fleet vehicles match the active filter or search query.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </td>
              </tr>
            ) : (
              filtered.map(v => {
                const drv = drivers.find(d => d.id === v.driverId);
                return (
                  <tr
                    key={v.id}
                    onClick={() => onSelect(v.id)}
                    style={{ background: selectedId === v.id ? 'var(--brand-10, rgba(0,87,255,0.08))' : '', cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`status-dot ${DOT_COLOR[v.status] || 'dot-gray'}`} />
                        <span className="mono" style={{ color: 'var(--text-high)', fontWeight: 700, fontSize: 12 }}>
                          {v.vehicleNo}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{v.type ? v.type.split(' ')[0] : 'Truck'}</td>
                    <td><span className="mono" style={{ fontSize: 12 }}>{(v.capacity ?? 0).toLocaleString()} kg</span></td>
                    <td>
                      <BadgeWithDot
                        color={
                          v.status === 'Available' ? 'success' :
                          v.status === 'In Transit' ? 'brand' : 'error'
                        }
                        size="sm"
                        pulse={v.status === 'In Transit'}
                      >
                        {v.status}
                      </BadgeWithDot>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {drv ? (
                        <HoverCard>
                          <HoverCardTrigger>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <Avatar
                                name={drv.name}
                                size="xs"
                                status={
                                  drv.status === 'Available' ? 'online' :
                                  drv.status === 'On Trip' ? 'busy' : 'offline'
                                }
                              />
                              <span style={{ color: 'var(--text-high)', fontWeight: 500, textDecoration: 'underline decoration-dotted underline-offset-2' }}>
                                {drv.name}
                              </span>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-60">
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar name={drv.name} size="sm" status={drv.status === 'Available' ? 'online' : 'busy'} />
                              <div>
                                <div className="font-bold text-xs text-[var(--text-high)]">{drv.name}</div>
                                <div className="text-[10px] text-[var(--text-low)]">{drv.licenseNo || 'Commercial HMV'}</div>
                              </div>
                            </div>
                            <div className="text-[11px] text-[var(--text-mid)] space-y-1">
                              <div>Phone: {drv.phone || '+91 98765 43210'}</div>
                              <div>Completed Trips: {drv.trips ?? 0}</div>
                              <div>Safety Rating: ★ {drv.rating ?? 4.9}</div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      ) : (
                        <span style={{ color: 'var(--text-low)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
