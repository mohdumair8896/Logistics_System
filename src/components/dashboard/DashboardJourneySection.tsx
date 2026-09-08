'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { initialCustomers, initialProducts, initialInventory } from '@/lib/mockData';
import {
  ShoppingCart, Truck, User, Warehouse, Navigation,
  Radio, MapPin, PackageCheck, Receipt, CheckCircle,
  ChevronDown, ExternalLink
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const TOTAL_FRAMES = 249;
const READY_TIMEOUT_MS = 2000;
const JOURNEY_HEIGHT_VH = 520; // total scroll track in vh

// ─── Stage definitions ────────────────────────────────────────────────────────
const STAGE_RANGES = [
  { id: 0,  key: 'hero',       label: 'JOURNEY',      start: 0.00, end: 0.07 },
  { id: 1,  key: 'order',      label: 'ORDER',        start: 0.07, end: 0.17 },
  { id: 2,  key: 'analysis',   label: 'ANALYSIS',     start: 0.17, end: 0.26 },
  { id: 3,  key: 'vehicle',    label: 'VEHICLE',      start: 0.26, end: 0.35 },
  { id: 4,  key: 'driver',     label: 'DRIVER',       start: 0.35, end: 0.44 },
  { id: 5,  key: 'loading',    label: 'LOADING',      start: 0.44, end: 0.53 },
  { id: 6,  key: 'dispatch',   label: 'DISPATCH',     start: 0.53, end: 0.62 },
  { id: 7,  key: 'transit',    label: 'TRANSIT',      start: 0.62, end: 0.71 },
  { id: 8,  key: 'checkpoints',label: 'CHECKPOINTS',  start: 0.71, end: 0.80 },
  { id: 9,  key: 'arrival',    label: 'ARRIVAL',      start: 0.80, end: 0.87 },
  { id: 10, key: 'delivery',   label: 'DELIVERY',     start: 0.87, end: 0.93 },
  { id: 11, key: 'invoice',    label: 'INVOICE',      start: 0.93, end: 1.00 },
];

function getActiveStage(p: number) {
  for (let i = STAGE_RANGES.length - 1; i >= 0; i--) {
    if (p >= STAGE_RANGES[i].start) return i;
  }
  return 0;
}

// ─── Stage card component ─────────────────────────────────────────────────────
interface StageCardProps {
  icon: React.ReactNode;
  stageNum: string;
  title: string;
  tag: string;
  tagColor: string;
  children: React.ReactNode;
  visible: boolean;
}

function StageCard({ icon, stageNum, title, tag, tagColor, children, visible }: StageCardProps) {
  return (
    <div style={{
      maxWidth: 520, width: '100%',
      background: 'rgba(15,23,42,0.85)',
      border: '1px solid rgba(255,255,255,0.12)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderRadius: 24,
      padding: 'clamp(16px, 3vw, 28px)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
      position: 'relative', overflow: 'hidden',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      {/* Accent top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: tagColor, transition: 'background 0.4s',
      }} />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            padding: 10,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, flexShrink: 0,
          }}>{icon}</div>
          <div>
            <div style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>
              Stage {stageNum}
            </div>
            <h3 style={{ fontSize: 'clamp(15px, 2vw, 20px)', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: -0.5, lineHeight: 1.2 }}>
              {title}
            </h3>
          </div>
        </div>
        <span style={{
          fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
          padding: '4px 12px', borderRadius: 99,
          color: tagColor, border: `1px solid ${tagColor}50`,
          background: `${tagColor}18`, whiteSpace: 'nowrap',
        }}>{tag}</span>
      </div>
      {children}
    </div>
  );
}

function DataRow({ label, value, mono, color }: { label: string; value: string | number; mono?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: color || '#f1f5f9', fontFamily: mono ? 'monospace' : undefined }}>{value}</span>
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>Utilization</span>
        <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'monospace' }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.6s' }} />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DashboardJourneySection() {
  const router = useRouter();
  const { trips, vehicles, drivers, orders, invoices } = useStore();

  const canvasRef   = useRef<HTMLCanvasElement | null>(null);
  const imagesRef   = useRef<HTMLImageElement[]>([]);
  const isReadyRef  = useRef(false);
  const targetProg  = useRef(0);
  const currentProg = useRef(0);
  const rafId       = useRef<number | null>(null);
  const trackRef    = useRef<HTMLDivElement | null>(null);

  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady,     setIsReady]     = useState(false);
  const [hasFrames,   setHasFrames]   = useState(false);
  const [progress,    setProgress]    = useState(0);

  // ── Derive "featured" journey from store ─────────────────────────────────
  // Prefer an active "In Transit" trip; fall back to first delivered
  const featuredTrip =
    trips.find(t => t.status === 'In Transit') ??
    trips.find(t => t.status === 'Delivered') ??
    null;

  const featuredOrder   = featuredTrip ? orders.find(o => o.id === featuredTrip.orderId) ?? null : null;
  const featuredVehicle = featuredTrip ? vehicles.find(v => v.id === featuredTrip.vehicleId) ?? null : null;
  const featuredDriver  = featuredTrip ? drivers.find(d => d.id === featuredTrip.driverId) ?? null : null;
  const featuredCustomer = featuredOrder ? initialCustomers.find(c => c.id === featuredOrder.customerId) ?? null : null;
  const featuredInvoice  = featuredOrder ? invoices.find(inv => inv.orderId === featuredOrder.id) ?? null : null;

  const distDone = featuredTrip ? Math.round((featuredTrip.progress / 100) * featuredTrip.distance) : 0;
  const utilPct  = (featuredVehicle && featuredOrder)
    ? Math.round((featuredOrder.totalWeight / featuredVehicle.capacity) * 100) : 0;

  const activeStageIdx = getActiveStage(progress);

  // ── Canvas + scroll engine (scoped to .page-content) ─────────────────────
  useEffect(() => {
    let mounted = true;
    const canvas = canvasRef.current;
    const track  = trackRef.current;
    if (!canvas || !track) return;

    // Scroll container is .page-content
    const scrollEl = track.closest('.page-content') as HTMLElement | null;

    const renderFrame = (p: number) => {
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;
      const w = canvas.width, h = canvas.height;
      if (!w || !h) return;
      const idx = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(p * (TOTAL_FRAMES - 1))));
      const img = imagesRef.current[idx];
      if (img?.complete && img.naturalWidth > 0) {
        const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        const sw = img.naturalWidth * scale, sh = img.naturalHeight * scale;
        ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh);
      } else {
        const grd = ctx.createLinearGradient(0, 0, 0, h);
        grd.addColorStop(0, '#020617'); grd.addColorStop(0.4, '#0c1a35'); grd.addColorStop(1, '#020617');
        ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
      }
    };

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width  = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      renderFrame(currentProg.current);
    };

    const handleScroll = () => {
      const el = scrollEl || window as unknown as HTMLElement;
      const scrollTop    = 'scrollTop' in el ? (el as HTMLElement).scrollTop : window.scrollY;
      const trackTop     = track.offsetTop;
      const trackHeight  = track.offsetHeight;
      const viewportH    = window.innerHeight;
      const scrollable   = trackHeight - viewportH;
      const scrolled     = scrollTop - trackTop;
      targetProg.current = Math.min(1, Math.max(0, scrollable > 0 ? scrolled / scrollable : 0));
    };

    const animate = () => {
      currentProg.current += (targetProg.current - currentProg.current) * 0.15;
      if (mounted) setProgress(currentProg.current);
      renderFrame(currentProg.current);
      rafId.current = requestAnimationFrame(animate);
    };

    handleResize();
    handleScroll();
    window.addEventListener('resize', handleResize);
    const scrollTarget: EventTarget = scrollEl ?? window;
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true } as AddEventListenerOptions);
    rafId.current = requestAnimationFrame(animate);

    const markReady = () => {
      if (!isReadyRef.current && mounted) {
        isReadyRef.current = true;
        setIsReady(true);
      }
    };
    const safetyTimer = setTimeout(markReady, READY_TIMEOUT_MS);

    // Preload frames
    let responded = 0, successes = 0;
    const images: HTMLImageElement[] = [];
    const onResponse = (ok: boolean) => {
      if (!mounted) return;
      responded++; if (ok) successes++;
      setLoadedCount(responded);
      if (successes >= 15) { if (mounted) setHasFrames(true); markReady(); }
      if (responded >= TOTAL_FRAMES) markReady();
    };
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `/frames/frame_${String(i).padStart(3, '0')}.webp`;
      img.onload  = () => onResponse(true);
      img.onerror = () => onResponse(false);
      images.push(img);
    }
    imagesRef.current = images;

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      window.removeEventListener('resize', handleResize);
      scrollTarget.removeEventListener('scroll', handleScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
  const hudVisible = progress > 0.04;

  const scrollToOps = () => {
    const el = document.getElementById('dashboard-ops-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollIntoJourney = () => {
    const el = trackRef.current;
    const scrollEl = el?.closest('.page-content') as HTMLElement | null;
    if (!el) return;
    const target = el.offsetTop + window.innerHeight * 0.8;
    if (scrollEl) { scrollEl.scrollTo({ top: target, behavior: 'smooth' }); }
    else { window.scrollTo({ top: target, behavior: 'smooth' }); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={trackRef}
      id="dashboard-journey-track"
      style={{ position: 'relative', height: `${JOURNEY_HEIGHT_VH}vh`, width: '100%' }}
    >
      {/* Sticky viewport-height canvas viewport */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden' }}>

        {/* Deep-space fallback glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 110% 70% at 50% 20%, #0d2a4a 0%, #020617 60%)',
          opacity: hasFrames ? 0 : 1, transition: 'opacity 1s',
        }} />

        {/* Canvas */}
        <canvas ref={canvasRef} role="img"
          aria-label="Cinematic logistics journey animation"
          style={{
            position: 'absolute', inset: 0, display: 'block', pointerEvents: 'none',
            opacity: (isReady && hasFrames) ? 1 : 0,
            transition: 'opacity 1.2s ease',
          }}
        />

        {/* Cinematic vignette */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
          background: 'linear-gradient(to top, rgba(2,6,23,0.95) 0%, transparent 40%, rgba(2,6,23,0.4) 100%)',
        }} />

        {/* Loading screen */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: '#020617',
          opacity: isReady ? 0 : 1, pointerEvents: isReady ? 'none' : 'auto',
          transition: 'opacity 0.7s ease',
        }}>
          <div style={{ position: 'relative', marginBottom: 28 }}>
            <div style={{ position: 'absolute', inset: -12, borderRadius: 28, background: 'rgba(245,158,11,0.1)', filter: 'blur(16px)' }} />
            <div style={{
              position: 'relative', width: 64, height: 64, borderRadius: 20,
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 22, color: '#fbbf24',
            }}>LF</div>
          </div>
          <div style={{ textAlign: 'center', width: 240 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
              Loading Journey Engine
            </p>
            <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${hasFrames ? pct : Math.min(pct + 30, 96)}%`,
                background: 'linear-gradient(90deg, #f59e0b, #fde68a)',
                borderRadius: 99, transition: 'width 0.5s ease',
              }} />
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', marginTop: 8 }}>
              {loadedCount} / {TOTAL_FRAMES} • {pct}%
            </p>
          </div>
        </div>

        {/* ── HERO overlay (stage 0) ── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          opacity: isReady ? Math.max(0, 1 - progress * 16) : 0,
          pointerEvents: (!isReady || progress > 0.07) ? 'none' : 'auto',
          transition: 'opacity 0.15s',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start',
          padding: 'clamp(24px, 5vw, 64px)',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 99,
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            fontSize: 11, fontWeight: 700, color: '#fbbf24',
            textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
            The Shipment Lifecycle
          </div>
          <h2 style={{
            fontSize: 'clamp(32px, 5vw, 62px)', fontWeight: 900, letterSpacing: -2, lineHeight: 1.1,
            color: '#fff', margin: '0 0 16px', textShadow: '0 2px 20px rgba(0,0,0,0.6)', maxWidth: 640,
          }}>
            From Order to Invoice —{' '}
            <span style={{ background: 'linear-gradient(90deg,#fbbf24,#fde68a,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              One Complete Journey.
            </span>
          </h2>
          <p style={{ fontSize: 'clamp(13px, 1.4vw, 16px)', color: '#cbd5e1', lineHeight: 1.7, maxWidth: 480, margin: '0 0 28px' }}>
            Follow shipment <strong style={{ color: '#fbbf24', fontFamily: 'monospace' }}>
              {featuredTrip?.id ?? 'TRP-1001'}
            </strong> through every stage of your logistics network — allocation, dispatch, live transit, and financial settlement.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={scrollIntoJourney} style={{
              padding: '12px 24px', borderRadius: 14,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#1c1917', fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 0 30px rgba(245,158,11,0.35)',
            }}>
              Start Journey <ChevronDown size={16} />
            </button>
            <button onClick={scrollToOps} style={{
              padding: '12px 20px', borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)',
              color: '#f8fafc', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            }}>
              Skip to Dashboard ↓
            </button>
          </div>
        </div>

        {/* ── Stage HUD overlay (stages 1–11) ── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 15,
          opacity: hudVisible ? 1 : 0,
          transition: 'opacity 0.4s',
          pointerEvents: hudVisible ? 'auto' : 'none',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: 'clamp(16px, 3vw, 40px)',
        }}>
          {/* Top: telemetry ticker */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
            opacity: hudVisible ? 1 : 0,
            transform: hudVisible ? 'translateY(0)' : 'translateY(-12px)',
            transition: 'opacity 0.5s, transform 0.5s',
          }}>
            <div style={{
              background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)', padding: '8px 16px', borderRadius: 16,
              display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'monospace', fontSize: 11, color: '#d4d4d8',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 8px #34d399' }} />
              <span style={{ color: '#fff', fontWeight: 700 }}>{featuredTrip?.id ?? 'TRP-1001'}</span>
              <span style={{ color: '#94a3b8' }}>|</span>
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>{Math.round(progress * 100)}% JOURNEY</span>
              {featuredTrip && (
                <>
                  <span style={{ color: '#94a3b8' }}>|</span>
                  <span style={{ color: '#22d3ee', fontWeight: 700 }}>{featuredTrip.progress}% ROUTE</span>
                </>
              )}
            </div>

            {/* Stage nav dots */}
            <div style={{
              background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)', padding: '8px 14px', borderRadius: 16,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {STAGE_RANGES.filter(s => s.id > 0).map(s => (
                <div key={s.id} title={s.label} style={{
                  width: activeStageIdx === s.id ? 20 : 6, height: 6, borderRadius: 99,
                  background: activeStageIdx === s.id ? '#f59e0b' : activeStageIdx > s.id ? '#34d399' : 'rgba(255,255,255,0.15)',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>

            {/* Quick telemetry gauges */}
            {featuredTrip && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { label: `${featuredTrip.speedKmH ?? 68} km/h`, color: '#22d3ee' },
                  { label: `${featuredTrip.fuelPercent ?? 78}% fuel`, color: '#34d399' },
                  { label: featuredTrip.cargoTemp?.split(' ')[0] ?? '21.5°C', color: '#fbbf24' },
                ].map(({ label, color }, i) => (
                  <div key={i} style={{
                    background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(20px)', padding: '6px 12px', borderRadius: 12,
                    fontFamily: 'monospace', fontSize: 11, color, fontWeight: 700,
                  }}>{label}</div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom: stage card */}
          <div style={{ maxWidth: 520, width: '100%' }}>
            {/* Stage 01 — Order Created */}
            <StageCard
              stageNum="01 / 11" title="Order Created" tag="CONFIRMED" tagColor="#f59e0b"
              icon={<ShoppingCart size={20} color="#fbbf24" />}
              visible={activeStageIdx === 1}
            >
              <DataRow label="Order ID" value={featuredOrder?.id ?? 'ORD-0995'} mono color="#fbbf24" />
              <DataRow label="Customer" value={featuredCustomer?.name ?? 'Global Exports Corp'} />
              <DataRow label="Origin" value={featuredOrder?.origin ?? 'Lucknow Central Hub'} />
              <DataRow label="Destination" value={featuredOrder?.destination ?? 'Delhi NCR Hub'} />
              <DataRow label="Total Weight" value={`${(featuredOrder?.totalWeight ?? 9000).toLocaleString()} kg`} mono />
              <DataRow label="Deadline" value={featuredOrder?.deadline ?? 'Today 22:00'} color="#fb7185" />
            </StageCard>

            {/* Stage 02 — Order Analysis / Truck Matching */}
            <StageCard
              stageNum="02 / 11" title="Truck Matching Analysis" tag="WEIGHT MATCHED" tagColor="#22d3ee"
              icon={<Truck size={20} color="#22d3ee" />}
              visible={activeStageIdx === 2}
            >
              <p style={{ fontSize: 12.5, color: '#94a3b8', marginBottom: 12 }}>
                System evaluated all available vehicles against shipment weight, route distance, and current load. Optimal vehicle selected based on capacity and fuel level.
              </p>
              <DataRow label="Shipment Weight" value={`${(featuredOrder?.totalWeight ?? 9000).toLocaleString()} kg`} mono />
              <DataRow label="Matched Vehicle" value={featuredVehicle?.vehicleNo ?? 'UP32 CD 5678'} mono color="#22d3ee" />
              <DataRow label="Vehicle Capacity" value={`${(featuredVehicle?.capacity ?? 7000).toLocaleString()} kg`} mono />
              <DataRow label="Available Capacity" value={`${((featuredVehicle?.capacity ?? 7000) - (featuredOrder?.totalWeight ?? 9000)).toLocaleString()} kg`} mono />
              <div style={{ marginTop: 12 }}>
                <ProgressBar value={featuredOrder?.totalWeight ?? 6200} max={featuredVehicle?.capacity ?? 7000} color="#22d3ee" />
              </div>
            </StageCard>

            {/* Stage 03 — Vehicle Allocated */}
            <StageCard
              stageNum="03 / 11" title="Vehicle Allocated" tag="DISPATCHING" tagColor="#38bdf8"
              icon={<Truck size={20} color="#38bdf8" />}
              visible={activeStageIdx === 3}
            >
              <DataRow label="Vehicle No." value={featuredVehicle?.vehicleNo ?? 'UP32 CD 5678'} mono color="#38bdf8" />
              <DataRow label="Type" value={featuredVehicle?.type ?? 'Medium Truck'} />
              <DataRow label="Capacity" value={`${(featuredVehicle?.capacity ?? 7000).toLocaleString()} kg`} mono />
              <DataRow label="Fuel Level" value={`${featuredVehicle?.fuelLevel ?? 64}%`} mono color="#34d399" />
              <DataRow label="Odometer" value={`${(featuredVehicle?.odometerKm ?? 62100).toLocaleString()} km`} mono />
              <DataRow label="Status" value={featuredVehicle?.status ?? 'In Transit'} color="#22d3ee" />
              <div style={{ marginTop: 12 }}>
                <ProgressBar value={featuredOrder?.totalWeight ?? 6200} max={featuredVehicle?.capacity ?? 7000} color="#38bdf8" />
              </div>
            </StageCard>

            {/* Stage 04 — Driver Assigned */}
            <StageCard
              stageNum="04 / 11" title="Driver Assigned" tag="ON DUTY" tagColor="#a78bfa"
              icon={<User size={20} color="#a78bfa" />}
              visible={activeStageIdx === 4}
            >
              <DataRow label="Driver" value={featuredDriver?.name ?? 'Ravi Kumar'} />
              <DataRow label="Driver ID" value={featuredDriver?.id ?? 'D002'} mono color="#a78bfa" />
              <DataRow label="Vehicle" value={featuredVehicle?.vehicleNo ?? 'UP32 CD 5678'} mono />
              <DataRow label="License" value={featuredDriver?.licenseNo ?? 'DL-834-ABC'} mono />
              <DataRow label="Rating" value={`⭐ ${featuredDriver?.rating ?? 4.6} / 5.0`} />
              <DataRow label="Trips Completed" value={featuredDriver?.trips ?? 98} />
              <DataRow label="Doc Verified" value={featuredDriver?.documentVerified ? '✓ Verified' : 'Pending'} color={featuredDriver?.documentVerified ? '#34d399' : '#fb7185'} />
            </StageCard>

            {/* Stage 05 — Warehouse Loading */}
            <StageCard
              stageNum="05 / 11" title="Warehouse Loading" tag="LOADING BAY" tagColor="#f59e0b"
              icon={<Warehouse size={20} color="#fbbf24" />}
              visible={activeStageIdx === 5}
            >
              <DataRow label="Loading Bay" value={featuredOrder?.loadingBay ? `Bay ${featuredOrder.loadingBay}` : 'Bay 1'} />
              <DataRow label="Total Loaded" value={`${(featuredOrder?.totalWeight ?? 9000).toLocaleString()} kg`} mono color="#34d399" />
              {featuredOrder?.items.map((item, idx) => {
                const product = initialProducts.find(p => p.id === item.productId);
                const inv = initialInventory.find(i => i.productId === item.productId);
                return (
                  <DataRow
                    key={idx}
                    label={product?.name ?? item.productId}
                    value={`${item.quantity.toLocaleString()} kg · ${inv?.bay ?? '—'}`}
                    mono
                  />
                );
              })}
              <div style={{ marginTop: 12 }}>
                <ProgressBar value={featuredOrder?.totalWeight ?? 9000} max={featuredVehicle?.capacity ?? 7000} color="#f59e0b" />
              </div>
            </StageCard>

            {/* Stage 06 — Dispatch */}
            <StageCard
              stageNum="06 / 11" title="Dispatched from Hub" tag="GATE CLEARED" tagColor="#34d399"
              icon={<Navigation size={20} color="#34d399" />}
              visible={activeStageIdx === 6}
            >
              <DataRow label="Trip ID" value={featuredTrip?.id ?? 'TRP-1001'} mono color="#34d399" />
              <DataRow label="Origin" value={featuredTrip?.origin ?? 'Lucknow Central Hub'} />
              <DataRow label="Destination" value={featuredTrip?.destination ?? 'Delhi NCR Hub'} />
              <DataRow label="Departure" value={featuredTrip?.startedAt ?? '2026-08-31 06:00'} mono />
              <DataRow label="Distance" value={`${featuredTrip?.distance ?? 512} km`} mono />
              <DataRow label="Load" value={`${(featuredTrip?.load ?? 9000).toLocaleString()} kg`} mono />
            </StageCard>

            {/* Stage 07 — Live Transit */}
            <StageCard
              stageNum="07 / 11" title="Live Transit" tag="SIMULATED GPS" tagColor="#22d3ee"
              icon={<Radio size={20} color="#22d3ee" />}
              visible={activeStageIdx === 7}
            >
              <p style={{ fontSize: 10.5, color: '#94a3b8', marginBottom: 10, fontStyle: 'italic' }}>
                ⚠ Telemetry data is simulated for demonstration. Not real GPS.
              </p>
              <DataRow label="Route Progress" value={`${featuredTrip?.progress ?? 58}%`} mono color="#22d3ee" />
              <DataRow label="Distance Covered" value={`${distDone} km`} mono color="#34d399" />
              <DataRow label="Remaining" value={`${(featuredTrip?.distance ?? 512) - distDone} km`} mono />
              <DataRow label="Speed" value={`${featuredTrip?.speedKmH ?? 68} km/h`} mono color="#22d3ee" />
              <DataRow label="Fuel" value={`${featuredTrip?.fuelPercent ?? 64}%`} mono color="#34d399" />
              <DataRow label="Cargo Temp" value={featuredTrip?.cargoTemp ?? '21.5°C Ambient'} />
              <DataRow label="ETA" value={featuredTrip?.eta ?? '3h 15min'} color="#fbbf24" />
            </StageCard>

            {/* Stage 08 — Checkpoints */}
            <StageCard
              stageNum="08 / 11" title="Route Checkpoints" tag="CORRIDOR" tagColor="#38bdf8"
              icon={<MapPin size={20} color="#38bdf8" />}
              visible={activeStageIdx === 8}
            >
              {(featuredTrip?.checkpoints ?? []).map((cp, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: cp.passed ? '#34d399' : 'rgba(255,255,255,0.12)',
                    border: cp.passed ? 'none' : '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9,
                  }}>
                    {cp.passed && '✓'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: cp.passed ? '#f1f5f9' : '#64748b' }}>{cp.name}</div>
                    <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 1 }}>
                      {cp.location} {cp.time && <span style={{ color: '#34d399', marginLeft: 6, fontFamily: 'monospace' }}>{cp.time}</span>}
                    </div>
                  </div>
                  {!cp.passed && <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>Pending</span>}
                </div>
              ))}
            </StageCard>

            {/* Stage 09 — Arrival */}
            <StageCard
              stageNum="09 / 11" title="Arrival at Destination" tag={featuredTrip?.progress === 100 ? 'CONFIRMED' : 'EN ROUTE'} tagColor={featuredTrip?.progress === 100 ? '#34d399' : '#94a3b8'}
              icon={<CheckCircle size={20} color={featuredTrip?.progress === 100 ? '#34d399' : '#94a3b8'} />}
              visible={activeStageIdx === 9}
            >
              {featuredTrip?.progress === 100 ? (
                <>
                  <DataRow label="Arrived At" value={featuredTrip?.destination ?? '—'} color="#34d399" />
                  <DataRow label="Arrival Time" value={featuredTrip?.completedAt ?? '—'} mono />
                  <DataRow label="Distance" value={`${featuredTrip?.distance ?? 0} km`} mono />
                  <DataRow label="Geofence" value={featuredTrip?.geofenceStatus ?? 'Arrived'} color="#34d399" />
                </>
              ) : (
                <div style={{ padding: '12px 0', color: '#64748b', fontSize: 13, textAlign: 'center' }}>
                  Shipment is currently <strong style={{ color: '#22d3ee' }}>in transit</strong> — {featuredTrip?.progress ?? 58}% complete.{' '}
                  ETA: <strong style={{ color: '#fbbf24', fontFamily: 'monospace' }}>{featuredTrip?.eta ?? '3h 15min'}</strong>
                </div>
              )}
            </StageCard>

            {/* Stage 10 — Delivery & POD */}
            <StageCard
              stageNum="10 / 11" title="Delivery & Proof of Delivery" tag={featuredInvoice?.podSigned ? 'POD SIGNED' : 'PENDING'} tagColor={featuredInvoice?.podSigned ? '#34d399' : '#f59e0b'}
              icon={<PackageCheck size={20} color={featuredInvoice?.podSigned ? '#34d399' : '#fbbf24'} />}
              visible={activeStageIdx === 10}
            >
              <DataRow label="Receiver" value={featuredInvoice?.receiverName ?? '—'} />
              <DataRow label="Order" value={featuredOrder?.id ?? '—'} mono />
              <DataRow label="Total Delivered" value={`${(featuredOrder?.totalWeight ?? 0).toLocaleString()} kg`} mono color="#34d399" />
              <DataRow label="Delivery Status" value={featuredOrder?.status ?? '—'} color={featuredOrder?.status === 'Delivered' ? '#34d399' : '#22d3ee'} />
              <DataRow label="Digital POD" value={featuredInvoice?.podSigned ? '✓ Signed' : 'Pending Signature'} color={featuredInvoice?.podSigned ? '#34d399' : '#fbbf24'} />
              <button onClick={() => router.push('/delivery')}
                style={{
                  marginTop: 14, width: '100%', padding: '9px 0', borderRadius: 10,
                  background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
                  color: '#34d399', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                <ExternalLink size={13} /> Open e-POD Module
              </button>
            </StageCard>

            {/* Stage 11 — Invoice */}
            <StageCard
              stageNum="11 / 11" title="Invoice & Settlement" tag={featuredInvoice?.status ?? 'PENDING'} tagColor={featuredInvoice?.status === 'Paid' ? '#34d399' : '#f59e0b'}
              icon={<Receipt size={20} color={featuredInvoice?.status === 'Paid' ? '#34d399' : '#fbbf24'} />}
              visible={activeStageIdx === 11}
            >
              {featuredInvoice ? (
                <>
                  <DataRow label="Invoice ID" value={featuredInvoice.id} mono color="#fbbf24" />
                  <DataRow label="Freight" value={`₹${featuredInvoice.freight.toLocaleString()}`} mono />
                  <DataRow label="Loading" value={`₹${featuredInvoice.loading.toLocaleString()}`} mono />
                  <DataRow label="Unloading" value={`₹${featuredInvoice.unloading.toLocaleString()}`} mono />
                  <DataRow label="GST (18%)" value={`₹${featuredInvoice.gst.toLocaleString()}`} mono color="#fbbf24" />
                  <div style={{ borderTop: '2px solid rgba(245,158,11,0.3)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>Total</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 900, color: '#fbbf24' }}>₹{featuredInvoice.total.toLocaleString()}</span>
                  </div>
                  <button onClick={() => router.push('/invoices')}
                    style={{
                      marginTop: 14, width: '100%', padding: '9px 0', borderRadius: 10,
                      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                      color: '#fbbf24', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                    <ExternalLink size={13} /> View Full Invoice
                  </button>
                </>
              ) : (
                <div style={{ padding: '12px 0', color: '#64748b', fontSize: 13, textAlign: 'center' }}>
                  Invoice will be generated after delivery confirmation and POD sign-off.
                </div>
              )}
            </StageCard>
          </div>
        </div>

        {/* Scroll hint (hero only) */}
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 25,
          opacity: isReady ? Math.max(0, 1 - progress * 20) : 0,
          transition: 'opacity 0.3s',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: 3, color: '#64748b', textTransform: 'uppercase' }}>
            Scroll to explore journey
          </span>
          <div style={{ animation: 'bounce 1.5s infinite', color: '#f59e0b', fontSize: 18 }}>↓</div>
        </div>
      </div>
    </div>
  );
}
