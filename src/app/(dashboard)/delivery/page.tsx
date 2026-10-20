'use client';
// ─── e-POD & billing ──────────────────────────────────────────────────────────
// Captures the proof of delivery for an arrived trip. The server stores it once, as a canonical record
// with a SHA-256 fingerprint, its own clock time and the truck's last GPS position from the driver's
// phone (src/app/api/trips/[id]/pod/route.ts), and the audit export lists it for a section 63 certificate.
// Nothing on this page should claim the record is legally valid: it is evidence, not a verdict.

import { useState, useRef, useEffect } from 'react';
import { useDelivery } from '@/features/delivery/hooks';
import type { AuditChecks, ConsigneeOtp, PodSummary } from '@/features/delivery/types';
import { damageDeduction, DAMAGE_RATE_INR_PER_KG, type PodConfirmation, type PodRecord } from '@/features/delivery/pod';
import {
  PackageCheck, CheckCircle, PenLine, RotateCcw, FileText, Download, Copy, KeyRound, MapPin, ShieldCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { can } from '@/lib/permissions';
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

const CONFIRMATION_OPTIONS: { id: PodConfirmation; label: string; hint: string }[] = [
  { id: 'signature', label: 'Receiver signed', hint: 'The receiver signs below' },
  { id: 'otp', label: 'Receiver gave the OTP', hint: 'The code sent to the consignee before delivery' },
  { id: 'name_only', label: 'Name only', hint: 'No signature or OTP; the record says so' },
];

const CONFIRMATION_LABEL: Record<PodConfirmation, string> = {
  signature: 'Receiver signed',
  otp: 'OTP from the consignee matched',
  name_only: 'Receiver name only',
};

const istDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

const EMPTY_CHECKS: AuditChecks = { sealIntact: false, tempVerified: false, countVerified: false };

export default function DeliveryPage() {
  const { trips, deliveredTrips, vehicles, drivers, orders, customers, pods, capturePod, getConsigneeOtp, generateInvoice } = useDelivery();
  const { user } = useCurrentUser();
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  // Unticked until someone actually checks: these go into the hashed record as attestations
  const [auditChecks, setAuditChecks] = useState<AuditChecks>(EMPTY_CHECKS);
  const [form, setForm] = useState({
    deliveredQty: 0,
    damagedQty: 0,
    receiver: '',
    remarks: '',
    hasSigned: false,
  });
  const [confirmation, setConfirmation] = useState<PodConfirmation>('signature');
  const [otpPin, setOtpPin] = useState('');
  const [consigneeOtp, setConsigneeOtp] = useState<ConsigneeOtp | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<{ tripId: string; invoiceId: string | null } | null>(null);
  const router = useRouter();

  // Canvas Signature Pad reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  const activeTrip = trips.find(t => t.id === (selectedTrip || deliveredTrips[0]?.id)) || null;
  const order = activeTrip ? orders.find(o => o.id === activeTrip.orderId) : null;
  const customer = order ? customers.find(c => c.id === order.customerId) : null;
  const driver = activeTrip ? drivers.find(d => d.id === activeTrip.driverId) : null;
  const vehicle = activeTrip ? vehicles.find(v => v.id === activeTrip.vehicleId) : null;
  const activePod = activeTrip ? pods[activeTrip.id] : undefined;
  const deduction = damageDeduction(form.damagedQty);

  // Reset the form when another trip is selected (without a cascading effect)
  const [prevTripId, setPrevTripId] = useState<string | null>(null);
  if (activeTrip && activeTrip.id !== prevTripId) {
    setPrevTripId(activeTrip.id);
    setForm({ deliveredQty: order?.totalWeight ?? activeTrip.load ?? 0, damagedQty: 0, receiver: '', remarks: '', hasSigned: false });
    setAuditChecks(EMPTY_CHECKS);
    setConfirmation('signature');
    setOtpPin('');
    setConsigneeOtp(null);
  }

  // Canvas pixels per CSS pixel: the canvas is drawn at a fixed size and stretched to the card width
  const canvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  // Setup signature drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawing.current = true;
    const { x, y } = canvasPoint(e, canvas);

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

    const { x, y } = canvasPoint(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!form.hasSigned) setForm(f => ({ ...f, hasSigned: true }));
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

  const fetchConsigneeOtp = async () => {
    if (!activeTrip) return;
    const result = await getConsigneeOtp(activeTrip.id);
    if ('error' in result) toast.error(result.error);
    else setConsigneeOtp(result);
  };

  const receiverOk = form.receiver.trim().length >= 2;
  const confirmationOk = confirmation === 'otp' ? /^\d{6}$/.test(otpPin)
    : confirmation === 'signature' ? form.hasSigned
    : true;
  const canSubmit = receiverOk && confirmationOk && !saving;

  const handleComplete = async () => {
    if (!activeTrip || !canSubmit) return;
    setSaving(true);
    try {
      const signaturePng = form.hasSigned ? canvasRef.current?.toDataURL('image/png') : undefined;
      // Recording the POD also closes the trip if it is still in transit, which stops the driver's trip link
      const pod = await capturePod(activeTrip.id, {
        receiverName: form.receiver.trim(),
        confirmation,
        otp: confirmation === 'otp' ? otpPin : undefined,
        deliveredKg: Math.max(0, Math.round(form.deliveredQty)),
        damagedKg: Math.max(0, Math.round(form.damagedQty)),
        remarks: form.remarks.trim(),
        checks: auditChecks,
        signaturePng,
      });
      if (!pod) return; // the server's reason is already shown as a toast
      // The POD stands even if invoicing fails; the invoice can be generated again later
      const invoiceId = order ? await generateInvoice(order.id, pod.damageDeduction, form.receiver.trim()) : null;
      setLastInvoice({ tripId: pod.tripId, invoiceId });
    } finally {
      setSaving(false);
    }
  };

  const nextTripWithoutPod = deliveredTrips.find(t => !pods[t.id] && t.id !== activeTrip?.id);

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
          <div className="page-subtitle">Receiver confirmation, a fingerprinted delivery record, and the invoice</div>
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
            <span className="badge badge-green" style={{ fontSize: 10 }}>
              {deliveredTrips.filter(t => !pods[t.id]).length} awaiting POD
            </span>
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
              const recorded = !!pods[t.id];

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTrip(t.id)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--brand-10)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--brand)' : '3px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontWeight: 800, color: 'var(--brand)', fontSize: 12.5 }}>{t.id}</span>
                    {recorded
                      ? <BadgeWithDot color="neutral" size="sm">POD RECORDED</BadgeWithDot>
                      : <BadgeWithDot color="success" size="sm">ARRIVED</BadgeWithDot>}
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

        {/* Right Column: recorded POD, or the e-POD form */}
        <div>
          {activeTrip && activePod ? (
            <PodRecordCard
              key={`${activeTrip.id}:${activePod.recordHash}`}
              pod={activePod}
              invoiceId={lastInvoice?.tripId === activeTrip.id ? lastInvoice.invoiceId : undefined}
              canExport={can(user.role, 'pod.export')}
              onViewInvoices={() => router.push('/invoices')}
              onNext={nextTripWithoutPod ? () => setSelectedTrip(nextTripWithoutPod.id) : undefined}
            />
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
                          <DrawerDescription>Waybill details and the handover checks entered so far</DrawerDescription>
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
                                <span className="text-[var(--text-low)] block">Seal at handover</span>
                                <span className="font-bold text-[var(--text-high)]">{auditChecks.sealIntact ? 'Confirmed intact' : 'Not confirmed'}</span>
                              </div>
                              <div className="p-2.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)]">
                                <span className="text-[var(--text-low)] block">Cargo temperature</span>
                                <span className="font-bold text-[var(--text-high)]">{activeTrip.cargoTemp || 'Not recorded'}</span>
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
                        {form.damagedQty} kg marked damaged/short. ₹{deduction.toLocaleString('en-IN')} (₹{DAMAGE_RATE_INR_PER_KG}/kg) will be deducted on the invoice and written into the POD record.
                        {/* TODO(photo upload): link this deduction to a photo of the damage once POD photos can be uploaded */}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <div className="grid-2" style={{ gap: 14, marginBottom: 14 }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="pod-delivered">Delivered Quantity (kg)</label>
                    <input
                      id="pod-delivered"
                      className="form-input"
                      type="number"
                      min={0}
                      value={form.deliveredQty}
                      onChange={e => setForm({ ...form, deliveredQty: Math.max(0, +e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="pod-damaged">Damaged / Short Quantity (kg)</label>
                    <input
                      id="pod-damaged"
                      className="form-input"
                      type="number"
                      min={0}
                      value={form.damagedQty}
                      onChange={e => setForm({ ...form, damagedQty: Math.max(0, +e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: 14, marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="pod-receiver">Receiver&apos;s full name</label>
                    <input
                      id="pod-receiver"
                      className="form-input"
                      value={form.receiver}
                      onChange={e => setForm({ ...form, receiver: e.target.value })}
                      placeholder={customer?.contact ? `e.g. ${customer.contact}` : 'Who received the goods'}
                      maxLength={100}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="pod-remarks">Receiver&apos;s remarks</label>
                    <input
                      id="pod-remarks"
                      className="form-input"
                      value={form.remarks}
                      onChange={e => setForm({ ...form, remarks: e.target.value })}
                      placeholder="Condition of goods, seal, shortages…"
                      maxLength={500}
                    />
                  </div>
                </div>

                {/* How the receiver confirmed the handover */}
                <div style={{ marginBottom: 18, padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-high)', marginBottom: 10 }}>
                    How did the receiver confirm?
                  </div>
                  <div role="radiogroup" aria-label="Receiver confirmation" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
                    {CONFIRMATION_OPTIONS.map(opt => (
                      <label
                        key={opt.id}
                        style={{
                          display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', cursor: 'pointer',
                          borderRadius: 8, background: 'var(--surface-1)',
                          border: `1px solid ${confirmation === opt.id ? 'var(--border-active)' : 'var(--border)'}`,
                        }}
                      >
                        <input
                          type="radio"
                          name="pod-confirmation"
                          value={opt.id}
                          checked={confirmation === opt.id}
                          onChange={() => setConfirmation(opt.id)}
                          style={{ marginTop: 2, accentColor: 'var(--brand)' }}
                        />
                        <span>
                          <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>{opt.label}</span>
                          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-low)', marginTop: 2 }}>{opt.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>

                  {confirmation === 'otp' && (
                    <div style={{ marginTop: 14 }}>
                      <PinInput
                        value={otpPin}
                        onChange={setOtpPin}
                        label="OTP the receiver read out"
                        description="Checked against this trip's code when you record the POD."
                      />
                      {can(user.role, 'trip.dispatch') && (
                        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-mid)' }}>
                          {consigneeOtp ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                              <span>
                                Code for {consigneeOtp.customerName ?? 'the consignee'}:{' '}
                                <strong className="mono" style={{ color: 'var(--text-high)', fontSize: 14 }}>{consigneeOtp.otp}</strong>
                              </span>
                              {consigneeOtp.whatsappUrl && (
                                <a className="btn btn-secondary btn-sm" href={consigneeOtp.whatsappUrl} target="_blank" rel="noopener noreferrer">
                                  Send on WhatsApp
                                </a>
                              )}
                              <span style={{ flexBasis: '100%', color: 'var(--text-low)' }}>
                                Send it to the consignee before the truck arrives, never to the driver.
                              </span>
                            </div>
                          ) : (
                            <button type="button" className="btn btn-ghost btn-sm" onClick={fetchConsigneeOtp} style={{ gap: 6 }}>
                              <KeyRound size={13} /> Get the consignee&apos;s code to send
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
                      Receiver&apos;s signature {confirmation === 'signature' ? '(required)' : '(optional)'}
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
                      style={{ width: '100%', height: '120px', cursor: 'crosshair', display: 'block', touchAction: 'none' }}
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

                {/* What the server adds to the record */}
                <div style={{
                  padding: 12,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  marginBottom: 16,
                  fontSize: 12,
                  color: 'var(--text-mid)',
                  lineHeight: 1.5,
                }}>
                  <ShieldCheck size={16} color="var(--brand)" style={{ flex: 'none', marginTop: 1 }} />
                  <span>
                    When you record the POD, the server adds its own time and the truck&apos;s last GPS position from the
                    driver&apos;s trip link, then stores the record once with a SHA-256 fingerprint. It can&apos;t be edited afterwards.
                    {activeTrip.status === 'In Transit' && ' Recording it also closes the trip and stops the driver\'s location sharing.'}
                  </span>
                </div>
                {/* TODO(photo upload): add a geotagged photo of the signed LR here once POD photo upload exists; its
                    object key and SHA-256 go into the record's photoRef (src/features/delivery/pod.ts). */}

                {/* Submit Action */}
                <button
                  className="btn btn-primary btn-lg w-full"
                  style={{
                    justifyContent: 'center',
                    background: canSubmit ? 'linear-gradient(135deg, #0B6B4E, #07523C)' : 'var(--surface-3)',
                    color: canSubmit ? '#ffffff' : 'var(--text-low)',
                    boxShadow: canSubmit ? '0 4px 14px rgba(11, 107, 78, 0.25)' : 'none',
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 18px',
                    fontWeight: 700,
                    fontSize: 13.5,
                  }}
                  onClick={handleComplete}
                  disabled={!canSubmit}
                >
                  <PackageCheck size={16} /> {saving ? 'Recording POD…' : order ? 'Record POD & generate invoice →' : 'Record POD →'}
                </button>
                {!canSubmit && !saving && (
                  <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-low)', textAlign: 'center' }}>
                    {!receiverOk ? 'Enter the receiver\'s name.'
                      : confirmation === 'otp' ? 'Enter the 6-digit OTP the receiver read out.'
                      : 'The receiver needs to sign, or choose another way they confirmed.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── A recorded POD: what was stored, its fingerprint, and the audit export ──
function PodRecordCard({ pod, invoiceId, canExport, onViewInvoices, onNext }: {
  pod: PodSummary;
  invoiceId: string | null | undefined; // undefined: not raised from this screen just now
  canExport: boolean;
  onViewInvoices: () => void;
  onNext?: () => void;
}) {
  const [detail, setDetail] = useState<{ record: PodRecord; hashMatches: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/trips/${encodeURIComponent(pod.tripId)}/pod`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (cancelled || !data) return;
        try {
          setDetail({ record: JSON.parse(data.record) as PodRecord, hashMatches: !!data.hashMatches });
        } catch { /* leave the summary only */ }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pod.tripId]);

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(pod.recordHash);
      toast.success('Fingerprint copied');
    } catch {
      toast.error('Could not copy. Select the fingerprint and copy it by hand.');
    }
  };

  const loc = detail?.record.location;
  const rows: [string, React.ReactNode][] = [
    ['Receiver', pod.receiverName],
    ['Confirmation', CONFIRMATION_LABEL[pod.confirmation] ?? pod.confirmation],
    ['Recorded at', istDateTime(pod.capturedAt)],
    ['Location', loc
      ? <>
          <span className="mono">{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</span>
          <span style={{ color: 'var(--text-low)' }}> · driver&apos;s phone GPS at {istDateTime(loc.recordedAt)}{loc.accuracyM !== null ? ` (±${Math.round(loc.accuracyM)} m)` : ''}</span>
        </>
      : detail ? 'No GPS ping was received on this trip' : '…'],
    ['Deduction', `₹${Number(pod.damageDeduction).toLocaleString('en-IN')}`],
  ];

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <CheckCircle size={28} color="var(--brand)" />
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-high)' }}>Proof of delivery recorded</div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--text-low)' }}>{pod.tripId}{pod.orderId ? ` / ${pod.orderId}` : ''}</div>
        </div>
      </div>

      <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '8px 16px', fontSize: 13, margin: 0 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: 'contents' }}>
            <dt style={{ color: 'var(--text-low)' }}>{label}</dt>
            <dd style={{ margin: 0, color: 'var(--text-high)', fontWeight: 500 }}>{value}</dd>
          </div>
        ))}
      </dl>

      <div style={{ marginTop: 18, padding: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-high)' }}>SHA-256 fingerprint</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={copyHash} style={{ gap: 6, fontSize: 11.5 }}>
            <Copy size={12} /> Copy
          </button>
        </div>
        <div className="mono" style={{ fontSize: 12, wordBreak: 'break-all', color: 'var(--text-high)' }}>{pod.recordHash}</div>
        <div style={{ marginTop: 6, fontSize: 11.5, color: detail && !detail.hashMatches ? 'var(--status-error)' : 'var(--text-low)' }}>
          {detail
            ? detail.hashMatches
              ? 'The stored record still matches this fingerprint.'
              : 'The stored record no longer matches this fingerprint. It was changed after it was recorded.'
            : 'Checking the stored record…'}
          {' '}Share the fingerprint with the consignee if you want them to hold a copy.
        </div>
      </div>

      {canExport && (
        <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5 }}>
          <a className="btn btn-secondary btn-sm" href={`/api/pod/export?tripId=${encodeURIComponent(pod.tripId)}`} download style={{ gap: 6 }}>
            <Download size={13} /> Download audit export (JSON)
          </a>
          <div style={{ marginTop: 6, color: 'var(--text-low)' }}>
            Lists the stored record, its fingerprint check and how records are made, to help you prepare a certificate
            under section 63 of the Bharatiya Sakshya Adhiniyam. It is not a certificate itself.
          </div>
        </div>
      )}

      {invoiceId !== undefined && (
        <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-mid)' }}>
          {invoiceId
            ? <>Invoice <strong className="mono" style={{ color: 'var(--brand)' }}>{invoiceId}</strong> has been generated.</>
            : 'The invoice was not generated. You can raise it from Invoices.'}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
        <button type="button" className="btn btn-primary" onClick={onViewInvoices}>
          <FileText size={15} /> View invoices →
        </button>
        {onNext && (
          <button type="button" className="btn btn-ghost" onClick={onNext} style={{ gap: 6 }}>
            <MapPin size={14} /> Next arrived trip
          </button>
        )}
      </div>
    </div>
  );
}
