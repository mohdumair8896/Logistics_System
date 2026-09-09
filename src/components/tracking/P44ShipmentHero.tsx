'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Truck,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  FileText,
  Clock,
  Key,
  Tag,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Trip, Order, Vehicle, Driver, Customer } from '@/lib/store';

interface P44ShipmentHeroProps {
  trip: Trip;
  order: Order | null;
  vehicle: Vehicle | null;
  driver: Driver | null;
  customer: Customer | null;
  onViewDocuments: () => void;
}

export default function P44ShipmentHero({
  trip,
  order,
  vehicle,
  driver,
  customer,
  onViewDocuments,
}: P44ShipmentHeroProps) {
  const [refKeysOpen, setRefKeysOpen] = useState(true);
  const [addIdOpen, setAddIdOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);

  // Derived calculations
  const distDone = Math.round((trip.progress / 100) * trip.distance);
  const distLeft = Math.max(0, trip.distance - distDone);

  // Format planned vs predicted times
  const plannedTime = trip.eta || '04:30 PM';
  const predictedTime = trip.status === 'In Transit'
    ? `${plannedTime} (-25m)`
    : trip.status === 'Delivered'
    ? 'Delivered on Schedule'
    : 'Pending Dispatch';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* ── 1. Hero Blue Shipment Card (project44 Signature Card) ── */}
      <div
        style={{
          background: 'linear-gradient(145deg, #1e3a8a 0%, #172554 100%)',
          borderRadius: 12,
          padding: '18px 16px',
          color: '#ffffff',
          boxShadow: '0 4px 20px -2px rgba(30, 58, 138, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle background circuit watermark */}
        <div
          style={{
            position: 'absolute',
            top: -20,
            right: -20,
            opacity: 0.08,
            pointerEvents: 'none',
          }}
        >
          <Truck size={140} />
        </div>

        {/* Top Status & Carrier SCAC */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background:
                  trip.status === 'In Transit'
                    ? 'var(--brand)'
                    : trip.status === 'Delivered'
                    ? 'var(--brand)'
                    : 'var(--brand)',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: 9999,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#ffffff',
                }}
              />
              {trip.status}
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'rgba(255, 255, 255, 0.75)',
                fontFamily: 'var(--font-mono, monospace)',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              SCAC: PLFT
            </span>
          </div>

          <span
            style={{
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 600,
            }}
          >
            {trip.id}
          </span>
        </div>

        {/* Destination Header */}
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.7)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            <MapPin size={12} style={{ color: '#93c5fd' }} />
            <span>Destination Hub</span>
          </div>
          <h2
            style={{
              fontSize: 17,
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.25,
              color: '#ffffff',
            }}
          >
            {trip.destination}
          </h2>
          <div
            style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.8)',
              marginTop: 3,
            }}
          >
            {customer?.address || order?.destination || `${trip.destination} Distribution Terminal`}
          </div>
        </div>

        {/* Route Progress Bar */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: 8,
            padding: '10px 12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              fontWeight: 600,
              marginBottom: 6,
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            <span>Corridor Progress</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--brand)' }}>
              {trip.progress}% ({distDone} / {trip.distance} km)
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 6,
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${trip.progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--brand) 0%, var(--brand) 100%)',
                borderRadius: 3,
                transition: 'width 0.6s ease',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: 5,
            }}
          >
            <span>Origin: {trip.origin}</span>
            <span>Remaining: {distLeft} km</span>
          </div>
        </div>
      </div>

      {/* ── 2. Arrival & ETA Comparison Card (Planned vs AI Predicted) ── */}
      <div
        style={{
          background: 'var(--card-bg, #111827)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
          borderRadius: 10,
          padding: '14px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted, #94a3b8)',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calendar size={13} style={{ color: 'var(--brand)' }} />
            Estimated Arrival
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--brand)',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            On-Time
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}
        >
          {/* Planned Arrival */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 8,
              padding: '8px 10px',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-muted, #94a3b8)',
                fontWeight: 600,
                marginBottom: 2,
              }}
            >
              PLANNED
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary, #ffffff)',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {plannedTime}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted, #94a3b8)', marginTop: 2 }}>
              Scheduled Window
            </div>
          </div>

          {/* AI Predicted Arrival */}
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 8,
              padding: '8px 10px',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                color: '#a5b4fc',
                fontWeight: 700,
                marginBottom: 2,
              }}
            >
              <Sparkles size={11} style={{ color: '#818cf8' }} />
              AI PREDICTED
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#c7d2fe',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {predictedTime}
            </div>
            <div style={{ fontSize: 10, color: '#818cf8', marginTop: 2 }}>
              High Precision • 98.4%
            </div>
          </div>
        </div>

        {/* Carrier Details Sub-strip */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Carrier:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary, #ffffff)' }}>
              Prime Freight Lines (DOT 128544)
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Assigned Tractor:</span>
            <span
              style={{
                fontWeight: 600,
                color: 'var(--text-primary, #ffffff)',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {vehicle?.vehicleNo || 'MH-04-AB-1234'} ({vehicle?.type || 'Heavy Hauler 40T'})
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Assigned Driver:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary, #ffffff)' }}>
              {driver?.name || 'Authorized Operator'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Collapsible Accordions (Reference Keys, Identifiers, Documents) ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {/* Accordion A: Reference keys */}
        <div
          style={{
            background: 'var(--card-bg, #111827)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setRefKeysOpen(!refKeysOpen)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary, #ffffff)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Key size={13} style={{ color: 'var(--brand)' }} />
              Reference keys
            </span>
            {refKeysOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {refKeysOpen && (
            <div
              style={{
                padding: '8px 14px 12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: 11,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Order Number:</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: 'var(--text-primary, #ffffff)',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {order?.id || trip.orderId}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Bill of Lading (BOL):</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: 'var(--text-primary, #ffffff)',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  BOL-{trip.id.replace('TRP-', '99')}42
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Customer PO:</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: 'var(--text-primary, #ffffff)',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  PO-8492048
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Seal Number:</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: 'var(--brand)',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  SEAL-883192-A
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Accordion B: Additional identifiers */}
        <div
          style={{
            background: 'var(--card-bg, #111827)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setAddIdOpen(!addIdOpen)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary, #ffffff)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Tag size={13} style={{ color: '#a855f7' }} />
              Additional identifiers
            </span>
            {addIdOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {addIdOpen && (
            <div
              style={{
                padding: '8px 14px 12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: 11,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>SCAC Code:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary, #ffffff)' }}>PLFT</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>DOT Compliance ID:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary, #ffffff)' }}>128544-USA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Trailer ID:</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: 'var(--text-primary, #ffffff)',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  TRL-99420-VAN
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Customer Code:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary, #ffffff)' }}>
                  {customer?.id || 'CUST-001'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Cargo Payload:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary, #ffffff)' }}>
                  18,400 kg (24 Pallets)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Accordion C: Documents (Quick Preview & Nav) */}
        <div
          style={{
            background: 'var(--card-bg, #111827)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setDocsOpen(!docsOpen)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary, #ffffff)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <FileText size={13} style={{ color: 'var(--brand)' }} />
              Documents (3 attached)
            </span>
            {docsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {docsOpen && (
            <div
              style={{
                padding: '8px 14px 12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: 11,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={12} style={{ color: 'var(--brand)' }} />
                  Commercial Invoice
                </span>
                <span style={{ color: 'var(--brand)', fontWeight: 600 }}>Verified</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={12} style={{ color: 'var(--brand)' }} />
                  Bill of Lading (BOL)
                </span>
                <span style={{ color: 'var(--brand)', fontWeight: 600 }}>Signed</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={12} style={{ color: 'var(--brand)' }} />
                  Proof of Delivery (e-POD)
                </span>
                <span style={{ color: 'var(--brand)', fontWeight: 600 }}>In-Transit</span>
              </div>

              <button
                onClick={onViewDocuments}
                style={{
                  marginTop: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  background: 'rgba(37, 99, 235, 0.15)',
                  border: '1px solid rgba(37, 99, 235, 0.3)',
                  borderRadius: 6,
                  padding: '7px 12px',
                  color: 'var(--brand)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <span>Open Documents Manager</span>
                <ExternalLink size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
