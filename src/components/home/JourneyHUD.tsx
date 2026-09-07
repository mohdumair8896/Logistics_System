'use client';

import React from 'react';
import {
  Boxes,
  Warehouse,
  CloudSun,
  RadioTower,
  CheckCircle2,
  Gauge,
  Thermometer,
  Compass,
} from 'lucide-react';

const glass = {
  background: 'rgba(15,23,42,0.75)',
  border: '1px solid rgba(255,255,255,0.1)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
} as const;

export interface StageData {
  id: number;
  label: string;
  sub: string;
  tag: string;
  desc: string;
  metrics: { label: string; value: string }[];
  color: string;
  icon: React.ReactNode;
}

export const JOURNEY_STAGES: StageData[] = [
  {
    id: 0,
    label: 'Origin Warehouse Induction',
    sub: 'Bay 04 • Autonomous AMR Sorting',
    tag: 'RFID SCANNED',
    desc: 'Pallet barcode validated by high-speed robotic scanner. Optimal multi-stop trailer slot dynamically assigned.',
    color: '#F59E0B',
    icon: <Boxes style={{ width: 20, height: 20, color: '#fbbf24' }} />,
    metrics: [
      { label: 'Sort Rate', value: '1,420/hr' },
      { label: 'Weight Verified', value: '840 kg' },
      { label: 'Consolidation', value: '98.4%' },
    ],
  },
  {
    id: 1,
    label: 'Hub Cross-Dock Departure',
    sub: 'Dispatch Terminal • Outbound Freight',
    tag: 'GATE CLEARED',
    desc: 'Roll-up bay opened. Class-8 electric hauler departs hub with automated digital manifest and customs pre-clearance.',
    color: '#22D3EE',
    icon: <Warehouse style={{ width: 20, height: 20, color: '#22d3ee' }} />,
    metrics: [
      { label: 'Gate Clearance', value: '0.4s (NFC)' },
      { label: 'Outbound Bay', value: 'Bay 12-East' },
      { label: 'Trailer PSI', value: '110 PSI Norm' },
    ],
  },
  {
    id: 2,
    label: 'Interstate Skyway Transit',
    sub: 'Corridor Alpha • Dynamic AI Rerouting',
    tag: 'IN TRANSIT',
    desc: 'Long-haul high-speed corridor engaged. Real-time telematics monitors weather, traffic bottlenecks, and battery reserve.',
    color: '#38BDF8',
    icon: <CloudSun style={{ width: 20, height: 20, color: '#38bdf8' }} />,
    metrics: [
      { label: 'Cruise Velocity', value: '64 mph' },
      { label: 'ETA Variance', value: '-12 min' },
      { label: 'Cargo Temp', value: '4.2°C Steady' },
    ],
  },
  {
    id: 3,
    label: 'City Geo-Fence Tripped',
    sub: 'Zone 7 • Final Mile Urban Entry',
    tag: 'RADIUS 2.5 KM',
    desc: 'Delivery vehicle enters urban micro-hub radius. Customer received automated SMS ping with sub-meter live map tracking.',
    color: '#A78BFA',
    icon: <RadioTower style={{ width: 20, height: 20, color: '#a78bfa' }} />,
    metrics: [
      { label: 'Proximity', value: '1.2 km' },
      { label: 'Driver Status', value: 'Active En Route' },
      { label: 'Customer Ping', value: 'Sent (11:42)' },
    ],
  },
  {
    id: 4,
    label: 'Delivered & Signature POD',
    sub: 'Customer Doorstep • Zero-Carbon Delivery',
    tag: 'POD VERIFIED',
    desc: 'Electric van parked curbside. Contactless smart receipt & optical proof of delivery logged immutably on ledger.',
    color: '#34D399',
    icon: <CheckCircle2 style={{ width: 20, height: 20, color: '#34d399' }} />,
    metrics: [
      { label: 'POD Verification', value: 'Biometric/Optical' },
      { label: 'Dwell Time', value: '42 sec' },
      { label: 'Carbon Offset', value: '100% Net Zero' },
    ],
  },
];

interface JourneyHUDProps {
  progress: number;
}

export const JourneyHUD: React.FC<JourneyHUDProps> = ({ progress }) => {
  const activeIndex = Math.min(
    Math.floor(progress * JOURNEY_STAGES.length),
    JOURNEY_STAGES.length - 1
  );
  const stage = JOURNEY_STAGES[activeIndex];
  const visible = progress > 0.04;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      pointerEvents: 'none', zIndex: 10,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: 'clamp(16px, 3vw, 40px)',
    }}>

      {/* ── Top: telemetry ticker ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-12px)',
        transition: 'opacity 0.5s, transform 0.5s',
      }}>
        {/* Shipment status pill */}
        <div style={{ ...glass, padding: '8px 16px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'monospace', fontSize: 11, color: '#d4d4d8', pointerEvents: 'auto' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 8px #34d399' }} />
          <span style={{ color: '#fff', fontWeight: 700 }}>SHIPMENT #LF-9042</span>
          <span style={{ color: '#52525b' }}>|</span>
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>{Math.round(progress * 100)}% COMPLETE</span>
        </div>

        {/* Mini gauges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto', flexWrap: 'wrap' }}>
          {[
            { Icon: Gauge, color: '#22d3ee', label: '64 mph' },
            { Icon: Thermometer, color: '#34d399', label: '4.2°C' },
            { Icon: Compass, color: '#fbbf24', label: '34.05°N' },
          ].map(({ Icon, color, label }, i) => (
            <div key={i} style={{ ...glass, padding: '6px 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontSize: 11, color: '#d4d4d8' }}>
              <Icon style={{ width: 13, height: 13, color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom: stage card ── */}
      <div style={{
        maxWidth: 520,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.7s, transform 0.7s',
        pointerEvents: 'auto',
      }}>
        <div style={{ ...glass, padding: 'clamp(16px, 3vw, 32px)', borderRadius: 24, position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>

          {/* Accent glow top bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: stage.color, transition: 'background 0.5s' }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
                {stage.icon}
              </div>
              <div>
                <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2, color: '#71717a', textTransform: 'uppercase' }}>
                  Stage 0{stage.id + 1} of 05
                </span>
                <h3 style={{ fontSize: 'clamp(16px, 2vw, 22px)', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: -0.5, lineHeight: 1.2 }}>
                  {stage.label}
                </h3>
              </div>
            </div>

            <span style={{
              fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
              padding: '4px 12px', borderRadius: 99,
              color: stage.color, border: `1px solid ${stage.color}40`,
              background: `${stage.color}15`,
            }}>
              {stage.tag}
            </span>
          </div>

          {/* Description */}
          <p style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.7, margin: '0 0 16px' }}>
            {stage.desc}
          </p>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14, marginBottom: 14 }}>
            {stage.metrics.map((m, idx) => (
              <div key={idx}>
                <span style={{ fontSize: 9, color: '#52525b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</span>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'monospace', margin: '2px 0 0' }}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {JOURNEY_STAGES.map((s, idx) => (
              <div
                key={s.id}
                style={{
                  flex: 1, height: 4, borderRadius: 99,
                  background: idx <= activeIndex ? stage.color : 'rgba(255,255,255,0.08)',
                  opacity: idx === activeIndex ? 1 : idx < activeIndex ? 0.5 : 0.2,
                  transition: 'background 0.3s, opacity 0.3s',
                }}
              />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
