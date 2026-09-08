'use client';
import { Gauge, Fuel, Thermometer, ShieldCheck, FastForward, MessageSquare, Phone, CheckCircle } from 'lucide-react';
import type { Trip, Vehicle, Driver } from '@/lib/mockData';

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Vehicle HUD
          </span>
          <span className="badge badge-cyan" style={{ fontSize: 9, padding: '2px 8px' }}>LIVE GPS</span>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: '#60a5fa', marginBottom: 14 }}>
          {vehicle?.vehicleNo || trip.vehicleId}
        </div>

        {/* Overall progress */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Route Progress
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, color: '#22d3ee' }}>
              {trip.progress}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: 7 }}>
            <div className="progress-fill" style={{ width: `${trip.progress}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 10, color: '#34d399', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {distDone} km done
            </span>
            <span style={{ fontSize: 10, color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {distLeft} km left
            </span>
          </div>
        </div>

        {/* 2×2 sensor grid */}
        <div className="telemetry-grid-2x2">
          <div className="telemetry-cell">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="telemetry-cell-label">Speed</span>
              <Gauge size={11} color="#60a5fa" />
            </div>
            <div className="telemetry-cell-value" style={{ color: '#60a5fa' }}>
              {trip.speedKmH || 64}
              <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 2 }}>km/h</span>
            </div>
          </div>

          <div className="telemetry-cell">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="telemetry-cell-label">Fuel</span>
              <Fuel size={11} color="#34d399" />
            </div>
            <div className="telemetry-cell-value" style={{
              color: (trip.fuelPercent || 78) < 30 ? '#fb7185' : '#34d399'
            }}>
              {trip.fuelPercent || 78}%
            </div>
          </div>

          <div className="telemetry-cell">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="telemetry-cell-label">Cargo Temp</span>
              <Thermometer size={11} color="#f59e0b" />
            </div>
            <div className="telemetry-cell-value" style={{ fontSize: 12, color: '#f59e0b' }}>
              {trip.cargoTemp?.replace(' Ambient', '') || '21.5°C'}
            </div>
          </div>

          <div className="telemetry-cell">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="telemetry-cell-label">Geofence</span>
              <ShieldCheck size={11} color="#10b981" />
            </div>
            <div className="telemetry-cell-value" style={{ fontSize: 11, color: '#10b981' }}>
              {trip.geofenceStatus || 'In Corridor'}
            </div>
          </div>
        </div>

        {/* ETA */}
        <div style={{
          background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)',
          borderRadius: 10, padding: '10px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>ETA</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 800, color: '#34d399' }}>{trip.eta}</span>
        </div>
      </div>

      {/* Driver card */}
      {driver && (
        <div className="telemetry-card" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
            Driver
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            {driver.name}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 14 }}>
            {driver.phone}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={onChatDriver}
            >
              <MessageSquare size={13} /> Chat
            </button>
            <a
              href={`tel:${driver.phone}`}
              className="btn btn-ghost btn-sm"
              style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}
            >
              <Phone size={13} color="#34d399" /> Call
            </a>
          </div>
        </div>
      )}

      {/* Simulation control */}
      <div className="telemetry-card" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {trip.progress < 100 ? (
          <>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
              Simulation
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              Fast-forward the journey to simulate real-time transit updates and checkpoint passings.
            </div>
            <button
              className={`btn ${simulating ? 'btn-warning' : 'btn-primary'} w-full`}
              style={{ justifyContent: 'center', width: '100%' }}
              onClick={onStartSimulation}
              disabled={simulating}
            >
              {simulating ? (
                <>
                  <div style={{
                    width: 13, height: 13,
                    border: '2px solid rgba(0,0,0,0.3)',
                    borderTopColor: '#111',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  Simulating Transit…
                </>
              ) : (
                <>
                  <FastForward size={15} />
                  Fast-Forward Journey
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399', marginBottom: 4 }}>
                🎉 Journey Complete
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Ready for delivery confirmation & e-POD
              </div>
            </div>
            <button
              className="btn btn-success"
              style={{ justifyContent: 'center', width: '100%' }}
              onClick={onNavigateDelivery}
            >
              <CheckCircle size={15} />
              Proceed to e-POD
            </button>
          </>
        )}
      </div>
    </>
  );
}
