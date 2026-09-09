'use client';

import { useState } from 'react';
import {
  Calendar,
  MapPin,
  Truck,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { Trip, Order } from '@/lib/mockData';

interface Props {
  trip: Trip | null;
  order: Order | null;
}

export default function P44RouteTimeline({ trip, order }: Props) {
  const [expandedUpdates, setExpandedUpdates] = useState<Record<string, boolean>>({
    scheduled: false,
    origin: true,
    transit: true,
    destination: true,
  });

  const toggleUpdate = (key: string) => {
    setExpandedUpdates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isDelivered = trip?.status === 'Delivered';
  const progress = trip?.progress ?? 0;

  const origin = trip?.origin || order?.origin || 'Lucknow Central Hub';
  const destination = trip?.destination || order?.destination || 'Delhi NCR Logistics Hub';

  return (
    <div
      style={{
        background: 'var(--bg-card, #0f172a)',
        borderRadius: 12,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 16, background: '#2563eb', borderRadius: 2 }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary, #ffffff)' }}>
            Route
          </h2>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted, #94a3b8)' }}>
          <div>Last updated: Today · Just now</div>
          <div style={{ fontSize: 10, opacity: 0.7 }}>All timestamps in IST (UTC+5:30)</div>
        </div>
      </div>

      {/* Stepper Container */}
      <div style={{ position: 'relative', paddingLeft: 30, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Continuous Connecting Vertical Line */}
        <div
          style={{
            position: 'absolute',
            left: 11,
            top: 14,
            bottom: 20,
            width: 2,
            background: 'rgba(255, 255, 255, 0.12)',
            zIndex: 1,
          }}
        />

        {/* ── Node 1: Shipment Scheduled ────────────────────────────── */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Milestone Circle Icon */}
          <div
            style={{
              position: 'absolute',
              left: -30,
              top: 0,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#1e3a8a',
              border: '2px solid var(--brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={12} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: '#1d4ed8',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                }}
              >
                Shipment Scheduled
              </span>
            </div>

            <div
              onClick={() => toggleUpdate('scheduled')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                color: 'var(--brand)',
                cursor: 'pointer',
                marginTop: 6,
                fontWeight: 600,
              }}
            >
              <span>{expandedUpdates.scheduled ? 'Hide updates' : 'Show 2 updates'}</span>
              {expandedUpdates.scheduled ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </div>

            {expandedUpdates.scheduled && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 6, fontSize: 11, color: '#94a3b8' }}>
                <div>• Manifest generated & validated against GST Portal</div>
                <div>• Dispatch bay loading slot confirmed for 05:45 AM</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Node 2: Origin Hub ────────────────────────────────────── */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              position: 'absolute',
              left: -30,
              top: 0,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#047857',
              border: '2px solid var(--brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MapPin size={12} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--brand)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  textTransform: 'uppercase',
                }}
              >
                Origin
              </span>
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #ffffff)', marginTop: 4 }}>
              {origin}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginTop: 2 }}>
              Plot 18, Transport Nagar, Kanpur Road Corridor, Lucknow 226012
            </div>

            <div
              onClick={() => toggleUpdate('origin')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                color: 'var(--brand)',
                cursor: 'pointer',
                marginTop: 6,
                fontWeight: 600,
              }}
            >
              <span>{expandedUpdates.origin ? 'Hide details' : 'Show 2 updates'}</span>
              {expandedUpdates.origin ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </div>

            {expandedUpdates.origin && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 6, fontSize: 11, color: '#94a3b8' }}>
                <div>• Departed Dispatch Terminal: {trip?.startedAt || '06:00 AM IST'}</div>
                <div>• Weight Tare & Ingate Scan Verified: {(order?.totalWeight || 9000).toLocaleString()} kg</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Node 3: Truckload Transit ─────────────────────────────── */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              position: 'absolute',
              left: -30,
              top: 0,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: progress > 0 && !isDelivered ? '#2563eb' : isDelivered ? '#047857' : '#334155',
              border: `2px solid ${progress > 0 && !isDelivered ? 'var(--brand)' : isDelivered ? 'var(--brand)' : '#64748b'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Truck size={12} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: progress > 0 && !isDelivered ? '#1d4ed8' : 'rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                }}
              >
                Truckload Transit
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', fontFamily: 'var(--font-mono, monospace)' }}>
                {progress}% Complete
              </span>
            </div>

            <div
              onClick={() => toggleUpdate('transit')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                color: 'var(--brand)',
                cursor: 'pointer',
                marginTop: 6,
                fontWeight: 600,
              }}
            >
              <span>{expandedUpdates.transit ? 'Hide updates' : 'Show 4 updates'}</span>
              {expandedUpdates.transit ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </div>

            {expandedUpdates.transit && (
              <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 6, fontSize: 11, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Unnao Expressway Interchange</span>
                  <span style={{ color: 'var(--brand)', fontWeight: 600 }}>Cleared · 07:15 AM</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Etawah Toll Plaza Waypoint</span>
                  <span style={{ color: 'var(--brand)', fontWeight: 600 }}>Cleared · 10:45 AM</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Mathura Corridor Checkpoint</span>
                  <span style={{ color: progress >= 75 ? 'var(--brand)' : '#94a3b8', fontWeight: progress >= 75 ? 600 : 400 }}>
                    {progress >= 75 ? 'Cleared' : 'Approaching'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Node 4: Destination ───────────────────────────────────── */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              position: 'absolute',
              left: -30,
              top: 0,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: isDelivered ? '#047857' : '#1e293b',
              border: `2px solid ${isDelivered ? 'var(--brand)' : 'var(--brand)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MapPin size={12} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: 'var(--brand)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  textTransform: 'uppercase',
                }}
              >
                Destination
              </span>
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #ffffff)', marginTop: 4 }}>
              {destination}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginTop: 2 }}>
              Plot 42, Okhla Industrial Area Phase III, New Delhi 110020
            </div>

            {/* Event Comparison Table (Planned vs Prediction) matching Image 3 */}
            <div
              style={{
                marginTop: 12,
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
                fontSize: 11,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.2fr 1.5fr',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  fontWeight: 700,
                  color: 'var(--text-muted, #94a3b8)',
                  textTransform: 'uppercase',
                  fontSize: 10,
                  letterSpacing: 0.5,
                }}
              >
                <span>Event</span>
                <span>Planned</span>
                <span>Prediction</span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.2fr 1.5fr',
                  padding: '10px 12px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  alignItems: 'center',
                  color: 'var(--text-primary, #ffffff)',
                }}
              >
                <span style={{ fontWeight: 600 }}>Arrival</span>
                <span style={{ color: '#94a3b8', fontFamily: 'var(--font-mono, monospace)' }}>
                  Today 18:00 - 20:00
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: isDelivered ? 'var(--brand)' : '#c084fc',
                      background: isDelivered ? 'rgba(52, 211, 153, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    {isDelivered ? 'Arrived' : trip?.eta || 'ETA 16:45'}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--brand)', fontWeight: 700 }}>
                    {isDelivered ? 'Verified' : '-25 mins'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Node 5: Shipment Complete ─────────────────────────────── */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              position: 'absolute',
              left: -30,
              top: 0,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: isDelivered ? 'var(--brand)' : 'rgba(255, 255, 255, 0.05)',
              border: `2px solid ${isDelivered ? 'var(--brand)' : 'rgba(255, 255, 255, 0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={13} color={isDelivered ? '#ffffff' : '#94a3b8'} />
          </div>

          <div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 4,
                background: isDelivered ? '#1d4ed8' : 'rgba(255, 255, 255, 0.08)',
                color: isDelivered ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                textTransform: 'uppercase',
              }}
            >
              Shipment Complete
            </span>
            {isDelivered && (
              <div style={{ fontSize: 11, color: 'var(--brand)', marginTop: 4, fontWeight: 600 }}>
                Signed e-POD recorded & GST invoice issued
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
