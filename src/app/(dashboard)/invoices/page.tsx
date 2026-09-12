'use client';
import { useState, useRef, useCallback } from 'react';
import { useInvoices } from '@/features/invoices/hooks';
import { useOrders } from '@/features/orders/hooks';
import { useCustomers } from '@/features/customers/hooks';
import { useVehicles } from '@/features/vehicles/hooks';
import { useDrivers } from '@/features/drivers/hooks';

import { formatINR } from '@/lib/formatters';
import { FileText, Download, Building2, Printer, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Spinner } from '@/components/ui/Spinner';
import { BadgeWithDot } from '@/components/ui/BadgeWithDot';
import { useProducts } from '@/features/products/hooks';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/Breadcrumb';
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/Empty';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from '@/components/ui/ContextMenu';

export default function InvoicesPage() {
  const { invoices, markInvoicePaid } = useInvoices();
  const { orders } = useOrders();
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();
  const { drivers } = useDrivers();
  const { products } = useProducts();

  const [selectedInv, setSelectedInv] = useState<string | null>(invoices[0]?.id || null);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const inv = invoices.find(i => i.id === (selectedInv || invoices[0]?.id)) || invoices[0] || null;
  const order = inv ? orders.find(o => o.id === inv.orderId) : null;
  const customer = order ? customers.find(c => c.id === order.customerId) : null;
  const vehicle = order ? vehicles.find(v => v.id === order.vehicleId) : null;
  const driver = order ? drivers.find(d => d.id === order.driverId) : null;

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || id;

  // ── Real PDF download from /api/invoices/[id]/pdf ──────────────────────────
  const handleDownloadPdf = useCallback(async () => {
    if (!inv) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/invoices/${inv.id}/pdf`);
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${inv.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF Downloaded', { description: `Invoice ${inv.id} saved as PDF.` });
    } catch {
      toast.error('PDF generation failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, [inv]);

  // ── Browser print fallback ─────────────────────────────────────────────────
  const handlePrint = () => {
    if (!printRef.current) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>Tax Invoice ${inv?.id}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 30px; color: #111; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th { text-align: left; padding: 8px; border-bottom: 2px solid #ddd; font-size: 11px; color: #555; text-transform: uppercase; }
      td { padding: 8px; border-bottom: 1px solid #eee; font-size: 12.5px; }
    </style>
    </head><body>${printRef.current.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="animate-slide-in">
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/invoices">Delivery &amp; Billing</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>GST Tax Invoices</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="page-header">
        <div>
          <div className="page-title">Automated GST Billing &amp; Invoicing</div>
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
            <div style={{ padding: '36px 16px' }}>
              <Empty>
                <EmptyMedia>
                  <FileText size={32} color="var(--text-low)" />
                </EmptyMedia>
                <EmptyTitle>No invoices generated</EmptyTitle>
                <EmptyDescription>Completed and signed trips will automatically generate tax invoices here.</EmptyDescription>
              </Empty>
            </div>
          ) : (
            invoices.map(i => {
              const cust = customers.find(c => c.id === i.customerId);
              const isSelected = (inv?.id === i.id);
              return (
                <ContextMenu key={i.id}>
                  <ContextMenuTrigger render={
                    <div
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
                        <BadgeWithDot
                          color={i.status === 'Paid' ? 'success' : 'warning'}
                          pulse={i.status === 'Pending'}
                          size="sm"
                        >
                          {i.status}
                        </BadgeWithDot>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--text-high)', fontSize: 13, marginTop: 4 }}>{cust?.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-low)', marginTop: 2 }}>
                        {i.createdAt} • <strong style={{ color: 'var(--text-high)' }}>{formatINR(i.total)}</strong>
                      </div>
                    </div>
                  } />
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => setSelectedInv(i.id)}>
                      <FileText className="w-4 h-4 mr-2" /> Inspect Invoice
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handleDownloadPdf}>
                      <Download className="w-4 h-4 mr-2" /> Download PDF
                      <ContextMenuShortcut>⌘D</ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handlePrint}>
                      <Printer className="w-4 h-4 mr-2" /> Print Invoice
                      <ContextMenuShortcut>⌘P</ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    {i.status === 'Pending' && (
                      <ContextMenuItem onClick={() => markInvoicePaid(i.id)}>
                        <ShieldCheck className="w-4 h-4 mr-2 text-emerald-600" /> Settle &amp; Mark Paid
                        <ContextMenuShortcut>⌘S</ContextMenuShortcut>
                      </ContextMenuItem>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
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
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center', gap: 8 }}
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <Spinner size="xs" color="text-white" />
                      <span>Generating PDF…</span>
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      <span>Download GST Invoice PDF</span>
                    </>
                  )}
                </button>
                <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={handlePrint}>
                  <Printer size={15} /> Print
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--brand, #0057FF)', paddingBottom: 16, marginBottom: 20 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, background: 'var(--brand, #0057FF)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                        <Building2 size={18} />
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-high, #141414)' }}>Precision Logistics LMS</div>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-mid, #525252)', marginTop: 4 }}>
                      Central Logistics Hub, Lucknow, UP • GSTIN: 09AAACP1234F1Z9
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand, #0057FF)', fontFamily: 'var(--font-mono, monospace)' }}>{inv.id}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-low, #909090)', marginTop: 2 }}>Issue Date: {inv.createdAt}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-low, #909090)' }}>Dispatch Order: {inv.orderId}</div>
                    <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                      <BadgeWithDot color={inv.status === 'Paid' ? 'success' : 'warning'} size="sm">
                        {inv.status}
                      </BadgeWithDot>
                    </div>
                  </div>
                </div>

                {/* Bill To + Consignee info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20, fontSize: 12 }}>
                  <div style={{ background: 'var(--surface-2, #F3F2EF)', padding: 12, borderRadius: 8, border: '1px solid var(--border, #E6E4DF)' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-mid, #525252)', textTransform: 'uppercase', marginBottom: 4 }}>Billed To (Consignee)</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high, #141414)' }}>{customer?.name}</div>
                    <div style={{ color: 'var(--text-mid, #525252)', marginTop: 2 }}>{customer?.address}</div>
                    <div style={{ color: 'var(--text-mid, #525252)', marginTop: 2 }}>GSTIN: <strong>{customer?.gstin}</strong></div>
                  </div>

                  <div style={{ background: 'var(--surface-2, #F3F2EF)', padding: 12, borderRadius: 8, border: '1px solid var(--border, #E6E4DF)' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-mid, #525252)', textTransform: 'uppercase', marginBottom: 4 }}>Corridor & Transport Dossier</div>
                    <div style={{ color: 'var(--text-high, #141414)', fontWeight: 600 }}>Vehicle: <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>{vehicle?.vehicleNo}</span></div>
                    <div style={{ color: 'var(--text-mid, #525252)', marginTop: 2 }}>Driver: {driver?.name}</div>
                    <div style={{ color: 'var(--text-mid, #525252)', marginTop: 2 }}>Route: {order?.origin} → {order?.destination}</div>
                  </div>
                </div>

                {/* Items Manifest Table */}
                <div className="table-container">
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-2, #F3F2EF)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text-mid, #525252)', borderBottom: '1px solid var(--border, #E6E4DF)' }}>Item Description</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: 'var(--text-mid, #525252)', borderBottom: '1px solid var(--border, #E6E4DF)' }}>Payload Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order?.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border, #E6E4DF)' }}>
                          <td style={{ padding: '8px 12px', fontSize: 12.5, color: 'var(--text-high, #141414)' }}>{getProductName(item.productId)}</td>
                          <td style={{ padding: '8px 12px', fontSize: 12.5, textAlign: 'right', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: 'var(--text-high, #141414)' }}>
                            {item.quantity.toLocaleString()} kg
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Billing Cost Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, borderTop: '1px solid var(--border, #E6E4DF)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-mid, #525252)' }}>
                    <span>Freight Corridor Charges</span>
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-high, #141414)' }}>{formatINR(inv.freight)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-mid, #525252)' }}>
                    <span>Warehouse Loading & Staging</span>
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-high, #141414)' }}>{formatINR(inv.loading)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-mid, #525252)' }}>
                    <span>Destination Unloading & Docking</span>
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-high, #141414)' }}>{formatINR(inv.unloading)}</span>
                  </div>
                  {inv.damageDeduction ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                      <span>Damaged/Shortage Goods Deduction</span>
                      <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>-{formatINR(inv.damageDeduction)}</span>
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-mid, #525252)', borderTop: '1px solid var(--border, #E6E4DF)', paddingTop: 6 }}>
                    <span>Taxable Subtotal</span>
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: 'var(--text-high, #141414)' }}>{formatINR(inv.subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-mid, #525252)' }}>
                    <span>GST @ 18% (Integrated IGST)</span>
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-high, #141414)' }}>{formatINR(inv.gst)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--text-high, #141414)', paddingTop: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-high, #141414)' }}>TOTAL PAYABLE</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand, #0057FF)', fontFamily: 'var(--font-mono, monospace)' }}>
                      {formatINR(inv.total)}
                    </span>
                  </div>
                </div>

                {/* Authentication & Signature Badge */}
                <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border, #E6E4DF)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: 11.5, fontWeight: 600 }}>
                    <ShieldCheck size={16} />
                    e-POD Verified & Digitally Counter-Signed
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-low, #909090)' }}>
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
