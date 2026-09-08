'use client';
import { CheckCircle, Package } from 'lucide-react';
import type { Order, Customer } from '@/lib/mockData';
import { initialProducts as products } from '@/lib/mockData';

interface Props {
  order: Order | null;
  customer: Customer | null;
}

export default function OrderStage({ order, customer }: Props) {
  const nodeState = order ? 'completed' : 'upcoming';

  return (
    <div className="journey-stage">
      {/* Timeline node */}
      <div className={`journey-node journey-node-${nodeState}`}>
        {order ? <CheckCircle size={20} /> : <Package size={18} />}
        <span className="journey-node-label">Order</span>
      </div>

      {/* Stage card */}
      <div className={`journey-card journey-card-${nodeState}`}>
        <div className="journey-stage-header">
          <div>
            <div className="journey-stage-kicker">Stage 01 — Order Created</div>
            <div className="journey-stage-id">{order?.id || 'No order linked'}</div>
          </div>
          <span className="badge badge-green" style={{ fontSize: 10 }}>
            {order?.status || 'N/A'}
          </span>
        </div>

        {order ? (
          <>
            <div className="journey-data-grid" style={{ marginBottom: 20 }}>
              <div className="journey-data-item">
                <span className="journey-data-label">Customer</span>
                <span className="journey-data-value">{customer?.name || order.customerId}</span>
              </div>
              <div className="journey-data-item">
                <span className="journey-data-label">Total Weight</span>
                <span className="journey-data-value">{order.totalWeight.toLocaleString()} kg</span>
              </div>
              <div className="journey-data-item">
                <span className="journey-data-label">Origin</span>
                <span className="journey-data-value">{order.origin}</span>
              </div>
              <div className="journey-data-item">
                <span className="journey-data-label">Destination</span>
                <span className="journey-data-value">{order.destination}</span>
              </div>
              <div className="journey-data-item">
                <span className="journey-data-label">Order Date</span>
                <span className="journey-data-value">{order.createdAt}</span>
              </div>
              <div className="journey-data-item">
                <span className="journey-data-label">Distance</span>
                <span className="journey-data-value">{order.distance} km</span>
              </div>
            </div>

            {/* Product manifest */}
            {order.items.length > 0 && (
              <div style={{
                background: 'rgba(2,6,23,0.5)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: '12px 16px'
              }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  Cargo Manifest
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {order.items.map((item, idx) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                      <div key={idx} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontSize: 12.5, paddingBottom: idx < order.items.length - 1 ? 8 : 0,
                        borderBottom: idx < order.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                      }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {product?.name || item.productId}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>
                          {item.quantity.toLocaleString()} kg
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No order information available.</div>
        )}
      </div>
    </div>
  );
}
