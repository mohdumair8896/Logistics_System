'use client';
// ─── Rate calculator → call-back request ──────────────────────────────────────
// Step 1 works out an indicative price in the browser (src/lib/pricing/indicativeQuote.ts).
// Step 2 sends name and mobile to /api/public/leads, which recomputes the estimate server-side.
// Layout: heading row, then the form beside a tall photo card, then three ways to reach us underneath.
// Funnel events (src/lib/analytics.ts) fire only with analytics consent; first-touch campaign tags travel with the
// request the visitor submits. WhatsApp options appear only when NEXT_PUBLIC_WHATSAPP_NUMBER is set.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Check, CheckCircle2, LogIn, MessageCircle, Phone, RotateCcw, Search } from 'lucide-react';
import { firstTouch, track } from '@/lib/analytics';
import { waLink, whatsappConfigured } from '@/lib/whatsapp';
import { toast } from 'sonner';
import {
  CITIES,
  RATE_CARD,
  CARGO_TYPES,
  estimateQuote,
  type CargoCode,
  type QuoteEstimate,
  type QuoteInput,
} from '@/lib/pricing/indicativeQuote';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="mk-field-error">
      <AlertCircle size={14} aria-hidden="true" />
      {message}
    </span>
  );
}

type Step = 'form' | 'estimate' | 'contact' | 'done';

/** Field name → input id, so a failed check can put the cursor where the fix is. */
const FIELD_INPUT: Record<string, string> = {
  origin: 'quote-origin', destination: 'quote-dest', vehicleCode: 'quote-vehicle', weightKg: 'quote-weight',
  name: 'quote-name', phone: 'quote-phone',
};
const focusField = (field: string) => document.getElementById(FIELD_INPUT[field] ?? '')?.focus();

const QuoteRequest: React.FC = () => {
  const [origin, setOrigin]           = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleCode, setVehicleCode] = useState<string>('CONTAINER_32FT_SXL');
  const [cargoCode, setCargoCode]     = useState<CargoCode>('GENERAL');
  const [weightKg, setWeightKg]       = useState('');
  const [honeypot, setHoneypot]       = useState('');
  const [loadTime]                    = useState<number>(() => Date.now());

  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [company, setCompany] = useState('');
  const [contactPref, setContactPref] = useState<'call' | 'whatsapp'>('call');
  const [shipFrequency, setShipFrequency] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [started, setStarted] = useState(false);

  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [step, setStep]                 = useState<Step>('form');
  const [estimate, setEstimate]         = useState<QuoteEstimate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reference, setReference]       = useState<string | null>(null);

  // The "Book this load" button disappears with this step, so hand focus to the first field
  useEffect(() => {
    if (step === 'contact') focusField('name');
  }, [step]);

  const quoteInput = (): QuoteInput => ({
    origin, destination, vehicleCode, cargoCode, weightKg: Number(weightKg),
  });

  const handleEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return; // Bot trap — silent discard

    const result = estimateQuote(quoteInput());
    if (!result.ok) {
      setErrors({ [result.field]: result.message });
      focusField(result.field);
      return;
    }
    setErrors({});
    setEstimate(result.estimate);
    setStep('estimate');
    track('quote_shown', { lane: `${result.estimate.origin.name}-${result.estimate.destination.name}`, truck: vehicleCode });
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot || Date.now() - loadTime < 1500) return; // Bot traps

    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = 'Enter your name';
    if (!/^(\+91)?[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, ''))) errs.phone = 'Enter a 10-digit Indian mobile number';
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      focusField(Object.keys(errs)[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quoteInput(), name, phone, company: company || undefined,
          contactPreference: contactPref,
          shipFrequency: shipFrequency || undefined,
          marketingOptIn,
          firstTouch: firstTouch(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Could not send your request. Please try again.');
        return;
      }
      setReference(data.reference);
      setStep('done');
      track('lead_submitted', { contact: contactPref, frequency: shipFrequency || 'unknown' });
    } catch {
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setEstimate(null);
    setReference(null);
    setErrors({});
  };

  const clearError = (field: string) => { if (errors[field]) setErrors({ ...errors, [field]: '' }); };
  const invalid = (field: string) => (errors[field] ? { 'aria-invalid': true, 'aria-describedby': `${field}-error` } : {});

  return (
    <section id="quote" className="mk-section mk-quote-sec" aria-labelledby="quote-title">
      <datalist id="quote-cities">
        {CITIES.map(c => <option key={c.name} value={c.name}>{c.state}</option>)}
      </datalist>

      <div className="mk-wrap">
        <div className="mk-split-head">
          <div>
            <p className="mk-kicker">Get a rate</p>
            <h2 id="quote-title" className="mk-h2">Need a truck? See the rate <mark className="mk-mark">first</mark>.</h2>
          </div>
          <p className="mk-section-lede">
            Pick the cities, the truck and the weight. You get an indicative price straight away. Leave your number and
            our team calls to confirm the rate and the pickup slot.
          </p>
        </div>

        <div className="mk-quote-grid">
          <div className="mk-card">
            <h3 className="mk-card-title">Indicative rate</h3>
            <p className="mk-card-sub">No sign-up needed. Prices exclude GST.</p>

            {/* Spam honeypot — hidden from people and screen readers */}
            <div className="mk-honeypot" aria-hidden="true">
              <label htmlFor="quote-website">Website</label>
              <input id="quote-website" type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
            </div>

            {step === 'form' && (
              <form
                onSubmit={handleEstimate}
                noValidate
                className="mk-form"
                onFocusCapture={() => { if (!started) { setStarted(true); track('quote_started'); } }}
              >
                <div className="mk-row">
                  <div className="mk-field">
                    <label htmlFor="quote-origin" className="mk-label">Pickup city</label>
                    <input
                      id="quote-origin" type="text" list="quote-cities" autoComplete="off" placeholder="e.g. Pune"
                      className="form-input mk-input" value={origin}
                      onChange={e => { setOrigin(e.target.value); clearError('origin'); }}
                      {...invalid('origin')}
                    />
                    <FieldError id="origin-error" message={errors.origin} />
                  </div>
                  <div className="mk-field">
                    <label htmlFor="quote-dest" className="mk-label">Delivery city</label>
                    <input
                      id="quote-dest" type="text" list="quote-cities" autoComplete="off" placeholder="e.g. Bengaluru"
                      className="form-input mk-input" value={destination}
                      onChange={e => { setDestination(e.target.value); clearError('destination'); }}
                      {...invalid('destination')}
                    />
                    <FieldError id="destination-error" message={errors.destination} />
                  </div>
                </div>

                <div className="mk-field">
                  <label htmlFor="quote-vehicle" className="mk-label">Truck type</label>
                  <select
                    id="quote-vehicle" className="form-select mk-input" value={vehicleCode}
                    onChange={e => { setVehicleCode(e.target.value); clearError('vehicleCode'); clearError('weightKg'); }}
                    {...invalid('vehicleCode')}
                  >
                    {RATE_CARD.map(v => <option key={v.code} value={v.code}>{v.label}</option>)}
                  </select>
                  <FieldError id="vehicleCode-error" message={errors.vehicleCode} />
                </div>

                <div className="mk-row">
                  <div className="mk-field">
                    <label htmlFor="quote-weight" className="mk-label">Load weight (kg)</label>
                    <input
                      id="quote-weight" type="number" inputMode="numeric" min={1} placeholder="e.g. 6000"
                      className="form-input mk-input" value={weightKg}
                      onChange={e => { setWeightKg(e.target.value); clearError('weightKg'); }}
                      {...invalid('weightKg')}
                    />
                    <FieldError id="weightKg-error" message={errors.weightKg} />
                  </div>
                  <div className="mk-field">
                    <label htmlFor="quote-cargo" className="mk-label">Cargo</label>
                    <select
                      id="quote-cargo" className="form-select mk-input" value={cargoCode}
                      onChange={e => setCargoCode(e.target.value as CargoCode)}
                    >
                      {CARGO_TYPES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary mk-submit">Show the rate</button>
              </form>
            )}

            {(step === 'estimate' || step === 'contact') && estimate && (
              <>
                <div className="mk-estimate" role="status">
                  <div className="mk-estimate-label">{estimate.origin.name} → {estimate.destination.name}, excl. GST</div>
                  <div className="mk-estimate-price">{inr(estimate.priceLow)} – {inr(estimate.priceHigh)}</div>
                  <p className="mk-estimate-note">An estimate, not a booking. Tolls, loading and the final rate are confirmed by our team.</p>
                  <dl className="mk-dl">
                    <dt>Road distance</dt><dd>about {estimate.roadKm.toLocaleString('en-IN')} km</dd>
                    <dt>Typical transit</dt><dd>{estimate.transitDays} {estimate.transitDays === 1 ? 'day' : 'days'}</dd>
                    <dt>Truck</dt><dd>{estimate.vehicle.label}</dd>
                  </dl>
                </div>

                {step === 'estimate' ? (
                  <div className="mk-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleReset}>
                      <RotateCcw size={15} aria-hidden="true" /> Change details
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => { setStep('contact'); track('quote_contact_opened'); }}>
                      Book this load
                    </button>
                    {whatsappConfigured && (
                      <a
                        className="btn btn-secondary mk-wa-btn"
                        href={waLink(`Hi, I need a ${estimate.vehicle.label} from ${estimate.origin.name} to ${estimate.destination.name}. Your site shows ${inr(estimate.priceLow)}–${inr(estimate.priceHigh)}.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => track('whatsapp_clicked', { where: 'quote' })}
                      >
                        <MessageCircle size={16} aria-hidden="true" /> Ask on WhatsApp
                      </a>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmitLead} noValidate className="mk-form">
                    <div className="mk-field">
                      <label htmlFor="quote-name" className="mk-label">Your name</label>
                      <input
                        id="quote-name" type="text" autoComplete="name" className="form-input mk-input" value={name}
                        onChange={e => { setName(e.target.value); clearError('name'); }}
                        {...invalid('name')}
                      />
                      <FieldError id="name-error" message={errors.name} />
                    </div>
                    <div className="mk-row">
                      <div className="mk-field">
                        <label htmlFor="quote-phone" className="mk-label">Mobile number</label>
                        <input
                          id="quote-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98xxxxxxxx"
                          className="form-input mk-input" value={phone}
                          onChange={e => { setPhone(e.target.value); clearError('phone'); }}
                          {...invalid('phone')}
                        />
                        <FieldError id="phone-error" message={errors.phone} />
                      </div>
                      <div className="mk-field">
                        <label htmlFor="quote-company" className="mk-label">Company <span className="mk-optional">(optional)</span></label>
                        <input
                          id="quote-company" type="text" autoComplete="organization" className="form-input mk-input" value={company}
                          onChange={e => setCompany(e.target.value)}
                        />
                      </div>
                    </div>
                    <fieldset className="mk-field mk-choice">
                      <legend className="mk-label">How should we reach you?</legend>
                      <div className="mk-choice-row">
                        <label><input type="radio" name="quote-contact" value="call" checked={contactPref === 'call'} onChange={() => setContactPref('call')} /> Phone call</label>
                        <label><input type="radio" name="quote-contact" value="whatsapp" checked={contactPref === 'whatsapp'} onChange={() => setContactPref('whatsapp')} /> WhatsApp</label>
                      </div>
                    </fieldset>
                    <div className="mk-field">
                      <label htmlFor="quote-frequency" className="mk-label">How often do you ship? <span className="mk-optional">(optional)</span></label>
                      <select id="quote-frequency" className="form-select mk-input" value={shipFrequency} onChange={e => setShipFrequency(e.target.value)}>
                        <option value="">Choose…</option>
                        <option value="once">Just this load</option>
                        <option value="monthly">About once a month</option>
                        <option value="weekly">Every week</option>
                        <option value="daily">Every day</option>
                      </select>
                    </div>
                    <p className="mk-notice">
                      We use your name and number only to contact you about this load and keep a record of the request. See our{' '}
                      <a href="/privacy">privacy policy</a>.
                    </p>
                    <label className="mk-optin">
                      <input type="checkbox" checked={marketingOptIn} onChange={e => setMarketingOptIn(e.target.checked)} />
                      <span>Also send me occasional updates about LogisticsEdge. <span className="mk-optional">(optional, you can stop any time)</span></span>
                    </label>
                    <button type="submit" className="btn btn-primary mk-submit" disabled={isSubmitting} aria-busy={isSubmitting}>
                      {isSubmitting ? 'Sending…' : contactPref === 'whatsapp' ? 'Request a WhatsApp message' : 'Request a call back'}
                    </button>
                  </form>
                )}
              </>
            )}

            {step === 'done' && (
              <div className="mk-done" role="status">
                <div className="mk-done-title"><CheckCircle2 size={20} aria-hidden="true" /> Request received</div>
                <p>
                  Our team will {contactPref === 'whatsapp' ? 'message' : 'call'} {name.trim().split(' ')[0]} on {phone}
                  {contactPref === 'whatsapp' ? ' on WhatsApp' : ''} to confirm the rate and the pickup slot.
                </p>
                {reference && <div className="mk-ref">Reference {reference}</div>}
                <button type="button" className="btn btn-secondary" onClick={handleReset}>
                  <RotateCcw size={15} aria-hidden="true" /> Price another load
                </button>
              </div>
            )}
          </div>

          {/* Tall photo card beside the form, carrying what the rate covers */}
          <figure className="mk-quote-photo">
            {/* eslint-disable-next-line @next/next/no-img-element -- a sized WebP still from the hero film */}
            <img src="/frames/frame_215.webp" alt="" width={1280} height={720} loading="lazy" decoding="async" />
            <figcaption>
              <span className="mk-quote-chip">Door to door</span>
              <ul className="mk-checks">
                <li><Check size={16} aria-hidden="true" />Full truck loads between major Indian cities</li>
                <li><Check size={16} aria-hidden="true" />Price shown before you share any details</li>
                <li><Check size={16} aria-hidden="true" />A GST invoice for every trip</li>
              </ul>
            </figcaption>
          </figure>
        </div>

        <ul className="mk-quote-tiles">
          <li>
            <Phone size={18} aria-hidden="true" />
            <h3>Call us</h3>
            <a href="tel:+915224001200" onClick={() => track('call_clicked', { where: 'quote-tiles' })}>+91 522 400 1200</a>
            <p>Mon–Fri, 9 AM – 6 PM IST</p>
          </li>
          <li>
            <Search size={18} aria-hidden="true" />
            <h3>Track a shipment</h3>
            <Link href="/track">Open the tracking page</Link>
            <p>With an order or trip number. No login.</p>
          </li>
          <li>
            <LogIn size={18} aria-hidden="true" />
            <h3>Already on LogisticsEdge?</h3>
            <Link href="/login">Sign in</Link>
            <p>Back to your workspace.</p>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default QuoteRequest;
