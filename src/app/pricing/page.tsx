// ─── Pricing ──────────────────────────────────────────────────────────────────
// Server-rendered shell; the plan toggle and sign-up dialog are in PricingPlans.
// Design: docs/DESIGN_SYSTEM.md §8.

import type { Metadata } from 'next';
import '@/components/marketing/marketing.css';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { BadgeIndianRupee, CreditCard, Smartphone, Truck } from 'lucide-react';
import PricingPlans from './PricingPlans';

// Facts about how we charge, each backed by the product or the plan terms on this page
const FACTS = [
  { icon: Smartphone, text: 'No GPS device to buy or fit: drivers use a trip link on their phone' },
  { icon: Truck, text: 'No commission on your freight: you pay for the software only' },
  { icon: BadgeIndianRupee, text: 'Priced per workspace, billed monthly or yearly' },
  { icon: CreditCard, text: 'No card needed to create a workspace' },
];

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'LogisticsEdge plans for Indian fleet owners, transporters and 3PLs. Every plan includes the whole product; plans differ by trucks, shipments and AI actions.',
  alternates: { canonical: '/pricing' },
};

export default function PricingPage() {
  return (
    <div className="mk">
      <SiteHeader current="/pricing" />
      <main id="main" className="mk-wrap" style={{ paddingBottom: 72 }}>
        <div className="mk-price-head">
          <h1 className="mk-page-title">Pricing</h1>
          <p className="mk-section-lede">
            Every plan includes the whole product. Pick the one that fits your fleet: plans differ by how many trucks,
            shipments and AI agent actions they cover.
          </p>
          <ul className="mk-facts" aria-label="How we charge">
            {FACTS.map(f => (
              <li key={f.text}><f.icon size={18} aria-hidden="true" />{f.text}</li>
            ))}
          </ul>
          <PricingPlans />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
