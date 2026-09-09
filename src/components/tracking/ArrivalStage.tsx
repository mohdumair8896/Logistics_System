'use client';
import { CheckCircle, Clock } from 'lucide-react';
import type { Trip } from '@/lib/mockData';

interface Props {
  trip: Trip;
  destination: string;
}

export default function ArrivalStage({ trip, destination }: Props) {
  const arrived = trip.progress >= 100;
  const nodeState = arrived ? 'completed' : 'upcoming';

  return (
    <div className="journey-stage">
      <div className={`journey-node journey-node-${nodeState}`}>
        {arrived ? <CheckCircle size={20} /> : <Clock size={18} />}
        <span className="journey-node-label">Arrival</span>
      </div>

      <div className={`journey-card journey-card-${nodeState}`}>
        <div className="journey-stage-header">
          <div>
            <div className="journey-stage-kicker">Stage 08 — Arrival at Destination</div>
            <div className="journey-stage-id" style={{ color: arrived ? 'var(--brand)' : 'var(--text-low)' }}>
              {arrived ? 'Arrived ✓' : 'En Route…'}
            </div>
          </div>
          {arrived ? (
            <span className="badge badge-green" style={{ fontSize: 10 }}>Confirmed</span>
          ) : (
            <span className="badge badge-gray" style={{ fontSize: 10 }}>Pending</span>
          )}
        </div>

        {arrived ? (
          <div className="delivery-hero">
            <div className="delivery-hero-icon">
              <CheckCircle size={34} color="var(--brand)" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-high)', marginBottom: 6 }}>
              Arrived at Destination
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-low)', marginBottom: 20 }}>
              {destination}
            </div>
            <div style={{
              display: 'inline-flex', gap: 24, background: 'rgba(52,211,153,0.06)',
              border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, padding: '12px 24px',
              flexWrap: 'wrap', justifyContent: 'center'
            }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Arrival Time</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--brand)', marginTop: 3 }}>
                  {trip.completedAt || 'Recorded'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Status</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)', marginTop: 3 }}>
                  {trip.geofenceStatus || 'Arrived'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-low)', marginBottom: 8 }}>
              Shipment is currently in transit. Arrival confirmation will be logged upon geofence entry.
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 8, padding: '8px 16px', fontSize: 12, color: 'var(--brand)', fontWeight: 600
            }}>
              <Clock size={13} />
              Expected: {trip.eta}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
