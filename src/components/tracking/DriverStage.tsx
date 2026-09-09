'use client';
import { CheckCircle, User, Phone, CreditCard } from 'lucide-react';
import type { Driver, Vehicle } from '@/lib/mockData';

interface Props {
  driver: Driver | null;
  vehicle: Vehicle | null;
}

export default function DriverStage({ driver, vehicle }: Props) {
  const nodeState = driver ? 'completed' : 'upcoming';

  return (
    <div className="journey-stage">
      <div className={`journey-node journey-node-${nodeState}`}>
        {driver ? <CheckCircle size={20} /> : <User size={18} />}
        <span className="journey-node-label">Driver</span>
      </div>

      <div className={`journey-card journey-card-${nodeState}`}>
        <div className="journey-stage-header">
          <div>
            <div className="journey-stage-kicker">Stage 03 — Driver Assigned</div>
            <div className="journey-stage-id">{driver?.name || '—'}</div>
          </div>
          {driver && (
            <span className={`badge badge-${driver.status === 'On Trip' ? 'cyan' : driver.status === 'Available' ? 'green' : 'gray'}`} style={{ fontSize: 10 }}>
              {driver.status}
            </span>
          )}
        </div>

        {driver ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="journey-data-grid">
              <div className="journey-data-item">
                <span className="journey-data-label">Driver ID</span>
                <span className="journey-data-value-mono">{driver.id}</span>
              </div>
              <div className="journey-data-item">
                <span className="journey-data-label">Assigned Vehicle</span>
                <span className="journey-data-value-mono">{vehicle?.vehicleNo || '—'}</span>
              </div>
            </div>

            {/* Contact + license row */}
            <div style={{
              display: 'flex', gap: 10, flexWrap: 'wrap'
            }}>
              <div style={{
                flex: 1, minWidth: 140,
                background: 'rgba(2,6,23,0.5)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <Phone size={14} color="var(--icon)" />
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Phone</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-high)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {driver.phone}
                  </div>
                </div>
              </div>

              <div style={{
                flex: 1, minWidth: 140,
                background: 'rgba(2,6,23,0.5)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <CreditCard size={14} color="var(--brand)" />
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 0.8 }}>License</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-high)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {driver.licenseNo}
                  </div>
                </div>
              </div>
            </div>

            <div className="journey-data-grid">
              <div className="journey-data-item">
                <span className="journey-data-label">Rating</span>
                <span className="journey-data-value">⭐ {driver.rating} / 5.0</span>
              </div>
              <div className="journey-data-item">
                <span className="journey-data-label">Trips Completed</span>
                <span className="journey-data-value">{driver.trips}</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-low)', fontSize: 13 }}>No driver assigned yet.</div>
        )}
      </div>
    </div>
  );
}
