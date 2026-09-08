'use client';
import { MapPin, Radio } from 'lucide-react';
import type { Trip, Order, Customer } from '@/lib/mockData';

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
              background: '#22d3ee', boxShadow: '0 0 10px #22d3ee',
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
              <Radio size={16} color="#22d3ee" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Live Tracking
              </span>
            </div>

            <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)' }} />

            {/* Order ID */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 }}>
                Order
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                {order?.id || trip.orderId}
              </div>
            </div>

            <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)' }} />

            {/* Customer */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 }}>
                Customer
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {customer?.name || '—'}
              </div>
            </div>

            <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)' }} />

            {/* Route */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 }}>
                  Origin
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>{trip.origin.split(' ')[0]}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.2)' }} />
                <MapPin size={14} color="var(--text-muted)" />
                <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.2)' }} />
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 }}>
                  Destination
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: trip.progress >= 100 ? '#34d399' : 'var(--text-secondary)' }}>
                  {trip.destination.split(' ')[0]}
                </div>
              </div>
            </div>
          </div>

          {/* Progress pill */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: 'rgba(34,211,238,0.1)',
              border: '1px solid rgba(34,211,238,0.3)',
              borderRadius: 30,
              padding: '10px 20px',
              minWidth: 100
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: '#22d3ee', lineHeight: 1 }}>
                {trip.progress}%
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 }}>
                Complete
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
