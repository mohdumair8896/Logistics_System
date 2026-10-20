// ─── Home page sections below the scroll film ────────────────────────────────
// A marquee of what a workspace handles and a statement that comes into focus, then the product (zooming in as it
// scrolls up) with four facts, the problems in the fleet owner's words (as ambry.io does) as stacking cards, who it
// is for as a hover list, the modules (a rail on phones, widening cards on laptops), the paperwork a delivered trip
// leaves as a fan of cards, three getting-started steps, the rate calculator, plain answers and one closing call to
// action. Section patterns follow scrolltide.co's library (kickers, focus reveal, zoom reveal, hover list, expanded
// cards, fan deck, numbered steps, route booking, wordmark footer), redrawn in this palette.
// Every statement here describes something the app does today; no figures we can't back up.
// Design: docs/DESIGN_SYSTEM.md §8.4.

import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUp, ChevronDown } from 'lucide-react';
import QuoteRequest from './QuoteRequest';
import { ProductPreview } from './ProductPreview';
import { ProblemStack } from './ProblemStack';
import { ModuleRail, type Module } from './ModuleRail';
import { ClosingVideo } from './ClosingVideo';
import { Marquee } from './Marquee';
import { FocusStatement } from './FocusStatement';
import { StatsRow } from './StatsRow';
import { Workflow } from './Workflow';
import { AudienceList } from './AudienceList';
import { PaperworkDeck } from './PaperworkDeck';

const PROBLEMS = [
  {
    q: '“Where is the truck?”',
    pain: 'You call the driver. The driver is on the highway and doesn’t pick up. Meanwhile your customer is calling you.',
    fix: 'Each trip shows the last position sent from the driver’s phone, and you can send your customer a tracking link that needs no login.',
  },
  {
    q: 'Loads waiting, trucks standing',
    pain: 'Bookings arrive on calls and WhatsApp. By the time someone checks the register, a free truck has already left empty.',
    fix: 'One list of loads waiting for a truck, next to the trucks and drivers that are free right now. Allocate from the same screen.',
  },
  {
    q: 'Drivers you can’t put on the road',
    pain: 'A licence lapses or documents were never checked, and nobody notices until the truck is stopped.',
    fix: 'Drivers with unverified documents, and licences that expire in the next 30 days, are listed on Today under Needs attention.',
  },
  {
    q: 'Invoices typed up days later',
    pain: 'Someone copies trip details into Excel or Tally, works out the GST by hand and hopes the numbers match the trip.',
    fix: 'Close the trip at handover with the receiver’s name, and the invoice is raised from it, with the reverse-charge GST your customer owes worked out, ready as a PDF.',
  },
];

const media = (name: string) => `/media/modules/${name}.webp`;

// Screens in the app, each with an image generated with Gemini in the film's palette (public/media/modules).
const MODULES: Module[] = [
  { name: 'Orders', image: media('orders'), text: 'Every booking in one list, whether it came by phone or WhatsApp: customer, pickup, drop, weight and deadline.' },
  { name: 'Allocation', image: media('allocation'), text: 'Loads waiting for a truck, next to the trucks and drivers that are free right now.' },
  { name: 'Drivers', image: media('drivers'), text: 'Unverified documents, and licences that expire in the next 30 days, are listed on Today before they stop a truck.' },
  { name: 'Corridor Tracking', image: media('corridor-tracking'), text: 'Each live trip shows the last position sent from the driver’s phone. No GPS box to fit.' },
  { name: 'Customer Tracking', image: media('customer-tracking'), text: 'A page your customer opens with the order or trip number. No login and no app to install.' },
  { name: 'Delivery & POD', image: media('delivery-pod'), text: 'Close the trip at handover with the receiver’s name and any damage deduction.' },
  { name: 'Invoices & Billing', image: media('invoices-billing'), text: 'The invoice is built from the delivered trip and shows the GST your customer pays under reverse charge, as a PDF you can mark paid.' },
  { name: 'Leads CRM', image: media('leads-crm'), text: 'Rate requests from this site arrive as leads with the route and the estimate, ready for a call back.' },
];

const FAQS = [
  {
    q: 'Who is LogisticsEdge for?',
    a: 'Fleet owners, transporters and 3PLs who move full truck loads by road in India and run their day on phone calls, WhatsApp and a register or spreadsheet.',
  },
  {
    q: 'Do my drivers need a GPS device or an app?',
    a: 'No. For each trip the driver gets a link, opens it on their phone and allows location. Their position is sent while that page stays open.',
  },
  {
    q: 'Can my customers track their load?',
    a: 'Yes. Every order and trip has a tracking page you can share. Your customer opens it with the order or trip number, without signing in.',
  },
  {
    q: 'How is GST shown on invoices?',
    a: 'The invoice is built from the delivered trip: freight, loading and unloading charges, less any damage deduction. Freight is billed as a goods transport service under reverse charge, so the invoice adds no GST. Instead it states the 5% your customer pays to the government, split as CGST and SGST or IGST by the place of supply in their GSTIN.',
  },
  {
    q: 'Is the rate from the calculator final?',
    a: 'No. It is an indicative range from road distance and truck type, before GST, tolls and loading. Our team confirms the final rate when they call you.',
  },
  {
    q: 'What does it cost to try?',
    a: 'Creating a workspace doesn’t need a card. Plans and their limits are on the pricing page.',
  },
];

export default function LogisticsSections() {
  return (
    <>
      <Marquee />

      {/* ── One idea, brought into focus word by word ── */}
      <section className="mk-section mk-focus-sec" aria-label="What LogisticsEdge does">
        <div className="mk-wrap">
          <p className="mk-kicker">The idea</p>
          <FocusStatement text="Every load gets one record. It follows the booking onto a truck, down the highway, through the handover and into the invoice, so nobody types it twice." />
        </div>
      </section>

      {/* ── The product: the screen every chapter of the film lands on ── */}
      <section id="product" className="mk-section mk-showcase" aria-labelledby="product-title">
        <div className="mk-wrap">
          <div className="mk-split-head">
            <div>
              <p className="mk-kicker">The product</p>
              <h2 id="product-title" className="mk-h2">Every stop lands on <mark className="mk-mark">one screen</mark>.</h2>
            </div>
            <p className="mk-section-lede">
              Today is the first screen your dispatcher opens: what is waiting for a truck, what is moving, and what needs a
              look before it turns into a phone call.
            </p>
          </div>
          <figure className="mk-figure">
            <div className="mk-zoom">
              <ProductPreview />
            </div>
            <figcaption className="mk-caption">Today, shown with the demo workspace’s example data.</figcaption>
          </figure>
          <StatsRow />
        </div>
      </section>

      {/* ── Problems → what changes, as stacking cards ── */}
      <section className="mk-section mk-problems-sec" aria-labelledby="problems-title">
        <div className="mk-wrap mk-problems-grid">
          <div className="mk-problems-intro">
            <p className="mk-kicker">The problem</p>
            <h2 id="problems-title" className="mk-h2">Sound <mark className="mk-mark">familiar</mark>?</h2>
            <p className="mk-section-lede">If your day runs on phone calls, WhatsApp groups and a register, these will.</p>
          </div>
          <ProblemStack problems={PROBLEMS} />
        </div>
      </section>

      {/* ── Who it is for: a hover list into the three /for pages ── */}
      <section id="who" className="mk-section mk-aud-sec" aria-labelledby="who-title">
        <div className="mk-wrap">
          <div className="mk-split-head">
            <div>
              <p className="mk-kicker">Built for</p>
              <h2 id="who-title" className="mk-h2">Which one <mark className="mk-mark">are you</mark>?</h2>
            </div>
            <p className="mk-section-lede">
              One workspace for all three. Each page walks through the screens that matter most to the way you work.
            </p>
          </div>
          <AudienceList />
        </div>
      </section>

      {/* ── Modules, as a horizontal rail ── */}
      <section id="modules" className="mk-section mk-modules-sec" aria-labelledby="modules-title">
        <div className="mk-wrap">
          <div className="mk-split-head">
            <div>
              <p className="mk-kicker">In a workspace</p>
              <h2 id="modules-title" className="mk-h2">What’s in a <mark className="mk-mark">workspace</mark></h2>
            </div>
            <p className="mk-section-lede">One record carries a load from booking to payment, so nothing is typed twice.</p>
          </div>
        </div>
        {/* Outside .mk-wrap: the rail runs to the screen edges, with its first card on the content column */}
        <ModuleRail modules={MODULES} />
      </section>

      {/* ── What a delivered trip leaves behind: four documents fanned like a hand ── */}
      <section id="paperwork" className="mk-section mk-deck-sec" aria-labelledby="paperwork-title">
        <div className="mk-wrap">
          <div className="mk-split-head">
            <div>
              <p className="mk-kicker">After the handover</p>
              <h2 id="paperwork-title" className="mk-h2">The paperwork, <mark className="mk-mark">already done</mark>.</h2>
            </div>
            <p className="mk-section-lede">
              Close the trip at the customer’s gate and the rest comes from the same record: the invoice, the proof of
              delivery, the tracking page your customer already has, and the vouchers for Tally.
            </p>
          </div>
        </div>
        {/* Outside .mk-wrap: on phones the cards swipe edge to edge, with the first one on the content column */}
        <PaperworkDeck />
      </section>

      {/* ── Getting started: three numbered steps that light up in turn ── */}
      <Workflow />

      {/* ── Rate calculator ── */}
      <QuoteRequest />

      {/* ── Questions ── */}
      <section className="mk-section" aria-labelledby="faq-title">
        <div className="mk-wrap mk-faq">
          <div>
            <p className="mk-kicker">Questions</p>
            <h2 id="faq-title" className="mk-h2">Questions fleet owners ask</h2>
          </div>
          <div className="mk-faq-list">
            {FAQS.map(f => (
              <details key={f.q}>
                <summary>
                  {f.q}
                  <ChevronDown size={18} aria-hidden="true" />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing: a direction board over a golden-hour expressway (generated with Veo) ── */}
      <section className="mk-wrap mk-closing" aria-labelledby="next-title">
        <div className="mk-closing-band">
          <ClosingVideo src="/media/highway-loop.mp4" />
          <div className="mk-sign">
            <div className="mk-sign-inner">
              <h2 id="next-title" className="mk-sign-title">Where to next?</h2>
              <ul className="mk-sign-list">
                <li>
                  <Link href="/pricing" className="mk-sign-link">
                    <ArrowUp size={30} strokeWidth={2.5} aria-hidden="true" />
                    <span><span className="mk-sign-text">Start a workspace</span><small>Pick a plan. No card needed.</small></span>
                  </Link>
                </li>
                <li>
                  <Link href="#quote" className="mk-sign-link">
                    <ArrowRight size={30} strokeWidth={2.5} aria-hidden="true" />
                    <span><span className="mk-sign-text">Get a rate for a load</span><small>Indicative price in seconds.</small></span>
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="mk-sign-link">
                    <ArrowLeft size={30} strokeWidth={2.5} aria-hidden="true" />
                    <span><span className="mk-sign-text">Sign in</span><small>Back to your workspace.</small></span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
