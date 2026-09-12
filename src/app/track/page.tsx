'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowRight, ShieldCheck, Truck, PackageCheck, Clock } from 'lucide-react';
import { LogisticsEdgeLogo } from '@/components/ui/LogisticsEdgeLogo';

export default function PublicTrackingSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim().toUpperCase();
    if (!clean) return;
    router.push(`/track/${encodeURIComponent(clean)}`);
  };

  const sampleShipments = [
    { id: 'ORD-0995', label: 'Lucknow ➔ Delhi NCR (In Transit)' },
    { id: 'ORD-0992', label: 'Lucknow ➔ Prayagraj (Delivered)' },
    { id: 'TRP-1001', label: 'Trip TRP-1001 (In Transit)' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface, #F8F7F4)', color: 'var(--text-high, #141414)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header style={{ borderBottom: '1px solid var(--border, #E6E4DF)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-1, #FFFFFF)', backdropFilter: 'blur(12px)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <LogisticsEdgeLogo size="sm" variant="full" />
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(0, 87, 255, 0.08)', color: 'var(--brand, #0057FF)', border: '1px solid rgba(0, 87, 255, 0.2)', textTransform: 'uppercase' }}>
            Public Portal
          </span>
        </Link>
        <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-mid, #525252)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}>
          Staff Login <ArrowRight size={14} />
        </Link>
      </header>

      {/* Main Hero Search Container */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(0, 87, 255, 0.08)', border: '1px solid rgba(0, 87, 255, 0.2)', marginBottom: 20 }}>
          <ShieldCheck size={16} color="var(--brand, #0057FF)" />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand, #0057FF)' }}>
            Official Live Consignee Tracking
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, textAlign: 'center', marginBottom: 12, letterSpacing: -1, lineHeight: 1.2, color: 'var(--text-high, #141414)' }}>
          Track Your Freight in Real-Time
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-mid, #525252)', textAlign: 'center', maxWidth: 520, marginBottom: 36, lineHeight: 1.6 }}>
          Enter your Order Number, Waybill ID, or Trip Tracking Code to access live corridor GPS telematics, ETA, and electronic Proof of Delivery.
        </p>

        {/* Search Bar Form */}
        <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: 580, position: 'relative', marginBottom: 24 }}>
          <div className="input-group" style={{ height: 56, padding: '0 8px 0 18px', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <Search size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. ORD-0995 or TRP-1001..."
              style={{
                fontSize: 15,
                fontFamily: 'var(--font-mono, monospace)',
                paddingRight: 120,
              }}
            />
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              style={{
                position: 'absolute',
                right: 8,
                padding: '10px 20px',
                borderRadius: 10,
                border: 'none',
                background: searchQuery.trim() ? 'var(--brand, #0057FF)' : 'var(--surface-3, #E9E7E2)',
                color: searchQuery.trim() ? '#fff' : 'var(--text-low, #909090)',
                fontSize: 14,
                fontWeight: 700,
                cursor: searchQuery.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: searchQuery.trim() ? '0 2px 8px rgba(0,87,255,0.3)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Track <ArrowRight size={14} />
            </button>
          </div>
        </form>

        {/* Quick Sample Links */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-low, #909090)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Recent Waybill Lookups:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {sampleShipments.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/track/${s.id}`)}
                style={{
                  background: 'var(--surface-1, #FFFFFF)',
                  border: '1px solid var(--border, #E6E4DF)',
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: 12,
                  color: 'var(--text-high, #141414)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'background 0.2s, border-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--brand, #0057FF)';
                  e.currentTarget.style.background = 'rgba(0, 87, 255, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border, #E6E4DF)';
                  e.currentTarget.style.background = 'var(--surface-1, #FFFFFF)';
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--brand, #0057FF)' }}>{s.id}</span>
                <span style={{ color: 'var(--text-mid, #525252)' }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Value Proposition Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, width: '100%', marginTop: 60 }}>
          <div style={{ background: 'var(--surface-1, #FFFFFF)', border: '1px solid var(--border, #E6E4DF)', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0,87,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Truck size={18} color="var(--brand, #0057FF)" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: 'var(--text-high, #141414)' }}>Corridor Telematics</div>
            <div style={{ fontSize: 12, color: 'var(--text-mid, #525252)', lineHeight: 1.5 }}>
              Live GPS telemetry streaming speeds, corridor status, and geofence updates every second.
            </div>
          </div>

          <div style={{ background: 'var(--surface-1, #FFFFFF)', border: '1px solid var(--border, #E6E4DF)', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(217,119,6,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Clock size={18} color="#D97706" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: 'var(--text-high, #141414)' }}>Predictive ETA</div>
            <div style={{ fontSize: 12, color: 'var(--text-mid, #525252)', lineHeight: 1.5 }}>
              Dynamic arrival predictions calculated using live speed, distance remaining, and toll delays.
            </div>
          </div>

          <div style={{ background: 'var(--surface-1, #FFFFFF)', border: '1px solid var(--border, #E6E4DF)', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <PackageCheck size={18} color="#16A34A" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: 'var(--text-high, #141414)' }}>Instant e-POD</div>
            <div style={{ fontSize: 12, color: 'var(--text-mid, #525252)', lineHeight: 1.5 }}>
              Inspect digital signatures and delivery certificates the moment your cargo arrives.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border, #E6E4DF)', padding: '20px', textAlign: 'center', fontSize: 12, color: 'var(--text-low, #909090)', background: 'var(--surface, #F8F7F4)' }}>
        © {new Date().getFullYear()} LogisticsEdge Logistics Platform. Real-time freight tracking and electronic proof of delivery.
      </footer>
    </div>
  );
}
