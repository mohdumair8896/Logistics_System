'use client';
import { Receipt, ExternalLink } from 'lucide-react';
import type { Invoice } from '@/features/invoices/types';
import type { Order } from '@/features/orders/types';
import type { Customer } from '@/shared/types/common';

interface Props {
  invoice: Invoice | null;
  order: Order | null;
  customer: Customer | null;
  onNavigate: () => void;
}

export default function InvoiceStage({ invoice, order, customer, onNavigate }: Props) {
  const nodeState = invoice ? (invoice.status === 'Paid' ? 'completed' : 'active') : 'upcoming';

  return (
    <div className="journey-stage">
      <div className={`journey-node journey-node-${nodeState}`}>
        <Receipt size={18} />
        <span className="journey-node-label">Invoice</span>
      </div>

      <div className={`journey-card journey-card-${nodeState}`}>
        <div className="journey-stage-header">
          <div>
            <div className="journey-stage-kicker">Stage 10 — Billing & Settlement</div>
            <div className="journey-stage-id">{invoice?.id || 'Invoice Pending'}</div>
          </div>
          {invoice && (
            <span className={`badge badge-${invoice.status === 'Paid' ? 'green' : 'yellow'}`} style={{ fontSize: 10 }}>
              {invoice.status}
            </span>
          )}
        </div>

        {invoice ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Charges breakdown */}
            <div style={{
              background: 'rgba(2,6,23,0.5)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '14px 18px'
            }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                Charge Breakdown
              </div>
              {[
                { label: 'Freight Charges', value: invoice.freight, color: 'var(--text-high)' },
                { label: 'Loading', value: invoice.loading, color: 'var(--text-mid)' },
                { label: 'Unloading', value: invoice.unloading, color: 'var(--text-mid)' },
                ...(invoice.damageDeduction ? [{ label: 'Damage Deduction', value: -invoice.damageDeduction, color: '#fb7185' }] : []),
                { label: 'Sub-Total', value: invoice.subtotal, color: 'var(--text-high)', bold: true },
                { label: 'GST (18%)', value: invoice.gst, color: 'var(--brand)' },
              ].map((row, idx) => (
                <div key={idx} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 0',
                  borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)'
                }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-low)', fontWeight: (row as {bold?: boolean}).bold ? 600 : 400 }}>
                    {row.label}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
                    color: row.color
                  }}>
                    ₹{Math.abs(row.value).toLocaleString()}
                  </span>
                </div>
              ))}

              {/* Total */}
              <div style={{
                marginTop: 10, paddingTop: 12, borderTop: '2px solid rgba(245,158,11,0.3)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>Total Amount</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 800, color: 'var(--brand)' }}>
                  ₹{invoice.total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="journey-data-grid">
              <div className="journey-data-item">
                <span className="journey-data-label">Customer</span>
                <span className="journey-data-value">{customer?.name || invoice.customerId}</span>
              </div>
              <div className="journey-data-item">
                <span className="journey-data-label">Invoice Date</span>
                <span className="journey-data-value">{invoice.createdAt}</span>
              </div>
              <div className="journey-data-item">
                <span className="journey-data-label">Linked Order</span>
                <span className="journey-data-value-mono">{invoice.orderId}</span>
              </div>
              <div className="journey-data-item">
                <span className="journey-data-label">POD Verified</span>
                <span className="journey-data-value" style={{ color: invoice.podSigned ? 'var(--brand)' : 'var(--brand)' }}>
                  {invoice.podSigned ? 'Yes' : 'Pending'}
                </span>
              </div>
            </div>

            <button
              onClick={onNavigate}
              className="btn btn-primary"
              style={{ justifyContent: 'center', width: '100%' }}
            >
              <ExternalLink size={14} />
              View Full Invoice
            </button>
          </div>
        ) : (
          <div style={{ padding: '16px 0', color: 'var(--text-low)', fontSize: 13, textAlign: 'center' }}>
            {order
              ? 'Invoice will be generated after delivery confirmation and POD sign-off.'
              : 'No invoice found for this shipment.'}
          </div>
        )}
      </div>
    </div>
  );
}
