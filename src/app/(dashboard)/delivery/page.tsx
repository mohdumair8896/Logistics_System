'use client';
import { useState, useRef } from 'react';
import { useDelivery } from '@/features/delivery/hooks';
import type { AuditChecks } from '@/features/delivery/types';
import {
  PackageCheck, CheckCircle, PenLine,
  RotateCcw, Camera, FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Toggle } from '@/components/ui/Toggle';
import { PinInput } from '@/components/ui/PinInput';
import { BadgeWithDot } from '@/components/ui/BadgeWithDot';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/Breadcrumb';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/Drawer';
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/Empty';

export default function DeliveryPage() {
  const { trips, deliveredTrips, vehicles, drivers, orders, completeDelivery, generateInvoice, customers } = useDelivery();
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [auditChecks, setAuditChecks] = useState<AuditChecks>({
    sealIntact: true,
    tempVerified: true,
    countVerified: true
  });
  const [form, setForm] = useState({
    deliveredQty: 0,
    damagedQty: 0,
    receiver: 'Rajesh Kumar (Authorized Consignee)',
    remarks: 'Received in satisfactory condition without seal tampering.',
    podUploaded: true,
    hasSigned: false
  });
  const [completed, setCompleted] = useState(false);
  const [invoiceId, setInvoiceId] = useState('');
  const [otpPin, setOtpPin] = useState('749201');
  const router = useRouter();

  // Canvas Signature Pad reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  const activeTrip = trips.find(t => t.id === (selectedTrip || deliveredTrips[0]?.id)) || null;
  const order = activeTrip ? orders.find(o => o.id === activeTrip.orderId) : null;
  const customer = order ? customers.find(c => c.id === order.customerId) : null;
  const driver = activeTrip ? drivers.find(d => d.id === activeTrip.driverId) : null;
  const vehicle = activeTrip ? vehicles.find(v => v.id === activeTrip.vehicleId) : null;

  // Sync form defaults with active order when selected without cascading effect
  const [prevOrderId, setPrevOrderId] = useState<string | null>(null);
  if (order && order.id !== prevOrderId) {
    setPrevOrderId(order.id);
    setForm(f => ({ ...f, deliveredQty: order.totalWeight, receiver: customer?.contact || 'Authorized Receiver' }));
  }

  // Setup signature drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawing.current = true;
    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left;
    const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left;
    const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setForm(f => ({ ...f, hasSigned: true }));
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setForm(f => ({ ...f, hasSigned: false }));
  };

  const handleComplete = async () => {
    if (!activeTrip || !order) return;
    const damageDeduction = form.damagedQty * 20;
    await completeDelivery(activeTrip.id);
    const invId = await generateInvoice(order.id, damageDeduction, form.receiver);
    setInvoiceId(invId);
    setCompleted(true);
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
              <BreadcrumbLink href="/delivery">Delivery &amp; Billing</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>e-POD &amp; Acceptance</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="page-header">
        <div>
          <div className="page-title">Electronic Proof of Delivery (e-POD) & Billing</div>
          <div className="page-subtitle">Digital consignee signature capture, goods acceptance & automated invoicing</div>
        </div>
      </div>

      {/* Delivery status alerts — watermelon Alert27 success pattern */}
      {trips.filter(t => t.status === 'In Transit').length === 0 && (
        <AlertBanner variant="success" title="All active trips delivered" compact dismissible />
      )}

      <div className="responsive-split-2">
        {/* Left Column: Arrived Trips Queue */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'fit-content' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, color: 'var(--text-mid)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Arrived Trips ({deliveredTrips.length})</span>
            <span className="badge badge-green" style={{ fontSize: 10 }}>Ready for POD</span>
          </div>

          {deliveredTrips.length === 0 ? (
            <div style={{ padding: '32px 16px' }}>
              <Empty>
                <EmptyMedia>
                  <PackageCheck size={36} color="var(--text-low)" />
                </EmptyMedia>
                <EmptyTitle>No arrived trips yet</EmptyTitle>
                <EmptyDescription>Track and complete a corridor trip to initiate e-POD.</EmptyDescription>
              </Empty>
            </div>
          ) : (
            deliveredTrips.map(t => {
              const o = orders.find(ord => ord.id === t.orderId);
              const cust = customers.find(c => c.id === o?.customerId);
              const isSelected = (activeTrip?.id === t.id);

              return (
                <div
                  key={t.id}
                  onClick={() => { setSelectedTrip(t.id); setCompleted(false); }}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(59,130,246,0.12)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--brand)' : '3px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontWeight: 800, color: 'var(--brand)', fontSize: 12.5 }}>{t.id}</span>
                    <BadgeWithDot color="success" size="sm">ARRIVED</BadgeWithDot>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-high)', fontSize: 13, marginTop: 4 }}>{cust?.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-low)', marginTop: 2 }}>
                    {t.destination} · {(t.load ?? 0).toLocaleString()} kg
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: e-POD Form & Canvas Pad (Stitch Screen 11) */}
        <div>
          {completed ? (
            <div className="card" style={{ textAlign: 'center', padding: 50 }}>
              <div style={{ animation: 'float 1s ease-in-out infinite' }}>
                <CheckCircle size={56} color="var(--brand)" style={{ margin: '0 auto 16px' }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>Proof of Delivery Captured!</div>
              <div style={{ fontSize: 14, color: 'var(--text-mid)', marginTop: 8 }}>
                Invoice <strong style={{ color: 'var(--brand)', fontFamily: 'JetBrains Mono' }}>{invoiceId}</strong> has been automatically generated with GST.
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'center' }}>
                <button className="btn btn-primary btn-lg" onClick={() => router.push('/invoices')}>
                  <FileText size={16} /> View Tax Invoice →
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => setCompleted(false)}>
                  New POD Verification
                </button>
              </div>
            </div>
          ) : !activeTrip ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <PackageCheck size={40} color="var(--text-low)" style={{ margin: '0 auto 12px' }} />
              <div style={{ color: 'var(--text-low)', fontSize: 13 }}>Select an arrived shipment to capture proof of delivery</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Shipment Details Dossier */}
              <div className="card" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Trip &amp; Order</div>
                    <div className="mono" style={{ fontSize: 15, fontWeight: 800, color: 'var(--brand)' }}>
                      {activeTrip.id} / {activeTrip.orderId}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Drawer swipeDirection="right">
                      <DrawerTrigger render={
                        <button type="button" className="btn btn-secondary btn-sm" style={{ gap: 6, fontSize: 11.5 }}>
                          <FileText size={13} /> Full Dossier
                        </button>
                      } />
                      <DrawerContent className="p-6">
                        <DrawerHeader className="p-0 pb-4 border-b border-[var(--border)]">
                          <DrawerTitle>Consignment Audit Dossier</DrawerTitle>
                          <DrawerDescription>Waybill manifest, cold-chain telemetry, and digital compliance trail</DrawerDescription>
                        </DrawerHeader>
                        <div className="py-4 space-y-4 text-sm">
                          <div className="p-3 bg-[var(--surface-2)] rounded-lg space-y-1.5 border border-[var(--border)]">
                            <div className="flex justify-between text-xs text-[var(--text-low)]">
                              <span>Trip Identifier</span>
                              <span className="mono font-bold text-[var(--brand)]">{activeTrip.id}</span>
                            </div>
                            <div className="flex justify-between text-xs text-[var(--text-low)]">
                              <span>Customer Order Ref</span>
                              <span className="mono font-bold text-[var(--text-high)]">{activeTrip.orderId}</span>
                            </div>
                            <div className="flex justify-between text-xs text-[var(--text-low)]">
                              <span>Consignee Account</span>
                              <span className="font-semibold text-[var(--text-high)]">{customer?.name}</span>
                            </div>
                            <div className="flex justify-between text-xs text-[var(--text-low)]">
                              <span>Delivery Destination</span>
                              <span className="font-medium text-[var(--text-high)]">{activeTrip.destination}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-mid)]">Telemetry &amp; Compliance Checks</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="p-2.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)]">
                                <span className="text-[var(--text-low)] block">Vehicle Registration</span>
                                <span className="font-mono font-bold text-[var(--text-high)]">{vehicle?.vehicleNo || 'N/A'}</span>
                              </div>
                              <div className="p-2.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)]">
                                <span className="text-[var(--text-low)] block">Lead Pilot / Driver</span>
                                <span className="font-semibold text-[var(--text-high)]">{driver?.name || 'N/A'}</span>
                              </div>
                              <div className="p-2.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)]">
                                <span className="text-[var(--text-low)] block">Recorded Seal Status</span>
                                <span className="font-bold text-emerald-600">{auditChecks.sealIntact ? 'Verified Intact' : 'Broken'}</span>
                              </div>
                              <div className="p-2.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)]">
                                <span className="text-[var(--text-low)] block">Cold-Chain Telemetry</span>
                                <span className="font-bold text-emerald-600">{auditChecks.tempVerified ? '2.4°C (Compliant)' : 'Out of Bounds'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <DrawerFooter className="p-0 pt-4 border-t border-[var(--border)]">
                          <DrawerClose render={
                            <button type="button" className="btn btn-secondary w-full justify-center">Close Dossier</button>
                          } />
                        </DrawerFooter>
                      </DrawerContent>
                    </Drawer>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Customer Consignee</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>{customer?.name}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '10px 0', borderTop: '1px solid var(--border)', fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text-low)' }}>Assigned Vehicle: </span>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--text-high)' }}>{vehicle?.vehicleNo}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-low)' }}>Driver: </span>
                    <strong style={{ color: 'var(--text-high)' }}>{driver?.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-low)' }}>Destination: </span>
                    <strong style={{ color: 'var(--text-high)' }}>{activeTrip.destination}</strong>
                  </div>
                </div>
              </div>

              {/* Delivery Acceptance & Discrepancy Form */}
              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-high)', marginBottom: 14 }}>
                  Goods Acceptance &amp; Quantity Verification
                </div>

                {form.damagedQty > 0 && (
                  <div className="mb-4">
                    <Alert variant="warning">
                      <AlertTitle>Cargo Discrepancy Flagged</AlertTitle>
                      <AlertDescription>
                        {form.damagedQty} kg marked damaged/short. A debit penalty of ₹{(form.damagedQty * 20).toLocaleString()} will be automatically deducted from the final GST tax invoice.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <div className="grid-2" style={{ gap: 14, marginBottom: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Delivered Quantity (kg)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={form.deliveredQty}
                      onChange={e => setForm({...form, deliveredQty: +e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Damaged / Short Quantity (kg)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={form.damagedQty}
                      onChange={e => setForm({...form, damagedQty: +e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: 14, marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Receiver / Consignee Full Name</label>
                    <input
                      className="form-input"
                      value={form.receiver}
                      onChange={e => setForm({...form, receiver: e.target.value})}
                      placeholder="Receiver name..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Consignee Acceptance Remarks</label>
                    <input
                      className="form-input"
                      value={form.remarks}
                      onChange={e => setForm({...form, remarks: e.target.value})}
                      placeholder="Remarks..."
                    />
                  </div>
                </div>

                {/* Consignee Security Handover PIN (Untitled UI PinInput) */}
                <div style={{ marginBottom: 18, padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <PinInput
                    value={otpPin}
                    onChange={setOtpPin}
                    label="Consignee Security Handover OTP (6-Digit SMS PIN)"
                    description="Enter the secure delivery authentication code transmitted to the consignee's registered phone."
                  />
                </div>

                {/* Delivery Verification Checklist Toggles (Untitled UI Toggle) */}
                <div style={{ marginBottom: 18, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-high)', marginBottom: 10 }}>
                    Physical Handover Inspection Checks
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <Toggle
                      size="sm"
                      checked={auditChecks.sealIntact}
                      onChange={(checked) => setAuditChecks(prev => ({ ...prev, sealIntact: checked }))}
                      label="Security Seal Intact"
                      hint="Tamper-evident barrier confirmed unbroken"
                    />
                    <Toggle
                      size="sm"
                      checked={auditChecks.tempVerified}
                      onChange={(checked) => setAuditChecks(prev => ({ ...prev, tempVerified: checked }))}
                      label="Temperature Log Verified"
                      hint="Cold-chain temperature logs within range"
                    />
                    <Toggle
                      size="sm"
                      checked={auditChecks.countVerified}
                      onChange={(checked) => setAuditChecks(prev => ({ ...prev, countVerified: checked }))}
                      label="Pallet Manifest Matched"
                      hint="Barcode verified against bill of lading"
                    />
                  </div>
                </div>

                {/* HTML5 Canvas Signature Pad (Stitch Screen 11) */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <PenLine size={13} color="var(--brand)" />
                      Digital Consignee Signature (Draw on Canvas below)
                    </label>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={clearSignature}
                      style={{ fontSize: 11, padding: '3px 8px' }}
                    >
                      <RotateCcw size={11} /> Clear
                    </button>
                  </div>

                  <div style={{
                    background: '#ffffff',
                    border: '1.5px solid var(--border)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.04)'
                  }}>
                    {/* Ruled signature line */}
                    <div style={{
                      position: 'absolute',
                      bottom: 28,
                      left: 20,
                      right: 20,
                      height: 1,
                      background: 'var(--border)',
                      pointerEvents: 'none',
                      zIndex: 1
                    }} />
                    <canvas
                      ref={canvasRef}
                      width={520}
                      height={120}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      style={{ width: '100%', height: '120px', cursor: 'crosshair', display: 'block' }}
                    />
                    {!form.hasSigned && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-xlow)',
                        fontSize: 12.5,
                        pointerEvents: 'none',
                        gap: 6
                      }}>
                        <PenLine size={13} />
                        Sign here using mouse or touch
                      </div>
                    )}
                  </div>
                </div>

                {/* Proof of Delivery Photo Watermark (Stitch Screen 11) */}
                <div style={{
                  padding: 12,
                  background: 'rgba(45, 138, 78, 0.1)',
                  border: '1px solid rgba(45, 138, 78, 0.3)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Camera size={16} color="#16a34a" />
                    <span style={{ fontSize: 12, color: 'var(--text-high)', fontWeight: 600 }}>
                      Delivery Docking Photo Captured (Timestamp Watermarked: {new Date().toLocaleTimeString()})
                    </span>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: 10 }}>GEO-VERIFIED</span>
                </div>

                {/* Submit Action */}
                <button
                  className="btn btn-primary btn-lg w-full"
                  style={{
                    justifyContent: 'center',
                    background: form.receiver ? 'linear-gradient(135deg, #0057FF, #0040CC)' : 'var(--surface-3)',
                    color: form.receiver ? '#ffffff' : 'var(--text-low)',
                    boxShadow: form.receiver ? '0 4px 14px rgba(0, 87, 255, 0.25)' : 'none',
                    cursor: form.receiver ? 'pointer' : 'not-allowed',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 18px',
                    fontWeight: 700,
                    fontSize: 13.5,
                  }}
                  onClick={handleComplete}
                  disabled={!form.receiver}
                >
                  <PackageCheck size={16} /> Counter-Sign & Auto-Generate GST Tax Invoice →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
