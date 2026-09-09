'use client';

import { use, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import {
  ArrowLeft,
  Share2,
  CheckCircle2,
  ExternalLink,
  Phone,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  params: Promise<{ id: string }>;
}

const emptySubscribe = () => () => {};

export default function PublicCustomerTrackingPage({ params }: Props) {
  const resolvedParams = use(params);
  const rawId = decodeURIComponent(resolvedParams.id || '').toUpperCase().trim();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const { orders, trips, drivers, vehicles, customers } = useStore();

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        Loading shipment telemetry...
      </div>
    );
  }

  // Find corresponding order and trip
  const order = orders.find(
    (o) => o.id.toUpperCase() === rawId || trips.some((t) => t.id.toUpperCase() === rawId && t.orderId === o.id)
  ) || null;

  const trip = trips.find(
    (t) => t.id.toUpperCase() === rawId || (order && t.orderId === order.id)
  ) || null;

  const driver = trip ? drivers.find((d) => d.id === trip.driverId) || null : null;
  const vehicle = trip ? vehicles.find((v) => v.id === trip.vehicleId) || null : null;
  const customer = order ? customers.find((c) => c.id === order.customerId) || null : null;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Public tracking link copied to clipboard!');
    }
  };

  if (!order && !trip) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15,23,42,0.8)' }}>
          <Link href="/track" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Tracking
          </Link>
          <span style={{ fontWeight: 800, fontSize: 16 }}>
            Logi<span style={{ color: '#38bdf8' }}>Flow</span>
          </span>
        </header>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <AlertTriangle size={32} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Shipment ID Not Found</h2>
          <p style={{ color: '#94a3b8', maxWidth: 440, marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
            We could not locate any active or archived freight matching <code style={{ color: '#38bdf8', fontFamily: 'var(--font-mono, monospace)' }}>{rawId}</code>. Please verify your tracking number.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link
              href="/track"
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                background: '#0284c7',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Search Another Waybill
            </Link>
            <Link
              href="/track/ORD-0995"
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.08)',
                color: '#e2e8f0',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              View Sample ORD-0995
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isDelivered = (trip && trip.status === 'Delivered') || (order && order.status === 'Delivered');
  const progressPercent = trip ? trip.progress : isDelivered ? 100 : 30;
  const originName = trip?.origin || order?.origin || 'Origin Terminal';
  const destName = trip?.destination || order?.destination || 'Destination Facility';
  const totalDistance = trip?.distance || order?.distance || 350;
  const distanceDone = Math.round((progressPercent / 100) * totalDistance);
  const distanceRemaining = Math.max(0, totalDistance - distanceDone);

  const checkpoints = trip?.checkpoints || [
    { name: `${originName} Dispatch`, location: 'Terminal Gate', passed: true, time: trip?.startedAt || '06:00 AM' },
    { name: 'Corridor Toll & Inspection Checkpoint', location: 'NH Highway Plaza', passed: progressPercent > 45, time: progressPercent > 45 ? '10:30 AM' : undefined },
    { name: `${destName} Facility Ingate`, location: 'Receiving Dock', passed: isDelivered, time: isDelivered ? (trip?.completedAt || 'Delivered') : undefined },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/track" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'color 0.2s' }}>
            <ArrowLeft size={16} /> Look Up Another
          </Link>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>
              Logi<span style={{ color: '#38bdf8' }}>Flow</span>
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>
              Live Consignee View
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleShare}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              padding: '6px 14px',
              color: '#e2e8f0',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <Share2 size={13} /> Share Link
          </button>
          <Link
            href="/login"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#38bdf8',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(56,189,248,0.1)',
              border: '1px solid rgba(56,189,248,0.25)',
            }}
          >
            Staff Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: 1000, margin: '0 auto', width: '100%', padding: '28px 20px' }}>
        {/* Status Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.7))',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '24px 28px',
          marginBottom: 24,
          boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                background: isDelivered ? 'rgba(52,211,153,0.15)' : 'rgba(56,189,248,0.15)',
                color: isDelivered ? '#34d399' : '#38bdf8',
                border: `1px solid ${isDelivered ? 'rgba(52,211,153,0.3)' : 'rgba(56,189,248,0.3)'}`,
              }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: isDelivered ? '#34d399' : '#38bdf8',
                  boxShadow: `0 0 8px ${isDelivered ? '#34d399' : '#38bdf8'}`,
                }} />
                {isDelivered ? 'DELIVERED & VERIFIED' : 'ACTIVE IN-TRANSIT CORRIDOR'}
              </span>
              <span style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'var(--font-mono, monospace)' }}>
                Waybill #{order?.id || trip?.orderId}
              </span>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px 0', letterSpacing: -0.5 }}>
              {originName.split(' ')[0]} ➔ {destName.split(' ')[0]}
            </h1>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              Consignee Account: <strong style={{ color: '#e2e8f0' }}>{customer?.name || 'Authorized Corporate Shipper'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Estimated Delivery (ETA)
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: isDelivered ? '#34d399' : '#38bdf8', fontFamily: 'var(--font-mono, monospace)' }}>
                {isDelivered ? 'Completed' : trip?.eta || 'Under 3 Hours'}
              </div>
            </div>

            <div style={{
              background: 'rgba(56,189,248,0.08)',
              border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: 16,
              padding: '12px 18px',
              textAlign: 'center',
              minWidth: 90
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono, monospace)', lineHeight: 1 }}>
                {progressPercent}%
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>
                Journey
              </div>
            </div>
          </div>
        </div>

        {/* 5-Stage Visual Progress Bar */}
        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          padding: '24px 20px',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Shipment Milestone Lifecycle
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, position: 'relative' }}>
            {[
              { label: 'Order Intake', stage: 1, done: true },
              { label: 'Allocated & Loaded', stage: 2, done: true },
              { label: 'Corridor Transit', stage: 3, done: true },
              { label: 'Out for Delivery', stage: 4, done: progressPercent >= 80 },
              { label: 'Delivered & POD', stage: 5, done: isDelivered },
            ].map((m, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: m.done ? '#0284c7' : 'rgba(255,255,255,0.06)',
                  border: `2px solid ${m.done ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                  color: m.done ? '#fff' : '#64748b',
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 8,
                  zIndex: 2,
                }}>
                  {m.done ? <CheckCircle2 size={16} /> : m.stage}
                </div>
                <span style={{ fontSize: 11, fontWeight: m.done ? 700 : 500, color: m.done ? '#e2e8f0' : '#64748b' }}>
                  {m.label}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            height: 4,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 4,
            marginTop: -38,
            marginBottom: 38,
            marginLeft: '10%',
            marginRight: '10%',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
              width: `${Math.min(100, Math.max(10, progressPercent))}%`,
              borderRadius: 4,
              transition: 'width 0.4s ease-out',
            }} />
          </div>
        </div>

        {/* 2-Column Grid: Left Checkpoints, Right Telematics & Driver */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Checkpoints Timeline */}
          <div style={{
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Corridor Transit Checkpoints</div>
              <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600, background: 'rgba(56,189,248,0.1)', padding: '2px 8px', borderRadius: 12 }}>
                {checkpoints.filter(c => c.passed).length} / {checkpoints.length} Cleared
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {checkpoints.map((cp, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: cp.passed ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${cp.passed ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                    flexShrink: 0
                  }}>
                    {cp.passed ? <CheckCircle2 size={14} color="#34d399" /> : <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: cp.passed ? 700 : 500, color: cp.passed ? '#f8fafc' : '#94a3b8' }}>
                        {cp.name}
                      </div>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono, monospace)', color: cp.passed ? '#34d399' : '#64748b', fontWeight: 600 }}>
                        {cp.time || 'Pending Arrival'}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{cp.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Telematics & Driver Profile */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Live Metrics */}
            <div style={{
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: 20,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Covered</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#e2e8f0', fontFamily: 'var(--font-mono, monospace)' }}>{distanceDone} km</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Remaining</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono, monospace)' }}>{distanceRemaining} km</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Speed</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: isDelivered ? '#64748b' : '#34d399', fontFamily: 'var(--font-mono, monospace)' }}>
                  {isDelivered ? '0 km/h' : `${trip?.speedKmH || 64} km/h`}
                </div>
              </div>
            </div>

            {/* Assigned Driver & Vehicle */}
            <div style={{
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: 20,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                Assigned Transporter & Driver
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 16,
                  color: '#fff'
                }}>
                  {driver?.name ? driver.name.slice(0, 2).toUpperCase() : 'DR'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{driver?.name || 'Verified Fleet Captain'}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    Vehicle: <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono, monospace)' }}>{vehicle?.vehicleNo || 'UP32-BN-8821'}</span> ({vehicle?.type || 'Heavy Cargo Liner'})
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <a
                  href={`tel:${driver?.phone || '+919876543210'}`}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(56,189,248,0.1)',
                    border: '1px solid rgba(56,189,248,0.25)',
                    color: '#38bdf8',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    textDecoration: 'none',
                    transition: 'background 0.2s',
                  }}
                >
                  <Phone size={13} /> Call Driver
                </a>
                <button
                  onClick={() => toast.info('Consignee Support Desk: +91 800-LOGIFLOW (Toll Free)')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#e2e8f0',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Help Desk
                </button>
              </div>
            </div>

            {/* Proof of Delivery (if completed) */}
            {isDelivered && (
              <div style={{
                background: 'rgba(52,211,153,0.06)',
                border: '1px solid rgba(52,211,153,0.25)',
                borderRadius: 16,
                padding: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FileCheck2 size={18} color="#34d399" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>
                    Signed Proof of Delivery (e-POD)
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                  Consignment successfully verified and signed by consignee receiving authority.
                </p>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono, monospace)', color: '#e2e8f0', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: 6, marginBottom: 12 }}>
                  Receiver: Authorized Receiving Dock • Verified: {trip?.completedAt || 'Today'}
                </div>
                <Link
                  href="/delivery"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#34d399',
                    textDecoration: 'none',
                  }}
                >
                  Inspect Complete Signature &amp; POD <ExternalLink size={12} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px', textAlign: 'center', fontSize: 12, color: '#64748b' }}>
        LogiFlow Real-Time Freight Telematics • Encrypted Live Consignee Gateway
      </footer>
    </div>
  );
}
