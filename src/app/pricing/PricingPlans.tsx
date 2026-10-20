'use client';
// ─── Plans and the "create a workspace" dialog ────────────────────────────────
// Plans differ only by limits; every plan gets the whole product. The limits below are the ones
// /api/auth/register-subscription stores on the workspace — keep the two in step.
// No payment is taken here, so the dialog doesn't ask for one.

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, Eye, EyeOff, X } from 'lucide-react';
import { toast } from 'sonner';

type PlanId = 'FLEX' | 'GROWTH' | 'SCALE' | 'ENTERPRISE';

interface Plan {
  id: PlanId;
  name: string;
  forWho: string;
  monthly: number;
  yearly: number; // per month, billed yearly
  trucks: number;
  shipments: number;
  aiActions: number;
}

const PLANS: Plan[] = [
  { id: 'FLEX', name: 'Flex', forWho: 'For a local transporter or a small fleet.', monthly: 4999, yearly: 3999, trucks: 25, shipments: 500, aiActions: 1000 },
  { id: 'GROWTH', name: 'Growth', forWho: 'For a regional carrier running daily lanes.', monthly: 19999, yearly: 15999, trucks: 100, shipments: 2500, aiActions: 7500 },
  { id: 'SCALE', name: 'Scale', forWho: 'For a 3PL with several branches and contract customers.', monthly: 49999, yearly: 39999, trucks: 350, shipments: 10000, aiActions: 30000 },
  { id: 'ENTERPRISE', name: 'Enterprise', forWho: 'For large fleets that need higher limits.', monthly: 149999, yearly: 119999, trucks: 2000, shipments: 50000, aiActions: 100000 },
];

const INCLUDED = [
  'Orders and bookings',
  'Truck and driver allocation',
  'Trips with checkpoints and progress',
  'Live position from the driver’s phone',
  'Tracking page for your customers',
  'Delivery with receiver name and damage deduction',
  'Invoices as PDF, with the reverse-charge GST your customer pays',
  'Driver documents and licence reminders',
  'Vehicles and workshop status',
  'Warehouse and loading bays',
  'Leads list for enquiries',
  'Roles for directors, dispatchers and compliance',
];

const n = (v: number) => v.toLocaleString('en-IN');

export default function PricingPlans() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plan, setPlan] = useState<Plan | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (plan && dialog && !dialog.open) {
      dialog.showModal();
      document.getElementById('su-company')?.focus();
    }
  }, [plan]);

  const close = () => {
    dialogRef.current?.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!companyName.trim() || !adminName.trim() || !email.trim()) {
      setError('Fill in your company, your name and your work email.');
      return;
    }
    if (password.length < 10) {
      setError('Use a password of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          adminName: adminName.trim(),
          email: email.trim().toLowerCase(),
          password,
          plan: plan?.id ?? 'GROWTH',
          billingCycle: cycle === 'yearly' ? 'annual' : 'monthly',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.message || 'Your workspace could not be created. Please try again.');
        setSubmitting(false);
        return;
      }
      toast.success('Workspace created', { description: 'Next: a few questions to set it up.' });
      router.push(data.redirectUrl || '/setup');
    } catch {
      setError('No connection. Check your internet and try again.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mk-toggle" role="group" aria-label="Billing period">
        <button type="button" aria-pressed={cycle === 'monthly'} onClick={() => setCycle('monthly')}>Monthly</button>
        <button type="button" aria-pressed={cycle === 'yearly'} onClick={() => setCycle('yearly')}>
          Yearly <span className="mk-save">Save 20%</span>
        </button>
      </div>

      <div className="mk-plans" style={{ marginTop: 32 }}>
        {PLANS.map(p => {
          const price = cycle === 'monthly' ? p.monthly : p.yearly;
          return (
            <section key={p.id} className="mk-plan" aria-labelledby={`plan-${p.id}`}>
              <div>
                <h2 id={`plan-${p.id}`}>{p.name}</h2>
                <p className="mk-plan-for">{p.forWho}</p>
              </div>
              <div>
                <div className="mk-plan-price"><b>₹{n(price)}</b><span>/ month</span></div>
                <p className="mk-plan-billed">{cycle === 'yearly' ? `₹${n(price * 12)} billed yearly` : 'Billed monthly'}</p>
              </div>
              <ul className="mk-plan-limits">
                <li>Up to <b>{n(p.trucks)}</b> trucks</li>
                <li><b>{n(p.shipments)}</b> shipments a month</li>
                <li><b>{n(p.aiActions)}</b> AI agent actions a month</li>
              </ul>
              <button type="button" className="btn btn-secondary" onClick={() => { setError(''); setPlan(p); }}>
                Choose {p.name}
              </button>
            </section>
          );
        })}
      </div>

      <dialog
        ref={dialogRef}
        className="mk-dialog"
        aria-labelledby="signup-title"
        onClose={() => { setPlan(null); setShowPass(false); }}
        onClick={e => { if (e.target === e.currentTarget && !submitting) close(); }}
      >
        {plan && (
          <>
            <div className="mk-dialog-head">
              <div>
                <h2 id="signup-title">Create your workspace</h2>
                <p>{plan.name} · ₹{n(cycle === 'monthly' ? plan.monthly : plan.yearly)} / month, billed {cycle}</p>
              </div>
              <button type="button" className="mk-icon-btn" onClick={close} aria-label="Close">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mk-form">
              <div className="mk-field">
                <label htmlFor="su-company" className="mk-label">Company name</label>
                <input id="su-company" className="form-input mk-input" autoComplete="organization" value={companyName}
                  onChange={e => setCompanyName(e.target.value)} />
              </div>
              <div className="mk-field">
                <label htmlFor="su-name" className="mk-label">Your name</label>
                <input id="su-name" className="form-input mk-input" autoComplete="name" value={adminName}
                  onChange={e => setAdminName(e.target.value)} />
              </div>
              <div className="mk-field">
                <label htmlFor="su-email" className="mk-label">Work email</label>
                <input id="su-email" type="email" className="form-input mk-input" autoComplete="email" value={email}
                  onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="mk-field">
                <label htmlFor="su-password" className="mk-label">Password</label>
                <div className="mk-password">
                  <input id="su-password" type={showPass ? 'text' : 'password'} className="form-input mk-input"
                    autoComplete="new-password" aria-describedby="su-password-hint" value={password}
                    onChange={e => setPassword(e.target.value)} />
                  <button type="button" className="mk-icon-btn" onClick={() => setShowPass(s => !s)}
                    aria-label={showPass ? 'Hide password' : 'Show password'} aria-pressed={showPass}>
                    {showPass ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
                <span id="su-password-hint" className="mk-field-hint">At least 10 characters. You’ll sign in with this email and password.</span>
              </div>

              {error && (
                <div className="mk-form-error" role="alert">
                  <AlertCircle size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary mk-submit" disabled={submitting} aria-busy={submitting}>
                {submitting ? 'Creating workspace…' : 'Create workspace'}
              </button>
              <p className="mk-field-hint">No payment is taken now. Next you answer a few questions to set up your workspace.</p>
            </form>
          </>
        )}
      </dialog>

      <section className="mk-included" aria-labelledby="included-title">
        <h2 id="included-title">Every plan includes</h2>
        <ul className="mk-checks">
          {INCLUDED.map(item => <li key={item}><Check size={16} aria-hidden="true" />{item}</li>)}
        </ul>
      </section>

      <div className="mk-price-notes">
        <p>Prices are per workspace. Yearly prices are shown per month.</p>
        <p>Creating a workspace doesn’t take a payment or ask for a card.</p>
      </div>
    </>
  );
}
