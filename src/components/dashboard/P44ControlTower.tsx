'use client';

import { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  LayoutGrid
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Props {
  totalActiveShipments?: number;
}

export default function P44ControlTower({ totalActiveShipments = 168974 }: Props) {
  const [selectedSnapshotTab, setSelectedSnapshotTab] = useState<'Ocean' | 'Truckload' | 'All'>('Truckload');
  const [viewingRange, setViewingRange] = useState('Last 12 mos');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Top Section: Global Status & Trending Insight Banner (matching Image 2) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        {/* Floating Shipment Health Card matching Image 2 Top-Left */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            borderRadius: 14,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '20px 24px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
              Welcome, Operations Director
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => toast.info('Filters: Active Hubs, Multi-modal Carriers')}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: 6,
                  padding: 6,
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <SlidersHorizontal size={14} />
              </button>
              <button
                type="button"
                onClick={() => toast.info('Toggled view to Grid')}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: 6,
                  padding: 6,
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono, monospace)', letterSpacing: -1 }}>
                {totalActiveShipments.toLocaleString()}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>
                active shipments
              </span>
            </div>

            {/* Segmented Progress Bar matching Image 2 */}
            <div
              style={{
                height: 6,
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 4,
                overflow: 'hidden',
                display: 'flex',
                margin: '12px 0 16px 0',
              }}
            >
              <div style={{ width: '20%', background: '#a855f7' }} title="Early: 20%" />
              <div style={{ width: '44%', background: '#2563eb' }} title="On time: 44%" />
              <div style={{ width: '6%', background: '#06b6d4' }} title="Unknown: 6%" />
              <div style={{ width: '30%', background: '#f43f5e' }} title="Late: 30%" />
            </div>

            {/* 4-Item Legend matching Image 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7' }} />
                  <span style={{ color: '#94a3b8' }}>Early</span>
                </div>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: '#ffffff' }}>33,794</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
                  <span style={{ color: '#94a3b8' }}>On time</span>
                </div>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: '#ffffff' }}>73,589</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4' }} />
                  <span style={{ color: '#94a3b8' }}>Unknown</span>
                </div>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: '#ffffff' }}>10,879</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e' }} />
                  <span style={{ color: '#94a3b8' }}>Late</span>
                </div>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: '#ffffff' }}>50,692</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trending Insights Live Alert Banner matching Image 2 */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: 14,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Sparkles size={16} color="var(--brand)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Trending Corridor Insights
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '14px',
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: 'var(--brand-dark)',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  flexShrink: 0,
                }}
              >
                LIVE
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', lineHeight: 1.4 }}>
                  NH-19 Expressway Toll Incident causing potential delays for 3 FTL shipments
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  Impacted lane: Lucknow Central Hub ➔ Delhi NCR Hub. AI rerouting recommended.
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <Link
              href="/tracking"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--brand)',
                textDecoration: 'none',
              }}
            >
              <span>Show impacted corridor shipments</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Saved Views Toolbar & Exception Metric Cards (matching Image 2) ── */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 12,
          }}
        >
          {/* Saved Views Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', fontWeight: 600, marginRight: 4 }}>
              Saved views:
            </span>
            <button
              style={{
                background: '#1d4ed8',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Shipments <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: 10, fontSize: 10 }}>10</span>
            </button>
            <button
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Orders
            </button>
            <button
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Recommended
            </button>
          </div>

          {/* Search & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: 9 }} />
              <input
                type="text"
                placeholder="Search shipments..."
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 6,
                  padding: '6px 12px 6px 30px',
                  fontSize: 12,
                  color: '#ffffff',
                  outline: 'none',
                  width: 180,
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => toast.info('Create custom filter view')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 6,
                padding: '6px 8px',
                color: '#e2e8f0',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
            </button>
            <div style={{ display: 'flex', gap: 2 }}>
              <button style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: 4, padding: 6, color: '#94a3b8', cursor: 'pointer' }}>
                <ChevronLeft size={14} />
              </button>
              <button style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: 4, padding: 6, color: '#94a3b8', cursor: 'pointer' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* 5 Exception Metric Tiles matching Image 2 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          <div style={{ background: 'var(--bg-card, #0f172a)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', fontWeight: 600, borderLeft: '3px solid #0284c7', paddingLeft: 6, marginBottom: 8 }}>
              Corridor: Late Departure
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono, monospace)' }}>402</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>shipments</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card, #0f172a)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', fontWeight: 600, borderLeft: '3px solid #0284c7', paddingLeft: 6, marginBottom: 8 }}>
              Warehouse: Late Staging
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono, monospace)' }}>856</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>shipments</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card, #0f172a)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', fontWeight: 600, borderLeft: '3px solid #0284c7', paddingLeft: 6, marginBottom: 8 }}>
              Intermodal: ETA Late
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono, monospace)' }}>546</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>shipments</span>
            </div>
          </div>

          {/* Highlighted Truckload ETA Late Tile matching Image 2 */}
          <div
            style={{
              background: 'rgba(30, 58, 138, 0.25)',
              border: '1px solid var(--brand)',
              borderRadius: 10,
              padding: '14px 16px',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 700, borderLeft: '3px solid var(--brand)', paddingLeft: 6, marginBottom: 8 }}>
              Truckload: ETA Late
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono, monospace)' }}>1,126</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>shipments</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card, #0f172a)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', fontWeight: 600, borderLeft: '3px solid #0284c7', paddingLeft: 6, marginBottom: 8 }}>
              Truckload: ETA Early
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand)', fontFamily: 'var(--font-mono, monospace)' }}>604</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>shipments</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Analytics Snapshots Grid (matching Image 2) ── */}
      <div
        style={{
          background: 'var(--bg-card, #0f172a)',
          borderRadius: 14,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '20px',
        }}
      >
        {/* Snapshots Header Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: 14,
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Snapshots:
            </span>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 2 }}>
              {(['Ocean', 'Truckload', 'All'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSelectedSnapshotTab(tab)}
                  style={{
                    background: selectedSnapshotTab === tab ? '#1d4ed8' : 'transparent',
                    color: selectedSnapshotTab === tab ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    borderRadius: 4,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Viewing:</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {['Last 30 days', 'Last 12 mos'].map(range => (
                <button
                  key={range}
                  onClick={() => setViewingRange(range)}
                  style={{
                    background: viewingRange === range ? '#1e3a8a' : 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 4,
                    padding: '2px 8px',
                    color: viewingRange === range ? '#ffffff' : '#94a3b8',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Analytics KPI Cards matching Image 2 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {/* Card 1: Demurrage & Detention Charges */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #ffffff)' }}>
                Detention &amp; Toll Charges
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, color: '#94a3b8' }}>
                DET
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>Fleet Units</div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', color: '#ffffff' }}>1,975</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>Current Total Cost</div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', color: 'var(--brand)' }}>₹42,50,000</div>
              </div>
            </div>

            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, display: 'flex', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ width: '30%', background: 'var(--brand)' }} />
              <div style={{ width: '25%', background: '#a855f7' }} />
              <div style={{ width: '20%', background: 'var(--brand)' }} />
              <div style={{ width: '25%', background: '#f43f5e' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>• Free buffer period</span>
                <span>330 units (₹0)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>• 1st period delay</span>
                <span>284 units (₹12.8L)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>• 2nd period delay</span>
                <span>156 units (₹7.8L)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Milestone Completeness Bar Comparison */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #ffffff)' }}>
                Milestone Completeness
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 2 }}>
                <ArrowUpRight size={13} /> 22.15%
              </span>
            </div>

            {/* Comparison Bar Graph matching Image 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, alignItems: 'end', height: 100, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { label: 'Depart Origin', carrier: 74, enhanced: 93 },
                { label: 'Arrive TS', carrier: 69, enhanced: 93 },
                { label: 'Depart TS', carrier: 66, enhanced: 94 },
                { label: 'Arrive Dest', carrier: 71, enhanced: 93 },
              ].map((m, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 2 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--brand)' }}>{m.enhanced}%</span>
                  <div style={{ display: 'flex', gap: 2, alignItems: 'end', height: '60%' }}>
                    <div style={{ width: 8, height: `${m.carrier * 0.7}%`, background: 'rgba(255,255,255,0.2)', borderRadius: '2px 2px 0 0' }} />
                    <div style={{ width: 8, height: `${m.enhanced * 0.7}%`, background: '#2563eb', borderRadius: '2px 2px 0 0' }} />
                  </div>
                  <span style={{ fontSize: 8, color: '#64748b', whiteSpace: 'nowrap' }}>{m.label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, fontSize: 10, color: '#94a3b8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
                <span>Carrier Only</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, background: '#2563eb', borderRadius: 1 }} />
                <span>Enhanced with AI</span>
              </div>
            </div>
          </div>

          {/* Card 3: Prediction Accuracy */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #ffffff)' }}>
                Prediction Accuracy
              </span>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>AI Telematics</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Arrival ETA Accuracy</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <ArrowUpRight size={14} /> 4.9%
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Ingate Dock Time</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <ArrowUpRight size={14} /> 12.7%
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Advance Notice Lead Time:</span>
                <span style={{ color: 'var(--brand)', fontWeight: 700 }}>+4.8 hrs advance</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Dock Overstay Reduction:</span>
                <span style={{ color: 'var(--brand)', fontWeight: 700 }}>+12.5% faster</span>
              </div>
            </div>
          </div>

          {/* Card 4: Data Latency Reduction */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #ffffff)' }}>
                Data Latency Reduction
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 2 }}>
                <ArrowDownRight size={13} /> 50.5%
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: '#94a3b8' }}>Fleet Hub Ingate</span>
                  <span style={{ color: 'var(--brand)', fontWeight: 700 }}>18.7 min (vs 60.4 min)</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: '31%', height: '100%', background: 'var(--brand)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: '#94a3b8' }}>Dispatch Manifest Sync</span>
                  <span style={{ color: 'var(--brand)', fontWeight: 700 }}>50.6 min (vs 81.7 min)</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: '62%', height: '100%', background: '#2563eb' }} />
                </div>
              </div>
            </div>

            <div style={{ fontSize: 10, color: '#64748b', textAlign: 'center', marginTop: 10 }}>
              Live edge OBD-II &amp; FASTag sensor stream active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
