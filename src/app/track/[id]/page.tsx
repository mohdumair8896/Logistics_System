'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Phone,
  FileCheck2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { CopyButton } from '@/components/ui/CopyButton';
import { ShareButton } from '@/components/ui/ShareButton';
import { DotSpinner } from '@/components/ui/DotSpinner';
import { Avatar } from '@/components/ui/Avatar';
import { BadgeWithDot } from '@/components/ui/BadgeWithDot';

interface TrackingData {
  orderId: string;
  tripId: string | null;
  status: string;
  isDelivered: boolean;
  origin: string;
  destination: string;
  distance: number;
  progress: number;
  eta: string;
  startedAt: string | null;
  completedAt: string | null;
  speedKmH: number;
  customerName: string;
  driver: { name: string; phone: string } | null;
  vehicle: { vehicleNo: string; type: string } | null;
  checkpoints: { name: string; location: string; passed: boolean; time?: string }[];
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function PublicCustomerTrackingPage({ params }: Props) {
  const resolvedParams = use(params);
  const rawId = decodeURIComponent(resolvedParams.id || '').toUpperCase().trim();

  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    async function fetchTracking() {
      if (!rawId) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`/api/track/${encodeURIComponent(rawId)}`);
        if (!res.ok) {
          if (!isCancelled) {
            setNotFound(true);
            setData(null);
          }
          return;
        }
        const json = await res.json();
        if (!isCancelled) {
          setData(json);
          setNotFound(false);
        }
      } catch (err) {
        console.error('[PublicCustomerTrackingPage] fetch error:', err);
        if (!isCancelled) {
          setNotFound(true);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchTracking();
    return () => {
      isCancelled = true;
    };
  }, [rawId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface, #F8F7F4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mid, #525252)', gap: 14 }}>
        <DotSpinner size={36} color="var(--brand)" />
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-mid)', letterSpacing: '0.2px' }}>Syncing shipment telemetry…</span>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface, #F8F7F4)', color: 'var(--text-high, #141414)', display: 'flex', flexDirection: 'column' }}>
        <header style={{ borderBottom: '1px solid var(--border, #E6E4DF)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-1, #FFFFFF)' }}>
          <Link href="/track" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand, #0057FF)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Tracking
          </Link>
          <span style={{ fontWeight: 800, fontSize: 16 }}>
            Logi<span style={{ color: 'var(--brand, #0057FF)' }}>Flow</span>
          </span>
        </header>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(220,38,38,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <AlertTriangle size={32} color="#DC2626" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: 'var(--text-high, #141414)' }}>Shipment ID Not Found</h2>
          <p style={{ color: 'var(--text-mid, #525252)', maxWidth: 440, marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
            We could not locate any active or archived freight matching <code style={{ color: 'var(--brand, #0057FF)', fontFamily: 'var(--font-mono, monospace)', background: 'var(--surface-2, #F3F2EF)', padding: '2px 6px', borderRadius: 4 }}>{rawId}</code>. Please verify your tracking number.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link
              href="/track"
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                background: 'var(--brand, #0057FF)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0,87,255,0.25)',
              }}
            >
              Search Another Waybill
            </Link>
            <Link
              href="/track/ORD-0995"
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                background: 'var(--surface-1, #FFFFFF)',
                border: '1px solid var(--border, #E6E4DF)',
                color: 'var(--text-high, #141414)',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              View Sample ORD-0995
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isDelivered = data.isDelivered;
  const progressPercent = data.progress;
  const originName = data.origin;
  const destName = data.destination;
  const totalDistance = data.distance;
  const distanceDone = Math.round((progressPercent / 100) * totalDistance);
  const distanceRemaining = Math.max(0, totalDistance - distanceDone);
  const checkpoints = data.checkpoints;
  const driver = data.driver;
  const vehicle = data.vehicle;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface, #F8F7F4)', color: 'var(--text-high, #141414)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header style={{ borderBottom: '1px solid var(--border, #E6E4DF)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-1, #FFFFFF)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/track" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-mid, #525252)', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'color 0.2s' }}>
            <ArrowLeft size={16} /> Look Up Another
          </Link>
          <div style={{ width: 1, height: 20, background: 'var(--border, #E6E4DF)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>
              Logi<span style={{ color: 'var(--brand, #0057FF)' }}>Flow</span>
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,87,255,0.08)', color: 'var(--brand, #0057FF)', border: '1px solid rgba(0,87,255,0.2)' }}>
              Live Consignee View
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShareButton
            title={`Waybill #${data.orderId} Tracking`}
            text={`Live freight tracking for ${originName.split(' ')[0]} to ${destName.split(' ')[0]}:`}
          />
          <Link
            href="/login"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--brand, #0057FF)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(0,87,255,0.08)',
              border: '1px solid rgba(0,87,255,0.2)',
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
          background: 'var(--surface-1, #FFFFFF)',
          border: '1px solid var(--border, #E6E4DF)',
          borderRadius: 20,
          padding: '24px 28px',
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <BadgeWithDot
                color={isDelivered ? 'success' : 'brand'}
                pulse={!isDelivered}
                size="md"
              >
                {isDelivered ? 'DELIVERED & VERIFIED' : 'ACTIVE IN-TRANSIT CORRIDOR'}
              </BadgeWithDot>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text-low, #909090)', fontFamily: 'var(--font-mono, monospace)' }}>
                  Waybill #{data.orderId}
                </span>
                <CopyButton text={data.orderId} label="Waybill Number" variant="icon" size={12} />
              </div>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px 0', letterSpacing: -0.5, color: 'var(--text-high, #141414)' }}>
              {originName.split(' ')[0]} ➔ {destName.split(' ')[0]}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--text-mid, #525252)' }}>
              Consignee Account: <strong style={{ color: 'var(--text-high, #141414)' }}>{data.customerName}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-low, #909090)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Estimated Delivery (ETA)
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: isDelivered ? '#16A34A' : 'var(--brand, #0057FF)', fontFamily: 'var(--font-mono, monospace)' }}>
                {data.eta}
              </div>
            </div>

            <div style={{
              background: 'rgba(0,87,255,0.06)',
              border: '1px solid rgba(0,87,255,0.18)',
              borderRadius: 16,
              padding: '12px 18px',
              textAlign: 'center',
              minWidth: 90
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand, #0057FF)', fontFamily: 'var(--font-mono, monospace)', lineHeight: 1 }}>
                {progressPercent}%
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low, #909090)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>
                Journey
              </div>
            </div>
          </div>
        </div>

        {/* 5-Stage Visual Progress Bar */}
        <div style={{
          background: 'var(--surface-1, #FFFFFF)',
          border: '1px solid var(--border, #E6E4DF)',
          borderRadius: 16,
          padding: '24px 20px',
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-low, #909090)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
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
                  background: m.done ? 'var(--brand, #0057FF)' : 'var(--surface-2, #F3F2EF)',
                  border: `2px solid ${m.done ? 'var(--brand, #0057FF)' : 'var(--border, #E6E4DF)'}`,
                  color: m.done ? '#fff' : 'var(--text-low, #909090)',
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 8,
                  zIndex: 2,
                }}>
                  {m.done ? <CheckCircle2 size={16} /> : m.stage}
                </div>
                <span style={{ fontSize: 11, fontWeight: m.done ? 700 : 500, color: m.done ? 'var(--text-high, #141414)' : 'var(--text-low, #909090)' }}>
                  {m.label}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            height: 4,
            background: 'var(--surface-3, #E9E7E2)',
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
              background: 'linear-gradient(90deg, #0057FF, #3378FF)',
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
            background: 'var(--surface-1, #FFFFFF)',
            border: '1px solid var(--border, #E6E4DF)',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high, #141414)' }}>Corridor Transit Checkpoints</div>
              <span style={{ fontSize: 11, color: 'var(--brand, #0057FF)', fontWeight: 600, background: 'rgba(0,87,255,0.08)', padding: '2px 8px', borderRadius: 12 }}>
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
                    background: cp.passed ? 'rgba(22,163,74,0.1)' : 'var(--surface-2, #F3F2EF)',
                    border: `1px solid ${cp.passed ? '#16A34A' : 'var(--border, #E6E4DF)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                    flexShrink: 0
                  }}>
                    {cp.passed ? <CheckCircle2 size={14} color="#16A34A" /> : <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-low, #909090)' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: cp.passed ? 700 : 500, color: cp.passed ? 'var(--text-high, #141414)' : 'var(--text-mid, #525252)' }}>
                        {cp.name}
                      </div>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono, monospace)', color: cp.passed ? '#16A34A' : 'var(--text-low, #909090)', fontWeight: 600 }}>
                        {cp.time || 'Pending Arrival'}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-low, #909090)', marginTop: 2 }}>{cp.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Telematics & Driver Profile */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Live Metrics */}
            <div style={{
              background: 'var(--surface-1, #FFFFFF)',
              border: '1px solid var(--border, #E6E4DF)',
              borderRadius: 16,
              padding: 20,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-low, #909090)', textTransform: 'uppercase', marginBottom: 4 }}>Covered</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-high, #141414)', fontFamily: 'var(--font-mono, monospace)' }}>{distanceDone} km</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-low, #909090)', textTransform: 'uppercase', marginBottom: 4 }}>Remaining</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand, #0057FF)', fontFamily: 'var(--font-mono, monospace)' }}>{distanceRemaining} km</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-low, #909090)', textTransform: 'uppercase', marginBottom: 4 }}>Speed</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: isDelivered ? 'var(--text-low, #909090)' : '#16A34A', fontFamily: 'var(--font-mono, monospace)' }}>
                  {data.speedKmH} km/h
                </div>
              </div>
            </div>

            {/* Assigned Driver & Vehicle */}
            <div style={{
              background: 'var(--surface-1, #FFFFFF)',
              border: '1px solid var(--border, #E6E4DF)',
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-low, #909090)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                Assigned Transporter & Driver
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <Avatar
                  name={driver?.name || 'Verified Fleet Captain'}
                  size="lg"
                  status={isDelivered ? 'offline' : 'online'}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-high, #141414)' }}>{driver?.name || 'Verified Fleet Captain'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-mid, #525252)' }}>
                    Vehicle: <span style={{ color: 'var(--text-high, #141414)', fontFamily: 'var(--font-mono, monospace)' }}>{vehicle?.vehicleNo || 'UP32-BN-8821'}</span> ({vehicle?.type || 'Heavy Cargo Liner'})
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
                    background: 'rgba(0,87,255,0.08)',
                    border: '1px solid rgba(0,87,255,0.25)',
                    color: 'var(--brand, #0057FF)',
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
                    background: 'var(--surface-2, #F3F2EF)',
                    border: '1px solid var(--border, #E6E4DF)',
                    color: 'var(--text-high, #141414)',
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
                background: 'rgba(22,163,74,0.06)',
                border: '1px solid rgba(22,163,74,0.25)',
                borderRadius: 16,
                padding: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FileCheck2 size={18} color="#16A34A" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>
                    Signed Proof of Delivery (e-POD)
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-mid, #525252)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                  Consignment successfully verified and signed by consignee receiving authority.
                </p>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-high, #141414)', background: 'var(--surface-1, #FFFFFF)', border: '1px solid rgba(22,163,74,0.2)', padding: '6px 10px', borderRadius: 6, marginBottom: 12 }}>
                  Receiver: Authorized Receiving Dock • Verified: {data.completedAt || 'Today'}
                </div>
                <Link
                  href="/delivery"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#16A34A',
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
      <footer style={{ borderTop: '1px solid var(--border, #E6E4DF)', padding: '20px', textAlign: 'center', fontSize: 12, color: 'var(--text-low, #909090)', background: 'var(--surface, #F8F7F4)' }}>
        LogiFlow Real-Time Freight Telematics • Encrypted Live Consignee Gateway
      </footer>
    </div>
  );
}
