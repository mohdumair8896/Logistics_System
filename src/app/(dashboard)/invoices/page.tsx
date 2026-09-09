'use client';
import { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { formatINR, getStatusBadgeClass } from '@/lib/formatters';
import { FileText, Download, Building2, Printer, ShieldCheck } from 'lucide-react';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Pagination2 } from '@/components/ui/Pagination2';
import { ShipmentQR } from '@/components/ui/ShipmentQR';

export default function InvoicesPage() {
  const { invoices, orders, vehicles, drivers, customers, products } = useStore();
  const [selectedInv, setSelectedInv] = useState<string | null>(invoices[0]?.id || null);
  const printRef = useRef<HTMLDivElement>(null);

  const inv = invoices.find(i => i.id === (selectedInv || invoices[0]?.id)) || invoices[0] || null;
  const order = inv ? orders.find(o => o.id === inv.orderId) : null;
  const customer = order ? customers.find(c => c.id === order.customerId) : null;
  const vehicle = order ? vehicles.find(v => v.id === order.vehicleId) : null;
  const driver = order ? drivers.find(d => d.id === order.driverId) : null;

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || id;

  const handlePrint = () => {
    if (!printRef.current) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>Tax Invoice ${inv?.id}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 30px; color: #111; }
      .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2a5c9a; padding-bottom: 12px; }
      .company { font-size: 20px; font-weight: 800; color: #2a5c9a; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th { text-align: left; padding: 8px; border-bottom: 2px solid #ddd; font-size: 11px; color: #555; text-transform: uppercase; }
      td { padding: 8px; border-bottom: 1px solid #eee; font-size: 12.5px; }
      .row { display: flex; justify-content: space-between; padding: 5px 0; }
    </style>
    </head><body>${printRef.current.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="animate-slide-in">
      <div className="page-header">
        <div>
          <div className="page-title">Automated GST Billing & Invoicing</div>
          <div className="page-subtitle">{invoices.length} invoices generated with e-POD authentication</div>
        </div>
      </div>

      {/* Pending invoice alert — watermelon Alert28 pattern */}
      {invoices.filter(i => i.status === 'Pending').length > 0 && (
        <AlertBanner variant="warning" title={`${invoices.filter(i => i.status === 'Pending').length} invoice(s) pending payment settlement`} dismissible>
          Follow up with customers to clear outstanding payments and verify credit terms.
        </AlertBanner>
      )}
      {invoices.filter(i => i.status === 'Paid').length > 0 && (
        <AlertBanner variant="success" title={`${invoices.filter(i => i.status === 'Paid').length} invoice(s) cleared and reconciled`} compact dismissible />
      )}

      <div className="responsive-split-2">
        {/* Invoice List Sidebar */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'fit-content' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, color: 'var(--text-mid)' }}>
            All Tax Invoices ({invoices.length})
          </div>
          {invoices.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-low)', fontSize: 13 }}>
              <FileText size={32} color="var(--text-low)" style={{ margin: '0 auto 10px' }} />
              No invoices generated yet.
            </div>
          ) : (
            invoices.map(i => {
              const cust = customers.find(c => c.id === i.customerId);
              const isSelected = (inv?.id === i.id);
              return (
                <div
                  key={i.id}
                  onClick={() => setSelectedInv(i.id)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(59,130,246,0.12)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--brand)' : '3px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontWeight: 800, color: 'var(--brand)', fontSize: 12.5 }}>{i.id}</span>
                    <span className={`badge ${getStatusBadgeClass(i.status)}`}>{i.status}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-high)', fontSize: 13, marginTop: 4 }}>{cust?.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-low)', marginTop: 2 }}>
                    {i.createdAt} • <strong style={{ color: 'var(--text-high)' }}>{formatINR(i.total)}</strong>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Invoice Detail Sheet */}
        <div>
          {!inv ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <FileText size={40} color="var(--text-low)" style={{ margin: '0 auto 12px' }} />
              <div style={{ color: 'var(--text-low)', fontSize: 13 }}>Select an invoice to preview</div>
            </div>
          ) : (
            <div>
              {/* Action Toolbar */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handlePrint}>
                  <Printer size={15} /> Print / Export Official Tax Invoice
                </button>
                <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={handlePrint}>
                  <Download size={15} /> PDF Download
                </button>
              </div>

              {/* Printable Invoice Sheet */}
              <div
                ref={printRef}
                style={{
                  background: 'white',
                  color: '#111827',
                  borderRadius: 12,
                  padding: 'clamp(14px, 3.5vw, 32px)',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  overflowX: 'auto'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #2a5c9a', paddingBottom: 16, marginBottom: 20 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, background: '#2a5c9a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Building2 size={18} />
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#2a5c9a' }}>Precision Logistics LMS</div>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                      Central Logistics Hub, Lucknow, UP • GSTIN: 09AAACP1234F1Z9
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#2a5c9a', fontFamily: 'monospace' }}>{inv.id}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Issue Date: {inv.createdAt}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b' }}>Dispatch Order: {inv.orderId}</div>
                  </div>
                </div>

                {/* Bill To + Consignee info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20, fontSize: 12 }}>
                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Billed To (Consignee)</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{customer?.name}</div>
                    <div style={{ color: '#475569', marginTop: 2 }}>{customer?.address}</div>
                    <div style={{ color: '#475569', marginTop: 2 }}>GSTIN: <strong>{customer?.gstin}</strong></div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Corridor & Transport Dossier</div>
                    <div style={{ color: '#0f172a', fontWeight: 600 }}>Vehicle: <span style={{ fontFamily: 'monospace' }}>{vehicle?.vehicleNo}</span></div>
                    <div style={{ color: '#475569', marginTop: 2 }}>Driver: {driver?.name}</div>
                    <div style={{ color: '#475569', marginTop: 2 }}>Route: {order?.origin} → {order?.destination}</div>
                  </div>
                </div>

                {/* Items Manifest Table */}
                <div className="table-container">
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#475569', borderBottom: '1px solid #cbd5e1' }}>Item Description</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#475569', borderBottom: '1px solid #cbd5e1' }}>Payload Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order?.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px 12px', fontSize: 12.5, color: '#1e293b' }}>{getProductName(item.productId)}</td>
                          <td style={{ padding: '8px 12px', fontSize: 12.5, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: '#1e293b' }}>
                            {item.quantity.toLocaleString()} kg
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Billing Cost Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Freight Corridor Charges</span>
                    <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{formatINR(inv.freight)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Warehouse Loading & Staging</span>
                    <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{formatINR(inv.loading)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Destination Unloading & Docking</span>
                    <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{formatINR(inv.unloading)}</span>
                  </div>
                  {inv.damageDeduction ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                      <span>Damaged/Shortage Goods Deduction</span>
                      <span style={{ fontFamily: 'monospace' }}>-{formatINR(inv.damageDeduction)}</span>
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
                    <span>Taxable Subtotal</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>{formatINR(inv.subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>GST @ 18% (Integrated IGST)</span>
                    <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{formatINR(inv.gst)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', paddingTop: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>TOTAL PAYABLE</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#2a5c9a', fontFamily: 'monospace' }}>
                      {formatINR(inv.total)}
                    </span>
                  </div>
                </div>

                {/* Authentication & Signature Badge */}
                <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontSize: 11.5, fontWeight: 600 }}>
                    <ShieldCheck size={16} />
                    e-POD Verified & Digitally Counter-Signed
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Authorized Signatory: <strong>{inv.receiverName || 'Consignee Receiver'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
