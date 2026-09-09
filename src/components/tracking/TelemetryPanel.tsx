'use client';
import { Gauge, Fuel, Thermometer, ShieldCheck, FastForward, MessageSquare, CheckCircle, MapPin } from 'lucide-react';
import type { Trip } from '@/features/trips/types';
import type { Vehicle } from '@/features/vehicles/types';
import type { Driver } from '@/features/drivers/types';

interface Props {
  trip: Trip;
  vehicle: Vehicle | null;
  driver: Driver | null;
  distDone: number;
  distLeft: number;
  simulating: boolean;
  onStartSimulation: () => void;
  onChatDriver: () => void;
  onNavigateDelivery: () => void;
}

export default function TelemetryPanel({
  trip, vehicle, driver, distDone, distLeft,
  simulating, onStartSimulation, onChatDriver, onNavigateDelivery
}: Props) {
  return (
    <>
      {/* Live HUD card */}
      <div className="telemetry-card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 1.4 }}>
            Vehicle HUD
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--brand)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span className="badge badge-blue" style={{ fontSize: 9, padding: '1px 7px' }}>LIVE</span>
          </div>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 800, color: 'var(--brand)', marginBottom: 12 }}>
          {vehicle?.vehicleNo || trip.vehicleId}
        </div>

        {/* Route progress */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Route Progress
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 800, color: 'var(--brand)' }}>
              {trip.progress}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: 6 }}>
            <div className="progress-fill" style={{ width: `${trip.progress}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontSize: 10, color: 'var(--brand)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{distDone} km done</span>
            <span style={{ fontSize: 10, color: 'var(--text-low)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{distLeft} km left</span>
          </div>
        </div>

        {/* 2×2 sensor grid */}
        <div className="telemetry-grid-2x2">
          <div className="telemetry-cell">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="telemetry-cell-label">Speed</span>
              <Gauge size={10} color="var(--brand)" />
            </div>
            <div className="telemetry-cell-value" style={{ color: 'var(--brand)' }}>
              {trip.speedKmH || 64}
              <span style={{ fontSize: 9.5, fontWeight: 500, color: 'var(--text-low)', marginLeft: 2 }}>km/h</span>
            </div>
          </div>

          <div className="telemetry-cell">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="telemetry-cell-label">Fuel</span>
              <Fuel size={10} color="var(--brand)" />
            </div>
            <div className="telemetry-cell-value" style={{ color: 'var(--brand)' }}>
              {trip.fuelPercent ?? 85}
              <span style={{ fontSize: 9.5, fontWeight: 500, color: 'var(--text-low)', marginLeft: 1 }}>%</span>
            </div>
          </div>

          <div className="telemetry-cell">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="telemetry-cell-label">Cargo Temp</span>
              <Thermometer size={10} color="var(--brand)" />
            </div>
            <div className="telemetry-cell-value" style={{ color: 'var(--text-high)' }}>
              {trip.cargoTemp || '22°C'}
            </div>
          </div>

          <div className="telemetry-cell">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="telemetry-cell-label">Geofence</span>
              <ShieldCheck size={10} color="var(--brand)" />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, color: trip.geofenceStatus === 'Deviated' ? '#334F99' : 'var(--brand)', marginTop: 2 }}>
              {trip.geofenceStatus || 'In Corridor'}
            </div>
          </div>
        </div>

        {/* Driver info strip */}
        {driver && (
          <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              Driver
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-high)' }}>{driver.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 1 }}>{driver.phone}</div>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {'★'.repeat(Math.floor(driver.rating))}
                <span style={{ fontSize: 10.5, color: 'var(--brand)', fontWeight: 700 }}>{driver.rating}</span>
              </div>
            </div>
          </div>
        )}

        {/* ETA chip */}
        {trip.eta && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px', background: 'var(--brand-10)', border: '1px solid var(--brand-20)', borderRadius: 8 }}>
            <MapPin size={12} color="var(--brand)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)' }}>ETA: {trip.eta}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {trip.status === 'In Transit' && !simulating && trip.progress < 100 && (
          <button
            className="btn btn-primary"
            style={{ justifyContent: 'center' }}
            onClick={onStartSimulation}
          >
            <FastForward size={14} />
            Simulate Transit
          </button>
        )}

        {simulating && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 16px', background: 'var(--brand-10)', border: '1px solid var(--brand-20)', borderRadius: 8 }}>
            <div style={{ width: 12, height: 12, border: '2px solid var(--brand-20)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--brand)' }}>Simulating transit…</span>
          </div>
        )}

        {driver && (
          <button className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={onChatDriver}>
            <MessageSquare size={14} /> Message Driver
          </button>
        )}

        {trip.status === 'Delivered' && (
          <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={onNavigateDelivery}>
            <CheckCircle size={14} /> Record POD
          </button>
        )}
      </div>
    </>
  );
}
