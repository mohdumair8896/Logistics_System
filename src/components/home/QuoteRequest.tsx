'use client';

import React, { useState } from 'react';
import {
  PackageSearch,
  Calculator,
  UserPlus,
  MapPin,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';

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
  // Form State
  const [customerId, setCustomerId] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [cargoType, setCargoType] = useState('Refrigerated High-Value Freight');
  const [honeypot, setHoneypot] = useState(''); // Spam protection trap
  const [loadTime] = useState<number>(Date.now()); // Bot speed trap

  // Errors & Status
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!origin.trim()) {
      errs.origin = 'Origin zip code or port identifier is required';
    } else if (origin.trim().length < 3) {
      errs.origin = 'Must be at least 3 characters (e.g. 90210 or USLAX)';
    }

    if (!destination.trim()) {
      errs.destination = 'Destination zip code or port identifier is required';
    } else if (destination.trim().length < 3) {
      errs.destination = 'Must be at least 3 characters (e.g. 10001 or USNYC)';
    }

    if (!cargoType.trim()) {
      errs.cargoType = 'Please select or specify cargo manifest type';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Invisible bot trap
    if (honeypot) {
      // Bot filled hidden field — fail silently
      return;
    }

    // 2. Headless rapid-submission bot trap (< 1 second)
    const timeDelta = Date.now() - loadTime;
    if (timeDelta < 800) {
      return;
    }

    // 3. Validation
    if (!validate()) {
      toast.error('Please resolve required manifest fields.');
      return;
    }

    setIsSubmitting(true);

    // Simulate AI dynamic rate matrix calculation
    setTimeout(() => {
      setIsSubmitting(false);

      // Deterministic calculation based on inputs
      const pseudoDist = Math.max(350, (origin.charCodeAt(0) * 12 + destination.charCodeAt(0) * 15) % 2400 + 400);
      const ratePerMile = cargoType.toLowerCase().includes('refrigerated') ? 2.85 : 2.25;
      const calculatedCost = Math.round(pseudoDist * ratePerMile + 180);
      const hours = Math.round((pseudoDist / 55) * 10) / 10;
      const quoteNum = `LF-Q-${Math.floor(10000 + Math.random() * 90000)}`;

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
      trackEvent({
        action: 'quote_calculated',
        category: 'calculator',
        label: quoteNum,
        value: calculatedCost,
      });

      toast.success('Instant Rate Calculated!', {
        description: `Quote ID #${quoteNum} generated for ${origin} → ${destination}.`,
      });
    }, 700);
  };

  const handleReset = () => {
    setQuoteResult(null);
    setOrigin('');
    setDestination('');
    setCustomerId('');
    setErrors({});
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
              Delivery Service Partner!
            </span>
          </h2>
          <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.75, maxWidth: 480, marginBottom: 40 }}>
            LogiFlow utilizes a decentralized mesh network of verified transport providers. Our predictive API selects the optimal carrier, ensuring maximum velocity and minimum carbon footprint for every shipment.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24 }}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(30,41,59,1))', border: '1px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, color: '#fbbf24' }}>
                CV
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Chris Vowels</p>
                <p style={{ fontSize: 12, color: '#fbbf24', margin: '4px 0 0' }}>Fleet Operations Lead & Co-Founder</p>
              </div>
            </div>

            {/* Verified badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: '#0f172a', border: '1px solid rgba(255,255,255,0.07)', fontSize: 12, color: '#cbd5e1', fontFamily: 'monospace' }}>
              <ShieldCheck style={{ width: 14, height: 14, color: '#34d399' }} />
              Verified Carrier Network (FMCSA / SmartWay)
            </div>
          </div>
        </div>

        {/* Right: form card */}
        <div style={{ ...glass, width: '100%', maxWidth: 500, padding: 'clamp(24px, 4vw, 40px)', borderRadius: 32, flexShrink: 0, border: '1px solid rgba(245,158,11,0.18)' }}>

          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 24 }}>
            <div style={{ padding: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12 }}>
              <Calculator style={{ width: 22, height: 22, color: '#fbbf24' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Instant Quote Calculator</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>Real-time dynamic rate & telemetry estimation</p>
            </div>
          </div>

          {/* Result view */}
          {quoteResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 16,
                padding: 20,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#fbbf24', fontWeight: 700 }}>
                    ESTIMATED CONTRACT RATE
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>
                    {quoteResult.quoteId}
                  </span>
                </div>

                <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', fontFamily: 'monospace', marginBottom: 4 }}>
                  ${quoteResult.estCostUsd.toLocaleString('en-US')}.00
                </div>
                <div style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 style={{ width: 14, height: 14 }} />
                  Guaranteed corridor rate valid for 72 hours
                </div>
              </div>

              {/* Specs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'rgba(2,6,23,0.7)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', textTransform: 'uppercase' }}>Route Distance</span>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '4px 0 0', fontFamily: 'monospace' }}>
                    {quoteResult.distanceMiles} Miles
                  </p>
                </div>
                <div style={{ background: 'rgba(2,6,23,0.7)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', textTransform: 'uppercase' }}>Corridor Transit</span>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#22d3ee', margin: '4px 0 0', fontFamily: 'monospace' }}>
                    ~{quoteResult.transitHours} Hours
                  </p>
                </div>
                <div style={{ background: 'rgba(2,6,23,0.7)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', textTransform: 'uppercase' }}>Origin & Destination</span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '4px 0 0', fontFamily: 'monospace' }}>
                    {quoteResult.origin} → {quoteResult.destination}
                  </p>
                </div>
                <div style={{ background: 'rgba(2,6,23,0.7)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', textTransform: 'uppercase' }}>Carbon Reduction</span>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#34d399', margin: '4px 0 0', fontFamily: 'monospace' }}>
                    -{quoteResult.carbonSavingsPct}% CO2
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    flex: 1,
                    height: 48,
                    background: 'rgba(255,255,255,0.06)',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 14,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <RotateCcw style={{ width: 15, height: 15 }} />
                  Recalculate
                </button>
                <a
                  href="/orders"
                  style={{
                    flex: 1.5,
                    height: 48,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#1c1917',
                    border: 'none',
                    borderRadius: 14,
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 0 20px rgba(245,158,11,0.25)',
                  }}
                >
                  <Truck style={{ width: 16, height: 16 }} />
                  Dispatch Load
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Invisible spam honeypot input */}
              <input
                type="text"
                name="company_tax_reference_bypass"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
                style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px' }}
                aria-hidden="true"
              />

              {/* Customer ID */}
              <div>
                <label htmlFor="quote-customer-id" style={labelStyle}>LogiFlow Customer ID (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <span style={iconWrap}><UserPlus style={{ width: 18, height: 18, color: '#94a3b8' }} /></span>
                  <input
                    id="quote-customer-id"
                    type="text"
                    value={customerId}
                    onChange={e => setCustomerId(e.target.value)}
                    placeholder="LF-####-####"
                    style={{ ...inputStyle, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, fontSize: 13 }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.6)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                  />
                </div>
              </div>

              {/* Route grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Origin */}
                <div>
                  <label htmlFor="quote-origin" style={labelStyle}>
                    Origin Zip / Port <span style={{ color: '#f59e0b' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}><MapPin style={{ width: 18, height: 18, color: '#fbbf24' }} /></span>
                    <input
                      id="quote-origin"
                      type="text"
                      required
                      value={origin}
                      onChange={e => {
                        setOrigin(e.target.value);
                        if (errors.origin) setErrors({ ...errors, origin: '' });
                      }}
                      placeholder="Ex: 90210 / LAX"
                      style={{
                        ...inputStyle,
                        fontSize: 13,
                        borderColor: errors.origin ? '#ef4444' : 'rgba(255,255,255,0.12)',
                      }}
                      onFocus={e => (e.target.style.borderColor = errors.origin ? '#ef4444' : 'rgba(245,158,11,0.6)')}
                      onBlur={e => (e.target.style.borderColor = errors.origin ? '#ef4444' : 'rgba(255,255,255,0.12)')}
                    />
                  </div>
                  {errors.origin && (
                    <span style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <AlertCircle style={{ width: 12, height: 12 }} />
                      {errors.origin}
                    </span>
                  )}
                </div>

                {/* Destination */}
                <div>
                  <label htmlFor="quote-dest" style={labelStyle}>
                    Destination Zip / Port <span style={{ color: '#f59e0b' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}><MapPin style={{ width: 18, height: 18, color: '#fbbf24' }} /></span>
                    <input
                      id="quote-dest"
                      type="text"
                      required
                      value={destination}
                      onChange={e => {
                        setDestination(e.target.value);
                        if (errors.destination) setErrors({ ...errors, destination: '' });
                      }}
                      placeholder="Ex: 10001 / NYC"
                      style={{
                        ...inputStyle,
                        fontSize: 13,
                        borderColor: errors.destination ? '#ef4444' : 'rgba(255,255,255,0.12)',
                      }}
                      onFocus={e => (e.target.style.borderColor = errors.destination ? '#ef4444' : 'rgba(245,158,11,0.6)')}
                      onBlur={e => (e.target.style.borderColor = errors.destination ? '#ef4444' : 'rgba(255,255,255,0.12)')}
                    />
                  </div>
                  {errors.destination && (
                    <span style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <AlertCircle style={{ width: 12, height: 12 }} />
                      {errors.destination}
                    </span>
                  )}
                </div>
              </div>

              {/* Cargo type */}
              <div>
                <label htmlFor="quote-cargo" style={labelStyle}>
                  Cargo Manifest Type <span style={{ color: '#f59e0b' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={iconWrap}><PackageSearch style={{ width: 18, height: 18, color: '#94a3b8' }} /></span>
                  <select
                    id="quote-cargo"
                    value={cargoType}
                    onChange={e => setCargoType(e.target.value)}
                    style={{
                      ...inputStyle,
                      fontSize: 13,
                      appearance: 'none',
                      cursor: 'pointer',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.6)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                  >
                    <option value="Refrigerated High-Value Freight" style={{ background: '#0f172a', color: '#fff' }}>Refrigerated High-Value Freight (Cold-Chain)</option>
                    <option value="General Dry Van Freight" style={{ background: '#0f172a', color: '#fff' }}>General Dry Van Freight</option>
                    <option value="Expedited Intermodal Container" style={{ background: '#0f172a', color: '#fff' }}>Expedited Intermodal Container</option>
                    <option value="Flatbed Industrial & Machinery" style={{ background: '#0f172a', color: '#fff' }}>Flatbed Industrial & Machinery</option>
                    <option value="Pharma & Temperature Controlled" style={{ background: '#0f172a', color: '#fff' }}>Pharma & Temperature Controlled</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%', height: 52, marginTop: 6,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#1c1917', border: 'none', borderRadius: 16,
                  fontSize: 15, fontWeight: 700, cursor: isSubmitting ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 0 30px rgba(245,158,11,0.25)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(245,158,11,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(245,158,11,0.25)'; }}
              >
                {isSubmitting ? 'Calculating Freight Rate...' : 'Request Manifest Calculation'}
                <Send style={{ width: 18, height: 18 }} />
              </button>
            </form>
          )}

        </div>
      </div>
    </section>
  );
};

export default QuoteRequest;
