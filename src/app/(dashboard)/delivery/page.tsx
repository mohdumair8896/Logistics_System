'use client';
import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import {
  PackageCheck, CheckCircle, PenLine,
  RotateCcw, Camera, FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DeliveryPage() {
  const { trips, vehicles, drivers, orders, customers, products, completeDelivery, generateInvoice } = useStore();
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
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
  const router = useRouter();

  // Canvas Signature Pad reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  const deliveredTrips = trips.filter(t => t.status === 'Delivered' || t.progress >= 100);
  const activeTrip = trips.find(t => t.id === (selectedTrip || deliveredTrips[0]?.id)) || null;
  const order = activeTrip ? orders.find(o => o.id === activeTrip.orderId) : null;
  const customer = order ? customers.find(c => c.id === order.customerId) : null;
  const driver = activeTrip ? drivers.find(d => d.id === activeTrip.driverId) : null;
  const vehicle = activeTrip ? vehicles.find(v => v.id === activeTrip.vehicleId) : null;

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || id;

  useEffect(() => {
    if (order && form.deliveredQty === 0) {
      setForm(f => ({ ...f, deliveredQty: order.totalWeight, receiver: customer?.contact || 'Authorized Receiver' }));
    }
  }, [order, customer]);

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
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
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

  const handleComplete = () => {
    if (!activeTrip || !order) return;
    const damageDeduction = form.damagedQty * 20; // 20 INR per kg deduction
    completeDelivery(activeTrip.id, form.deliveredQty, form.damagedQty, form.receiver, form.hasSigned);
    const invId = generateInvoice(order.id, damageDeduction, form.receiver);
    setInvoiceId(invId);
    setCompleted(true);
  };

  return (
    <div className="animate-slide-in">
      <div className="page-header">
        <div>
          <div className="page-title">Electronic Proof of Delivery (e-POD) & Billing</div>
          <div className="page-subtitle">Digital consignee signature capture, goods acceptance & automated invoicing</div>
        </div>
      </div>

      <div className="responsive-split-2">
        {/* Left Column: Arrived Trips Queue */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'fit-content' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Arrived Trips ({deliveredTrips.length})</span>
            <span className="badge badge-green" style={{ fontSize: 10 }}>Ready for POD</span>
          </div>

          {deliveredTrips.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <PackageCheck size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
              No completed trips yet. Track and complete a trip first.
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
                    borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontWeight: 800, color: '#60a5fa', fontSize: 12.5 }}>{t.id}</span>
                    <span className="badge badge-green" style={{ fontSize: 10 }}>ARRIVED</span>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, marginTop: 4 }}>{cust?.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                    {t.destination} • {t.load.toLocaleString()} kg
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
                <CheckCircle size={56} color="#10b981" style={{ margin: '0 auto 16px' }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>Proof of Delivery Captured!</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>
                Invoice <strong style={{ color: '#60a5fa', fontFamily: 'JetBrains Mono' }}>{invoiceId}</strong> has been automatically generated with GST.
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
              <PackageCheck size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Select an arrived shipment to capture proof of delivery</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Shipment Details Dossier */}
              <div className="card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Trip & Order</div>
                    <div className="mono" style={{ fontSize: 15, fontWeight: 800, color: '#60a5fa' }}>
                      {activeTrip.id} / {activeTrip.orderId}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Customer Consignee</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{customer?.name}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '10px 0', borderTop: '1px solid var(--border)', fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Assigned Vehicle: </span>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{vehicle?.vehicleNo}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Driver: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{driver?.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Destination: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{activeTrip.destination}</strong>
                  </div>
                </div>
              </div>

              {/* Delivery Acceptance & Discrepancy Form */}
              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14 }}>
                  Goods Acceptance & Quantity Verification
                </div>

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

                {/* HTML5 Canvas Signature Pad (Stitch Screen 11) */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <PenLine size={13} color="#3b82f6" />
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
                    background: '#0d1526',
                    border: '1.5px dashed var(--border-light)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
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
                        color: 'var(--text-muted)',
                        fontSize: 12,
                        pointerEvents: 'none'
                      }}>
                        ✍️ Draw customer signature here with mouse or touch
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
                    <Camera size={16} color="#34d399" />
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                      Delivery Docking Photo Captured (Timestamp Watermarked: {new Date().toLocaleTimeString()})
                    </span>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: 10 }}>GEO-VERIFIED</span>
                </div>

                {/* Submit Action */}
                <button
                  className="btn btn-success btn-lg w-full"
                  style={{ justifyContent: 'center' }}
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
