'use client';
import { CheckCircle, Warehouse, Scale } from 'lucide-react';
import type { Order, Vehicle, Trip } from '@/lib/mockData';
import { initialProducts as products } from '@/lib/mockData';

interface Props {
  order: Order | null;
  vehicle: Vehicle | null;
  trip: Trip | null;
}

export default function LoadingStage({ order, vehicle, trip }: Props) {
  const nodeState = trip ? 'completed' : 'upcoming';

  return (
    <div className="journey-stage">
      <div className={`journey-node journey-node-${nodeState}`}>
        {trip ? <CheckCircle size={20} /> : <Warehouse size={18} />}
        <span className="journey-node-label">Loading</span>
      </div>

      <div className={`journey-card journey-card-${nodeState}`}>
        <div className="journey-stage-header">
          <div>
            <div className="journey-stage-kicker">Stage 04 — Goods Loaded</div>
            <div className="journey-stage-id">
              {order?.loadingBay ? `Bay ${order.loadingBay}` : 'Warehouse Dispatch'}
            </div>
          </div>
          {trip && (
            <span className="badge badge-green" style={{ fontSize: 10 }}>
              Sealed & Verified
            </span>
          )}
        </div>

        {order ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="journey-data-grid">
              <div className="journey-data-item">
                <span className="journey-data-label">Loading Bay</span>
                <span className="journey-data-value">{order.loadingBay ? `Bay ${order.loadingBay}` : 'General Dock'}</span>
              </div>
              <div className="journey-data-item">
                <span className="journey-data-label">Vehicle Capacity</span>
                <span className="journey-data-value">{vehicle ? `${vehicle.capacity.toLocaleString()} kg` : '—'}</span>
              </div>
            </div>

            {/* Weight visual */}
            <div style={{
              background: 'rgba(2,6,23,0.5)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: '16px 18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Scale size={14} color="var(--brand)" />
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Weight Distribution
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {order.items.map((item, idx) => {
                  const product = products.find(p => p.id === item.productId);
                  const pct = vehicle ? Math.round((item.quantity / vehicle.capacity) * 100) : 0;
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-mid)', fontWeight: 500 }}>
                          {product?.name || item.productId}
                        </span>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand)' }}>
                          {item.quantity.toLocaleString()} kg · {pct}%
                        </span>
                      </div>
                      <div className="progress-bar" style={{ height: 4 }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--brand), var(--brand))' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{
                marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-low)' }}>Total Loaded</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: 'var(--brand)' }}>
                  {order.totalWeight.toLocaleString()} kg
                </span>
              </div>
            </div>

            {!trip && (
              <div style={{
                background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)',
                borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--brand)', textAlign: 'center'
              }}>
                ⏳ Awaiting dispatch clearance
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--text-low)', fontSize: 13 }}>No cargo information available.</div>
        )}
      </div>
    </div>
  );
}
