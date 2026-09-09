'use client';
import { Navigation, CheckCircle } from 'lucide-react';
import type { Trip } from '@/features/trips/types';
import type { Vehicle } from '@/features/vehicles/types';
import type { Driver } from '@/features/drivers/types';

interface Props {
  trip: Trip;
  vehicle: Vehicle | null;
  driver: Driver | null;
}

export default function DispatchStage({ trip, vehicle, driver }: Props) {
  return (
    <div className="journey-stage">
      <div className="journey-node journey-node-completed">
        <CheckCircle size={20} />
        <span className="journey-node-label">Dispatch</span>
      </div>

      <div className="journey-card journey-card-completed">
        <div className="journey-stage-header">
          <div>
            <div className="journey-stage-kicker">Stage 05 — Dispatched from Hub</div>
            <div className="journey-stage-id">{trip.id}</div>
          </div>
          <span className="badge badge-cyan" style={{ fontSize: 10 }}>In Transit</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="journey-data-grid">
            <div className="journey-data-item">
              <span className="journey-data-label">Departed</span>
              <span className="journey-data-value">{trip.startedAt}</span>
            </div>
            <div className="journey-data-item">
              <span className="journey-data-label">Distance</span>
              <span className="journey-data-value">{trip.distance} km</span>
            </div>
            <div className="journey-data-item">
              <span className="journey-data-label">Vehicle</span>
              <span className="journey-data-value-mono">{vehicle?.vehicleNo || trip.vehicleId}</span>
            </div>
            <div className="journey-data-item">
              <span className="journey-data-label">Driver</span>
              <span className="journey-data-value">{driver?.name || trip.driverId}</span>
            </div>
          </div>

          {/* Route banner */}
          <div style={{
            background: 'rgba(2,6,23,0.6)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 16
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>From</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--brand)' }}>{trip.origin}</div>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(52,211,153,0.5), rgba(34,211,238,0.5))' }} />
              <Navigation size={16} color="var(--brand)" />
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(34,211,238,0.5), rgba(96,165,250,0.5))' }} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>To</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--brand)' }}>{trip.destination}</div>
            </div>
          </div>

          <div className="journey-data-grid">
            <div className="journey-data-item">
              <span className="journey-data-label">Load</span>
              <span className="journey-data-value">{trip.load.toLocaleString()} kg</span>
            </div>
            <div className="journey-data-item">
              <span className="journey-data-label">ETA</span>
              <span className="journey-data-value" style={{ color: 'var(--brand)' }}>{trip.eta}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
