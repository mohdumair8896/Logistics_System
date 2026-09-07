'use client';

import React from 'react';
import { PackageSearch, Calculator, UserPlus, MapPin, Send, ShieldCheck } from 'lucide-react';

const glass = {
  background: 'rgba(15,23,42,0.65)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
} as const;

const inputStyle = {
  width: '100%',
  height: 52,
  background: 'rgba(2,6,23,0.7)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: '0 16px 0 48px',
  fontSize: 14,
  color: '#e4e4e7',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box' as const,
} as const;

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: '#71717a',
  letterSpacing: 0.3,
  marginBottom: 8,
  display: 'block',
} as const;

const iconWrap = {
  position: 'absolute' as const,
  left: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none' as const,
};

const QuoteRequest: React.FC = () => {
  return (
    <section
      id="quote-section"
      style={{
        padding: '96px 24px',
        background: '#020617',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '20%',
        transform: 'translate(-50%, -50%)',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 64, position: 'relative', zIndex: 1 }}>

        {/* Left: copy */}
        <div style={{ flex: '1 1 340px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#fbbf24', fontFamily: 'monospace', marginBottom: 12, display: 'block' }}>
            Integrated Partnership
          </span>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 900, letterSpacing: -2, lineHeight: 1.05, color: '#fff', marginBottom: 20 }}>
            Your Reliable{' '}
            <span style={{ background: 'linear-gradient(90deg, #fbbf24, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Delivery Service Partner!
            </span>
          </h2>
          <p style={{ fontSize: 15, color: '#71717a', lineHeight: 1.75, maxWidth: 480, marginBottom: 40 }}>
            LogiFlow utilizes a decentralized mesh network of verified transport providers. Our predictive API selects the optimal carrier, ensuring maximum velocity and minimum carbon footprint for every shipment.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24 }}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(30,41,59,1))', border: '1px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, color: '#fbbf24' }}>
                CV
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Chris Vowels</p>
                <p style={{ fontSize: 11, color: '#fbbf24' }}>Fleet Operations Lead & Co-Founder</p>
              </div>
            </div>

            {/* Verified badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: '#0f172a', border: '1px solid rgba(255,255,255,0.07)', fontSize: 12, color: '#a1a1aa', fontFamily: 'monospace' }}>
              <ShieldCheck style={{ width: 14, height: 14, color: '#34d399' }} />
              Verified Carrier Network
            </div>
          </div>
        </div>

        {/* Right: form card */}
        <div style={{ ...glass, width: '100%', maxWidth: 480, padding: 40, borderRadius: 32, flexShrink: 0, border: '1px solid rgba(245,158,11,0.15)' }}>

          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 32 }}>
            <div style={{ padding: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12 }}>
              <Calculator style={{ width: 22, height: 22, color: '#fbbf24' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Instant Quote Calculator</h3>
              <p style={{ fontSize: 12, color: '#52525b' }}>Real-time dynamic rate estimation</p>
            </div>
          </div>

          <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Customer ID */}
            <div>
              <label style={labelStyle}>LogiFlow Customer ID (Optional)</label>
              <div style={{ position: 'relative' }}>
                <span style={iconWrap}><UserPlus style={{ width: 18, height: 18, color: '#52525b' }} /></span>
                <input type="text" placeholder="LF-####-####" style={{ ...inputStyle, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, fontSize: 13 }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.6)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>
            </div>

            {/* Route grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Origin Zip / Port', ph: 'Zip (Ex: 90210)' },
                { label: 'Destination Zip / Port', ph: 'Zip (Ex: 10001)' },
              ].map(f => (
                <div key={f.label}>
                  <label style={labelStyle}>{f.label}</label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}><MapPin style={{ width: 18, height: 18, color: '#fbbf24' }} /></span>
                    <input type="text" placeholder={f.ph} style={{ ...inputStyle, fontSize: 13 }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.6)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Cargo type */}
            <div>
              <label style={labelStyle}>Cargo Manifest Type</label>
              <div style={{ position: 'relative' }}>
                <span style={iconWrap}><PackageSearch style={{ width: 18, height: 18, color: '#52525b' }} /></span>
                <input type="text" placeholder="E.g., Refrigerated, Freight, Bulk" style={{ ...inputStyle, fontSize: 13 }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.6)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%', height: 52, marginTop: 8,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#1c1917', border: 'none', borderRadius: 16,
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 0 30px rgba(245,158,11,0.25)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(245,158,11,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(245,158,11,0.25)'; }}
            >
              Request Manifest Calculation
              <Send style={{ width: 18, height: 18 }} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default QuoteRequest;
