'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowRight, ShieldCheck, Truck, PackageCheck, Clock } from 'lucide-react';

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
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #020617)', color: 'var(--text-primary, #f8fafc)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(12px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 16 }}>
            L
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5, color: '#fff' }}>
            Logi<span style={{ color: '#38bdf8' }}>Flow</span>
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)', textTransform: 'uppercase' }}>
            Public Portal
          </span>
        </Link>
        <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}>
          Staff Login <ArrowRight size={14} />
        </Link>
      </header>

      {/* Main Hero Search Container */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', marginBottom: 20 }}>
          <ShieldCheck size={16} color="#38bdf8" />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#38bdf8' }}>
            Official Live Consignee Tracking
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, textAlign: 'center', marginBottom: 12, letterSpacing: -1, lineHeight: 1.2 }}>
          Track Your Freight in Real-Time
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted, #94a3b8)', textAlign: 'center', maxWidth: 520, marginBottom: 36, lineHeight: 1.6 }}>
          Enter your Order Number, Waybill ID, or Trip Tracking Code to access live corridor GPS telematics, ETA, and electronic Proof of Delivery.
        </p>

        {/* Search Bar Form */}
        <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: 580, position: 'relative', marginBottom: 24 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={20} color="var(--text-muted, #94a3b8)" style={{ position: 'absolute', left: 18, pointerEvents: 'none' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. ORD-0995 or TRP-1001..."
              style={{
                width: '100%',
                padding: '16px 140px 16px 52px',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(15,23,42,0.8)',
                color: '#fff',
                fontSize: 16,
                fontFamily: 'var(--font-mono, monospace)',
                outline: 'none',
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#38bdf8';
                e.target.style.boxShadow = '0 0 0 3px rgba(56,189,248,0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.15)';
                e.target.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)';
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
                background: searchQuery.trim() ? '#0284c7' : 'rgba(255,255,255,0.1)',
                color: searchQuery.trim() ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: 14,
                fontWeight: 700,
                cursor: searchQuery.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 0.2s',
              }}
            >
              Track <ArrowRight size={14} />
            </button>
          </div>
        </form>

        {/* Quick Sample Links */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted, #94a3b8)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Quick Demo Shipments:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {sampleShipments.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/track/${s.id}`)}
                style={{
                  background: 'rgba(30,41,59,0.7)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: 12,
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 0.2s, border-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#38bdf8';
                  e.currentTarget.style.background = 'rgba(56,189,248,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.background = 'rgba(30,41,59,0.7)';
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: '#38bdf8' }}>{s.id}</span>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Value Proposition Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, width: '100%', marginTop: 60 }}>
          <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Truck size={18} color="#38bdf8" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Corridor Telematics</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', lineHeight: 1.5 }}>
              Live GPS telemetry streaming speeds, corridor status, and geofence updates every second.
            </div>
          </div>

          <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Clock size={18} color="#34d399" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Predictive ETA</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', lineHeight: 1.5 }}>
              Dynamic arrival predictions calculated using live speed, distance remaining, and toll delays.
            </div>
          </div>

          <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <PackageCheck size={18} color="#a855f7" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Instant e-POD</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', lineHeight: 1.5 }}>
              Inspect digital signatures and delivery certificates the moment your cargo arrives.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted, #94a3b8)' }}>
        © {new Date().getFullYear()} LogiFlow Logistics Platform. Real-time freight tracking and electronic proof of delivery.
      </footer>
    </div>
  );
}
