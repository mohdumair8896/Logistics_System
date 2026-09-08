'use client';
import { CheckCircle, Truck } from 'lucide-react';
import type { Vehicle, Order } from '@/lib/mockData';

interface Props {
  vehicle: Vehicle | null;
  order: Order | null;
}

export default function AllocationStage({ vehicle, order }: Props) {
  const nodeState = vehicle ? 'completed' : 'upcoming';
  const utilization = vehicle && order ? Math.round((order.totalWeight / vehicle.capacity) * 100) : 0;

  return (
    <div className="journey-stage">
      <div className={`journey-node journey-node-${nodeState}`}>
        {vehicle ? <CheckCircle size={20} /> : <Truck size={18} />}
        <span className="journey-node-label">Vehicle</span>
      </div>

      <div className={`journey-card journey-card-${nodeState}`}>
        <div className="journey-stage-header">
          <div>
            <div className="journey-stage-kicker">Stage 02 — Vehicle Allocated</div>
            <div className="journey-stage-id" style={{ color: '#60a5fa' }}>
              {vehicle?.vehicleNo || '—'}
            </div>
          </div>
          {vehicle && (
            <span className={`badge badge-${vehicle.status === 'Available' ? 'green' : vehicle.status === 'Maintenance' ? 'red' : 'cyan'}`} style={{ fontSize: 10 }}>
              {vehicle.status}
            </span>
          )}
        </div>

        {vehicle ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="journey-data-grid">
              <div className="journey-data-item">
                <span className="journey-data-label">Vehicle Type</span>
                <span className="journey-data-value">{vehicle.type}</span>
              </div>
              <div className="journey-data-item">
                <span className="journey-data-label">Max Capacity</span>
                <span className="journey-data-value">{vehicle.capacity.toLocaleString()} kg</span>
              </div>
              <div className="journey-data-item">
                <span className="journey-data-label">Current Load</span>
                <span className="journey-data-value">{(order?.totalWeight || vehicle.currentLoad).toLocaleString()} kg</span>
              </div>
              <div className="journey-data-item">
                <span className="journey-data-label">Free Capacity</span>
                <span className="journey-data-value">
                  {(vehicle.capacity - (order?.totalWeight || vehicle.currentLoad)).toLocaleString()} kg
                </span>
              </div>
            </div>

            {/* Utilization bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Load Utilization
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-mono)', color: utilization > 85 ? '#fb7185' : utilization > 60 ? '#f59e0b' : '#34d399' }}>
                  {utilization}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${utilization}%`,
                    background: utilization > 85
                      ? 'linear-gradient(90deg, #fb7185, #f43f5e)'
                      : utilization > 60
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        : 'linear-gradient(90deg, #34d399, #10b981)'
                  }}
                />
              </div>
            </div>

            <div className="journey-data-grid">
              <div className="journey-data-item">
                <span className="journey-data-label">Vehicle ID</span>
                <span className="journey-data-value-mono">{vehicle.id}</span>
              </div>
              <div className="journey-data-item">
                <span className="journey-data-label">Odometer</span>
                <span className="journey-data-value">{(vehicle.odometerKm ?? 0).toLocaleString()} km</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No vehicle allocated yet.</div>
        )}
      </div>
    </div>
  );
}
