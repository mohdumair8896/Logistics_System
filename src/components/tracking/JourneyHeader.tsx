'use client';
import { MapPin, Radio, ExternalLink, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Trip } from '@/features/trips/types';
import type { Order } from '@/features/orders/types';
import type { Customer } from '@/shared/types/common';

interface Props {
  activeTrips: Trip[];
  selectedTripId: string | null;
  onSelectTrip: (id: string) => void;
  trip: Trip | null;
  customer: Customer | null;
  order: Order | null;
}

export default function JourneyHeader({ activeTrips, selectedTripId, onSelectTrip, trip, customer, order }: Props) {
  return (
    <div style={{ marginBottom: 32 }}>
      {/* Page title */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--brand)', boxShadow: '0 0 10px var(--brand)',
              animation: 'pulse 2s infinite'
            }} />
            <div className="page-title">Live Shipment Journey</div>
          </div>
          <div className="page-subtitle">
            Scroll through the complete logistics lifecycle — from order creation to delivery
          </div>
        </div>

        {/* Trip selector chips */}
        {activeTrips.length > 1 && (
          <div className="journey-trip-chips">
            {activeTrips.map(t => (
              <button
                key={t.id}
                onClick={() => onSelectTrip(t.id)}
                className={`journey-trip-chip ${t.id === selectedTripId ? 'journey-trip-chip-active' : 'journey-trip-chip-inactive'}`}
              >
                {t.id}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Shipment banner */}
      {trip && (
        <div className="journey-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio size={16} color="var(--brand)" />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Live Tracking
              </span>
            </div>

            <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)' }} />

            {/* Order ID */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 }}>
                Order
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 800, color: 'var(--text-high)' }}>
                {order?.id || trip.orderId}
              </div>
            </div>

            <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)' }} />

            {/* Customer */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 }}>
                Customer
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>
                {customer?.name || '—'}
              </div>
            </div>

            <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)' }} />

            {/* Route */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 }}>
                  Origin
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>{trip.origin.split(' ')[0]}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.2)' }} />
                <MapPin size={14} color="var(--text-low)" />
                <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.2)' }} />
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 }}>
                  Destination
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: trip.progress >= 100 ? 'var(--brand)' : 'var(--text-mid)' }}>
                  {trip.destination.split(' ')[0]}
                </div>
              </div>
            </div>
          </div>

          {/* Progress pill & Public Customer Link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                background: 'rgba(34,211,238,0.1)',
                border: '1px solid rgba(34,211,238,0.3)',
                borderRadius: 30,
                padding: '10px 20px',
                minWidth: 100
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: 'var(--brand)', lineHeight: 1 }}>
                  {trip.progress}%
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 }}>
                  Complete
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <a
                href={`/track/${encodeURIComponent(order?.id || trip.orderId)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 12px',
                  borderRadius: 10,
                  background: 'rgba(56,189,248,0.1)',
                  border: '1px solid rgba(56,189,248,0.3)',
                  color: 'var(--brand)',
                  fontSize: 11,
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap'
                }}
                title="Open consignee-facing tracking page"
              >
                <ExternalLink size={12} /> Customer Portal
              </a>

              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/track/${encodeURIComponent(order?.id || trip.orderId)}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Public tracking link copied to clipboard!');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#cbd5e1',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap'
                }}
                title="Copy public tracking URL"
              >
                <Share2 size={12} /> Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
