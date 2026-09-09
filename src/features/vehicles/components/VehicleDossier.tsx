'use client';
// ─── Vehicles Feature — VehicleDossier Component ─────────────────────────────
// The vehicle detail panel (right side). Shows specs, fuel, odometer, activity.
// To change the vehicle detail UI → edit ONLY this file.

import { Truck, Fuel, Gauge, Wrench, Package, ShieldCheck, MessageSquare, Phone } from 'lucide-react';
import { getStatusBadgeClass } from '@/lib/formatters';
import { LabeledProgress } from '@/components/ui/LabeledProgress';
import type { Vehicle } from '../types';
import type { Driver } from '@/features/drivers/types';

interface Props {
  vehicle: Vehicle;
  assignedDriver: Driver | null;
  onChatDriver: (driverId: string) => void;
}

export default function VehicleDossier({ vehicle, assignedDriver, onChatDriver }: Props) {
  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg, #2a5c9a, #1a2b3c)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={24} color="var(--brand)" />
          </div>
          <div>
            <div className="mono" style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-high)' }}>{vehicle.vehicleNo}</div>
            <div style={{ fontSize: 12, color: 'var(--text-low)', marginTop: 1 }}>{vehicle.type} · {vehicle.id}</div>
          </div>
        </div>
        <span className={`badge ${getStatusBadgeClass(vehicle.status)}`} style={{ fontSize: 12 }}>{vehicle.status}</span>
      </div>

      {/* Fuel & Odometer gauges */}
      <div className="grid-2" style={{ gap: 10, marginBottom: 16 }}>
        <div className="hud-gauge">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="hud-gauge-label">Fuel Level</span>
            <Fuel size={13} color="var(--brand)" />
          </div>
          <div className="hud-gauge-value" style={{ color: 'var(--brand)' }}>{vehicle.fuelLevel ?? 88}%</div>
        </div>
        <div className="hud-gauge">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="hud-gauge-label">Odometer</span>
            <Gauge size={13} color="var(--brand)" />
          </div>
          <div className="hud-gauge-value">{vehicle.odometerKm?.toLocaleString() ?? '48,250'} km</div>
        </div>
      </div>

      {/* Specs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, marginBottom: 16 }}>
        {[
          ['Rated Payload Capacity', `${vehicle.capacity.toLocaleString()} kg`, true],
          ['Current Assigned Load', `${vehicle.currentLoad.toLocaleString()} kg`, true],
          ['Stationed Hub Location', vehicle.location, false],
          ['Last Service Inspection', vehicle.lastService || '2026-08-15', false],
        ].map(([label, value, mono], i, arr) => (
          <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: i < arr.length - 1 ? 6 : 0 }}>
            <span style={{ color: 'var(--text-low)' }}>{label}</span>
            <span className={mono ? 'mono' : ''} style={{ fontWeight: 600, color: 'var(--text-high)' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Load bar */}
      <div style={{ marginBottom: 16 }}>
        <LabeledProgress
          progress={Math.round((vehicle.currentLoad / vehicle.capacity) * 100)}
          labels={[
            `Capacity: ${vehicle.currentLoad.toLocaleString()} / ${vehicle.capacity.toLocaleString()} kg`,
            `${Math.round((vehicle.currentLoad / vehicle.capacity) * 100)}% utilized`,
          ]}
          height={8}
          intervalMs={3000}
        />
      </div>

      {/* Assigned driver card */}
      <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 10, marginBottom: 16, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
          Assigned Fleet Driver
        </div>
        {assignedDriver ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #2a5c9a, var(--brand))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 12 }}>
                {assignedDriver.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-high)' }}>{assignedDriver.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{assignedDriver.phone}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => onChatDriver(assignedDriver.id)} className="btn btn-secondary btn-sm" style={{ padding: '6px 10px' }} title="Chat with Driver">
                <MessageSquare size={13} color="var(--icon)" />
              </button>
              <a href={`tel:${assignedDriver.phone}`} className="btn btn-secondary btn-sm" style={{ padding: '6px 10px' }} title="Call Driver">
                <Phone size={13} color="var(--icon)" />
              </a>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-low)' }}>No driver currently assigned to this vehicle</div>
        )}
      </div>

      {/* Activity log */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
          Recent Vehicle Activity Log
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(vehicle.activityLog || [
            { id: 'ACT-1', title: 'Maintenance Completed (Full Service)', timestamp: 'Aug 24, 09:00 AM', type: 'maintenance' as const },
            { id: 'ACT-2', title: 'Delivery Logged: ORD-992', timestamp: 'Aug 22, 14:30 PM', type: 'delivery' as const },
          ]).map(act => (
            <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 8 }}>
              {act.type === 'maintenance' ? <Wrench size={14} color="var(--icon)" style={{ marginTop: 2, flexShrink: 0 }} /> :
               act.type === 'delivery' ? <Package size={14} color="var(--brand)" style={{ marginTop: 2, flexShrink: 0 }} /> :
               <ShieldCheck size={14} color="var(--brand)" style={{ marginTop: 2, flexShrink: 0 }} />}
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-high)', fontWeight: 600 }}>{act.title}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-low)', marginTop: 2 }}>{act.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
