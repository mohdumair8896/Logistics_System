'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check, Sparkles, Truck, ArrowRight, Zap, Building2, CreditCard, X
} from 'lucide-react';
import { toast } from 'sonner';

interface Plan {
  id: 'FLEX' | 'GROWTH' | 'SCALE' | 'ENTERPRISE';
  name: string;
  badge?: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  tagline: string;
  operationalScale: string;
  features: string[];
  highlight?: boolean;
}

function formatPrice(amount: number): string {
  return amount.toLocaleString('en-IN');
}

const PLANS: Plan[] = [
  {
    id: 'FLEX',
    name: 'Flex',
    monthlyPrice: 4999,
    annualPrice: 3999,
    currency: '₹',
    tagline: 'Ideal for local transporters, small fleets, and last-mile delivery hubs.',
    operationalScale: 'Up to 20 Vehicles · 400 Shipments/mo · 1 Branch',
    features: [
      'Core Transport Management (TMS)',
      'Real-time GPS Corridor Tracking',
      'Driver Roster & Digital Trip Sheets',
      'Electronic Proof of Delivery (e-POD)',
      'Automated GST Freight Invoicing',
      'WhatsApp Driver Notifications',
      '1,000 Autonomous AI Actions / mo',
      'Standard Business Email Support',
    ],
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    badge: 'MOST POPULAR',
    monthlyPrice: 19999,
    annualPrice: 15999,
    currency: '₹',
    tagline: 'Engineered for regional and national carriers scaling fleet operations.',
    operationalScale: 'Up to 100 Vehicles · 2,500 Shipments/mo · 5 Branches',
    highlight: true,
    features: [
      'Everything in Flex, plus:',
      'Autonomous Exception Control Tower',
      'WhatsApp Autonomous Driver Agent',
      'Customer Tracking Portal with live ETA',
      'Automated Bay & Loading Cross-Docking',
      'FASTag & E-Way Bill Auto-Sync',
      '7,500 Autonomous AI Actions / mo',
      'Role-Based Access Control (RBAC)',
      'Priority 24/7 Operations Support',
    ],
  },
  {
    id: 'SCALE',
    name: 'Scale',
    badge: 'HIGH VOLUME',
    monthlyPrice: 49999,
    annualPrice: 39999,
    currency: '₹',
    tagline: 'For high-throughput 3PL providers, multimodal freight and forwarding networks.',
    operationalScale: 'Up to 350 Vehicles · 10,000 Shipments/mo · 20 Branches',
    features: [
      'Everything in Growth, plus:',
      'Autonomous Freight Audit & Rate Leakage AI',
      'AI Dunning & Collections Recovery Agent',
      'Multimodal Air & Ocean Bill of Lading (BL)',
      'Direct Tally & SAP ERP Bi-directional Sync',
      'Custom SLA Escalation Workflows',
      '30,000 Autonomous AI Actions / mo',
      'Multi-Company & Sub-Tenant Management',
      'Dedicated Customer Success Manager',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    badge: 'CUSTOM SCALE',
    monthlyPrice: 149999,
    annualPrice: 119999,
    currency: '₹',
    tagline: 'Custom infrastructure for large conglomerates, FMCG shippers, and global 4PLs.',
    operationalScale: 'Unlimited Fleet · 50,000+ Shipments/mo · Multi-Country',
    features: [
      'Dedicated Isolated Database / Tenant Cluster',
      'Unlimited Fleet, Drivers & Monthly Shipments',
      'Custom LogiPilot AI Agent Fine-Tuning',
      'Tailored Integration Connectors (Oracle, SAP)',
      'Enterprise SSO & SCIM Provisioning',
      '99.99% Guaranteed Operational SLA',
      'Custom Data Residency & Security Auditing',
      'Executive Briefings & Dedicated Engineering',
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Checkout Form State
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [paymentRail, setPaymentRail] = useState<'CARD' | 'UPI' | 'NETBANKING'>('CARD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenCheckout = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !adminName.trim() || !email.trim() || !password.trim()) {
      toast.error('Please fill in all required account fields.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          adminName: adminName.trim(),
          email: email.trim().toLowerCase(),
          password,
          plan: selectedPlan?.id || 'GROWTH',
          billingCycle,
          paymentRail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Subscription processing failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      toast.success('Payment Approved! Subscription Activated.', {
        description: `Welcome to LogisticsEdge, ${adminName}! Launching your setup questionnaire...`,
      });

      // Forward to first-time setup questionnaire
      setTimeout(() => {
        router.push(data.redirectUrl || '/setup');
      }, 800);
    } catch {
      toast.error('Network error during checkout. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* ── Top Header ── */}
      <header className="border-b border-slate-800/80 bg-[#020617]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Truck className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight text-lg text-white">
            Logi<span className="text-amber-400">Flow</span>
          </span>
        </Link>

        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="pt-16 pb-12 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          MODULAR LOGISTICS OPERATING SYSTEM
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
          Predictable Pricing for <br />
          <span className="bg-gradient-to-r from-amber-400 via-yellow-200 to-emerald-400 bg-clip-text text-transparent">
            Autonomous Freight Operations
          </span>
        </h1>

        <p className="text-slate-400 text-base max-w-2xl mx-auto mb-8 leading-relaxed">
          Choose the right operational scale for your fleet. Upon subscription, complete the guided questionnaire to configure your organization, dispatch corridors, and autonomous policies.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-3 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Annual Billing
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              SAVE 20%
            </span>
          </button>
        </div>
      </section>

      {/* ── Plans Grid ── */}
      <section className="px-6 pb-20 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
            const isHighlight = plan.highlight;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 flex flex-col justify-between transition-all relative ${
                  isHighlight
                    ? 'bg-gradient-to-b from-slate-900/90 to-slate-950 border-2 border-amber-500/50 shadow-xl shadow-amber-500/10'
                    : 'bg-slate-900/50 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {plan.badge && (
                  <div
                    className={`absolute -top-3 left-6 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                      isHighlight
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-black text-white">{plan.name}</h3>
                  </div>

                  <p className="text-xs text-slate-400 mb-5 min-h-[36px]">
                    {plan.tagline}
                  </p>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white" suppressHydrationWarning>
                        {plan.currency}{formatPrice(price)}
                      </span>
                      <span className="text-xs text-slate-400">/ month</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <p className="text-[11px] text-emerald-400 mt-0.5" suppressHydrationWarning>
                        Billed annually ({plan.currency}{formatPrice(price * 12)}/yr)
                      </p>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-6">
                    <span className="text-[11px] text-slate-400 font-mono block">
                      Scale Target:
                    </span>
                    <span className="text-xs font-semibold text-slate-200 block mt-0.5">
                      {plan.operationalScale}
                    </span>
                  </div>

                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenCheckout(plan)}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    isHighlight
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  <span>Subscribe to {plan.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Checkout Modal ── */}
      {isCheckoutOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Subscribe to {selectedPlan.name} Plan</h3>
                <p className="text-xs text-slate-400" suppressHydrationWarning>
                  {selectedPlan.currency}
                  {formatPrice(billingCycle === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.annualPrice)}
                  /mo · Billed {billingCycle}
                </p>
              </div>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Express Logistics Pvt Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Admin Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Sharma"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="vikram@apexlogistics.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password (for Master Login) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Payment Rail Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Payment Method (Instant Commercial Activation)
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentRail('CARD')}
                    className={`py-2 px-3 rounded-xl border font-medium flex items-center justify-center gap-1.5 ${
                      paymentRail === 'CARD'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Card / Stripe
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentRail('UPI')}
                    className={`py-2 px-3 rounded-xl border font-medium flex items-center justify-center gap-1.5 ${
                      paymentRail === 'UPI'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" /> Instant UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentRail('NETBANKING')}
                    className={`py-2 px-3 rounded-xl border font-medium flex items-center justify-center gap-1.5 ${
                      paymentRail === 'NETBANKING'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" /> NetBanking
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Total Due: <strong className="text-white text-sm" suppressHydrationWarning>{selectedPlan.currency}{formatPrice(billingCycle === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.annualPrice)}</strong>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Processing Payment...</span>
                  ) : (
                    <>
                      <span>Pay &amp; Gain Access</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
