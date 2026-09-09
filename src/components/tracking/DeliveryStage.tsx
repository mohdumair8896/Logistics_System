'use client';
import { PackageCheck, ExternalLink } from 'lucide-react';
import type { Trip } from '@/features/trips/types';
import type { Order } from '@/features/orders/types';
import type { Invoice } from '@/features/invoices/types';

interface Props {
  trip: Trip;
  order: Order | null;
  invoice: Invoice | null;
  onNavigate: () => void;
}

export default function DeliveryStage({ trip, order, invoice, onNavigate }: Props) {
  const delivered = trip.progress >= 100;
  const nodeState = delivered ? 'completed' : 'upcoming';
  const podSigned = invoice?.podSigned || false;

  return (
    <div className="journey-stage">
      <div className={`journey-node journey-node-${nodeState}`}>
        <PackageCheck size={nodeState === 'completed' ? 20 : 18} />
        <span className="journey-node-label">e-POD</span>
      </div>

      <div className={`journey-card journey-card-${nodeState}`}>
        <div className="journey-stage-header">
          <div>
            <div className="journey-stage-kicker">Stage 09 — Delivery & e-POD</div>
            <div className="journey-stage-id" style={{ color: delivered ? 'var(--brand)' : 'var(--text-low)' }}>
              {delivered ? 'Delivered' : 'Awaiting Delivery'}
            </div>
          </div>
          {delivered ? (
            <span className={`badge badge-${podSigned ? 'green' : 'yellow'}`} style={{ fontSize: 10 }}>
              {podSigned ? 'POD Signed' : 'POD Pending'}
            </span>
          ) : (
            <span className="badge badge-gray" style={{ fontSize: 10 }}>Pending</span>
          )}
        </div>

        {delivered ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="journey-data-grid">
              <div className="journey-data-item">
                <span className="journey-data-label">Receiver</span>
                <span className="journey-data-value">{invoice?.receiverName || 'Consignee'}</span>
              </div>
              <div className="journey-data-item">
                <span className="journey-data-label">Delivery Status</span>
                <span className="journey-data-value" style={{ color: 'var(--brand)' }}>{trip.status}</span>
              </div>
              <div className="journey-data-item">
                <span className="journey-data-label">Completed At</span>
                <span className="journey-data-value">{trip.completedAt || 'Recorded'}</span>
              </div>
              <div className="journey-data-item">
                <span className="journey-data-label">Digital POD</span>
                <span className="journey-data-value" style={{ color: podSigned ? 'var(--brand)' : 'var(--brand)' }}>
                  {podSigned ? '✓ Signed' : 'Pending Signature'}
                </span>
              </div>
            </div>

            {order && (
              <div style={{
                background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)',
                borderRadius: 10, padding: '12px 16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      Order Delivered
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: 'var(--brand)', marginTop: 3 }}>
                      {order.totalWeight.toLocaleString()} kg
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      Freight Value
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: 'var(--brand)', marginTop: 3 }}>
                      ₹{order.freightRate.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={onNavigate}
              className="btn btn-success"
              style={{ justifyContent: 'center', width: '100%' }}
            >
              <ExternalLink size={14} />
              View Full e-POD Record
            </button>
          </div>
        ) : (
          <div style={{ padding: '16px 0', color: 'var(--text-low)', fontSize: 13, textAlign: 'center' }}>
            Delivery confirmation and e-POD capture will be available once the shipment arrives at its destination.
          </div>
        )}
      </div>
    </div>
  );
}
