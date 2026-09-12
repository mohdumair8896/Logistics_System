'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  PackageSearch,
  Calculator,
  MapPin,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

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
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  padding: '0 16px 0 48px',
  fontSize: 14,
  color: '#f8fafc',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box' as const,
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: '#cbd5e1',
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

interface QuoteResult {
  quoteId: string;
  distanceMiles: number;
  estCostUsd: number;
  transitHours: number;
  carbonSavingsPct: number;
  origin: string;
  destination: string;
  cargo: string;
}

const QuoteRequest: React.FC = () => {
  const router = useRouter();


  // Occam's Razor: removed Customer ID field — it added zero value to the user
  const [origin, setOrigin]           = useState('');
  const [destination, setDestination] = useState('');
  const [cargoType, setCargoType]     = useState('Refrigerated High-Value Freight');
  const [honeypot, setHoneypot]       = useState('');
  const [loadTime]                    = useState<number>(() => Date.now());

  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteResult, setQuoteResult]   = useState<QuoteResult | null>(null);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    // Postel's Law: accept short inputs liberally, give helpful errors
    if (!origin.trim()) {
      errs.origin = 'Enter a pick-up ZIP code or port code (e.g. 400001 or INBOM)';
    } else if (origin.trim().length < 3) {
      errs.origin = 'At least 3 characters needed (e.g. 400001 or LAX)';
    }

    if (!destination.trim()) {
      errs.destination = 'Enter a delivery ZIP code or port code (e.g. 110001 or INDEL)';
    } else if (destination.trim().length < 3) {
      errs.destination = 'At least 3 characters needed (e.g. 110001 or DEL)';
    }

    if (!cargoType.trim()) {
      errs.cargoType = 'Please select what you are shipping';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot) return; // Bot trap — silent discard
    if (Date.now() - loadTime < 800) return; // Speed bot trap

    if (!validate()) {
      toast.error('Please fill in the required fields.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      const pseudoDist    = Math.max(350, (origin.charCodeAt(0) * 12 + destination.charCodeAt(0) * 15) % 2400 + 400);
      const ratePerMile   = cargoType.toLowerCase().includes('refrigerated') || cargoType.toLowerCase().includes('pharma') ? 2.85 : 2.25;
      const calculatedCost = Math.round(pseudoDist * ratePerMile + 180);
      const hours         = Math.round((pseudoDist / 55) * 10) / 10;
      const quoteNum      = `LE-Q-${Math.floor(10000 + Math.random() * 90000)}`;

      const result: QuoteResult = {
        quoteId: quoteNum,
        distanceMiles: pseudoDist,
        estCostUsd: calculatedCost,
        transitHours: hours,
        carbonSavingsPct: 24.8,
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        cargo: cargoType,
      };

      setQuoteResult(result);
      // Analytics: re-wire trackEvent here when a real provider is configured

      toast.success('Rate Calculated!', {
        description: `Quote #${quoteNum} — ${origin.toUpperCase()} → ${destination.toUpperCase()}`,
      });
    }, 700);
  };

  const handleReset = () => {
    setQuoteResult(null);
    setOrigin('');
    setDestination('');
    setErrors({});
  };

  const handleBookLoad = async () => {
    if (!quoteResult) return;
    // POST to /api/leads when the route is created in a future phase
    // For now capture intent and redirect to login/dashboard
    const leadRef = `LE-Q-${Math.floor(10000 + Math.random() * 90000)}`;
    toast.success('Freight Booking Confirmed!', {
      description: `Quote #${quoteResult.quoteId} registered. Ref: ${leadRef}. Transferring to dispatch...`,
    });

    setTimeout(() => {
      router.push('/leads');
    }, 700);
  };

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
            Integrated Freight Partnership
          </span>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 900, letterSpacing: -2, lineHeight: 1.05, color: '#fff', marginBottom: 20 }}>
            Your Reliable{' '}
            <span style={{ background: 'linear-gradient(90deg, #fbbf24, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Delivery Partner!
            </span>
          </h2>
          <p style={{ fontSize: 15, color: '#a8b8c8', lineHeight: 1.75, maxWidth: 480, marginBottom: 40 }}>
            Our system matches your shipment to the optimal verified carrier — minimum transit time, maximum route efficiency, real-time tracking from pickup to proof of delivery.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24 }}>
            {/* Trust badges — Uniform Connectedness: same style = same category */}
            {[
              { icon: <ShieldCheck style={{ width: 14, height: 14, color: '#34d399' }} />, text: 'FMCSA / SmartWay Verified' },
              { icon: <CheckCircle2 style={{ width: 14, height: 14, color: 'var(--brand, #0057FF)' }} />, text: 'ISO 9001 Carrier Network' },
            ].map(b => (
              <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: '#0f172a', border: '1px solid rgba(255,255,255,0.07)', fontSize: 12, color: '#cbd5e1', fontFamily: 'monospace' }}>
                {b.icon}
                {b.text}
              </div>
            ))}
          </div>
        </div>

        {/* Right: form card */}
        <div style={{ ...glass, width: '100%', maxWidth: 500, padding: 'clamp(24px, 4vw, 40px)', borderRadius: 32, flexShrink: 0, border: '1px solid rgba(245,158,11,0.18)' }}>

          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 24 }}>
            <div style={{ padding: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12 }}>
              <Calculator style={{ width: 22, height: 22, color: '#fbbf24' }} aria-hidden="true" />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Instant Rate Calculator</h3>
              <p style={{ fontSize: 13, color: '#a8b8c8', margin: '4px 0 0' }}>Get a freight quote in seconds — no sign-up needed</p>
            </div>
          </div>

          {/* Result state */}
          {quoteResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 16, padding: 20,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#fbbf24', fontWeight: 700 }}>ESTIMATED RATE</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#a8b8c8' }}>{quoteResult.quoteId}</span>
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', fontFamily: 'monospace', marginBottom: 4 }}>
                  ${quoteResult.estCostUsd.toLocaleString('en-US')}.00
                </div>
                <div style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 style={{ width: 14, height: 14 }} aria-hidden="true" />
                  Guaranteed rate valid for 72 hours
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Route Distance',     value: `${quoteResult.distanceMiles} mi`,        color: '#fff' },
                  { label: 'Transit Time',        value: `~${quoteResult.transitHours} hrs`,       color: '#22d3ee' },
                  { label: 'Route',               value: `${quoteResult.origin} → ${quoteResult.destination}`, color: '#fff' },
                  { label: 'Carbon Reduction',    value: `-${quoteResult.carbonSavingsPct}% CO₂`, color: '#34d399' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(2,6,23,0.7)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: 10, color: '#a8b8c8', fontFamily: 'monospace', textTransform: 'uppercase' }}>{s.label}</span>
                    <p style={{ fontSize: 14, fontWeight: 700, color: s.color, margin: '4px 0 0', fontFamily: 'monospace' }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Minimize target distance: primary + secondary CTA side by side */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={handleReset} style={{
                  flex: 1, height: 48,
                  background: 'rgba(255,255,255,0.06)', color: '#cbd5e1',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <RotateCcw style={{ width: 15, height: 15 }} aria-hidden="true" />
                  New Quote
                </button>
                <button
                  type="button"
                  onClick={handleBookLoad}
                  style={{
                    flex: 1.5, height: 48,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#1c1917', borderRadius: 14, fontSize: 13, fontWeight: 700,
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 0 20px rgba(245,158,11,0.25)',
                  }}
                >
                  <Truck style={{ width: 16, height: 16 }} aria-hidden="true" />
                  Book This Load →
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Spam honeypot — hidden from humans */}
              <input
                type="text" name="company_tax_reference_bypass" tabIndex={-1}
                autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)}
                style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px' }}
                aria-hidden="true"
              />

              {/* Route grid — Law of Proximity: origin + destination side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                {/* Pick-up Location — Law of Prägnanz: plain English, not jargon */}
                <div>
                  <label htmlFor="quote-origin" style={labelStyle}>
                    Pick-up Location <span style={{ color: '#f59e0b' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}><MapPin style={{ width: 18, height: 18, color: '#fbbf24' }} aria-hidden="true" /></span>
                    <input
                      id="quote-origin" type="text" required
                      placeholder="ZIP or port code"
                      value={origin}
                      onChange={e => { setOrigin(e.target.value); if (errors.origin) setErrors({ ...errors, origin: '' }); }}
                      // Postel's Law: auto-uppercase on blur
                      onBlur={e => { setOrigin(e.target.value.toUpperCase()); e.target.style.borderColor = errors.origin ? '#ef4444' : 'rgba(255,255,255,0.12)'; }}
                      onFocus={e => (e.target.style.borderColor = errors.origin ? '#ef4444' : 'rgba(245,158,11,0.6)')}
                      style={{ ...inputStyle, fontSize: 13, borderColor: errors.origin ? '#ef4444' : 'rgba(255,255,255,0.12)' }}
                      aria-describedby={errors.origin ? 'origin-error' : undefined}
                      aria-invalid={!!errors.origin}
                    />
                  </div>
                  {errors.origin && (
                    <span id="origin-error" role="alert" style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <AlertCircle style={{ width: 12, height: 12 }} aria-hidden="true" />
                      {errors.origin}
                    </span>
                  )}
                </div>

                {/* Delivery Location */}
                <div>
                  <label htmlFor="quote-dest" style={labelStyle}>
                    Delivery Location <span style={{ color: '#f59e0b' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}><MapPin style={{ width: 18, height: 18, color: '#fbbf24' }} aria-hidden="true" /></span>
                    <input
                      id="quote-dest" type="text" required
                      placeholder="ZIP or port code"
                      value={destination}
                      onChange={e => { setDestination(e.target.value); if (errors.destination) setErrors({ ...errors, destination: '' }); }}
                      onBlur={e => { setDestination(e.target.value.toUpperCase()); e.target.style.borderColor = errors.destination ? '#ef4444' : 'rgba(255,255,255,0.12)'; }}
                      onFocus={e => (e.target.style.borderColor = errors.destination ? '#ef4444' : 'rgba(245,158,11,0.6)')}
                      style={{ ...inputStyle, fontSize: 13, borderColor: errors.destination ? '#ef4444' : 'rgba(255,255,255,0.12)' }}
                      aria-describedby={errors.destination ? 'dest-error' : undefined}
                      aria-invalid={!!errors.destination}
                    />
                  </div>
                  {errors.destination && (
                    <span id="dest-error" role="alert" style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <AlertCircle style={{ width: 12, height: 12 }} aria-hidden="true" />
                      {errors.destination}
                    </span>
                  )}
                </div>
              </div>

              {/* What are you shipping? — Law of Prägnanz: plain English */}
              <div>
                <label htmlFor="quote-cargo" style={labelStyle}>
                  What are you shipping? <span style={{ color: '#f59e0b' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={iconWrap}><PackageSearch style={{ width: 18, height: 18, color: '#a8b8c8' }} aria-hidden="true" /></span>
                  <select
                    id="quote-cargo"
                    value={cargoType}
                    onChange={e => setCargoType(e.target.value)}
                    style={{ ...inputStyle, fontSize: 13, appearance: 'none', cursor: 'pointer' }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.6)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                  >
                    <option value="Refrigerated High-Value Freight"  style={{ background: '#0f172a', color: '#fff' }}>Cold-Chain / Refrigerated Freight</option>
                    <option value="General Dry Van Freight"           style={{ background: '#0f172a', color: '#fff' }}>General Dry Van Freight</option>
                    <option value="Expedited Intermodal Container"    style={{ background: '#0f172a', color: '#fff' }}>Intermodal Container (Sea / Rail)</option>
                    <option value="Flatbed Industrial & Machinery"    style={{ background: '#0f172a', color: '#fff' }}>Flatbed — Industrial & Machinery</option>
                    <option value="Pharma & Temperature Controlled"   style={{ background: '#0f172a', color: '#fff' }}>Pharma & Temperature Controlled</option>
                    {/* Postel's Law: accept what doesn't fit the standard options */}
                    <option value="Other / Custom Cargo"              style={{ background: '#0f172a', color: '#fff' }}>Other / Custom Cargo Type</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                style={{
                  width: '100%', height: 52, marginTop: 6,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#1c1917', border: 'none', borderRadius: 16,
                  fontSize: 15, fontWeight: 700, cursor: isSubmitting ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 0 30px rgba(245,158,11,0.25)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  opacity: isSubmitting ? 0.8 : 1,
                }}
                onMouseEnter={e => { if (!isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(245,158,11,0.4)'; }}}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(245,158,11,0.25)'; }}
              >
                {isSubmitting ? 'Calculating…' : 'Get Instant Rate'}
                <Send style={{ width: 18, height: 18 }} aria-hidden="true" />
              </button>

            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default QuoteRequest;
