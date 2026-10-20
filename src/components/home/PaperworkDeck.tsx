'use client';
// ─── What a delivered trip leaves behind, as a hand of four cards ────────────────
// A fan deck: the cards sit stacked until the deck comes into view, then fan out; the hovered or focused card lifts.
// Each card is a small mock of something the app produces today (invoice PDF, e-POD record, tracking page, Tally
// XML), filled with the demo workspace's fictional data. The server renders the deck fanned, so it reads without
// script; with reduced motion it stays fanned and nothing moves. Phones get a swipeable row instead of a fan.

import { useEffect, useRef, useState } from 'react';

const CARDS = [
  { key: 'invoice', title: 'GST invoice', caption: 'Raised from the delivered trip, as a PDF you can mark paid.' },
  { key: 'pod', title: 'e-POD record', caption: 'Receiver, OTP check, signature and quantities, sealed with a hash.' },
  { key: 'track', title: 'Tracking page', caption: 'Your customer opens it with the order number. No login.' },
  { key: 'tally', title: 'Tally export', caption: '“Send to Tally” writes the sales vouchers for TallyPrime.' },
] as const;

function InvoiceDoc() {
  return (
    <>
      <div className="mk-doc-head"><span className="mk-doc-tag">PDF</span><b>Tax invoice</b><small>INV-2041 · ORD-2041</small></div>
      <dl className="mk-doc-lines">
        <div><dt>Freight, Kanpur → Lucknow</dt><dd>₹28,800</dd></div>
        <div><dt>Loading and unloading</dt><dd>₹1,200</dd></div>
        <div><dt>Damage deduction</dt><dd>₹0</dd></div>
        <div className="mk-doc-total"><dt>Total</dt><dd>₹30,000</dd></div>
      </dl>
      <p className="mk-doc-note">Reverse charge: the recipient pays GST of 5% (₹1,500), CGST 2.5% + SGST 2.5%.</p>
    </>
  );
}

function PodDoc() {
  return (
    <>
      <div className="mk-doc-head"><span className="mk-doc-tag">e-POD</span><b>Proof of delivery</b><small>TRP-2041 · Lucknow</small></div>
      <dl className="mk-doc-lines">
        <div><dt>Receiver</dt><dd>R. Verma</dd></div>
        <div><dt>Delivery OTP</dt><dd className="mk-doc-ok">Matched</dd></div>
        <div><dt>Delivered / damaged</dt><dd>7,500 / 0 kg</dd></div>
        <div><dt>Seal · count</dt><dd className="mk-doc-ok">Checked</dd></div>
      </dl>
      <svg className="mk-doc-sign" viewBox="0 0 220 56" aria-hidden="true">
        <path pathLength={1} d="M6 38c14-22 22-30 26-24s-10 26-4 26 18-30 26-30-6 28 2 28 14-18 22-18 4 14 12 14 16-12 30-12 20 8 34 6 22-10 40-12" />
      </svg>
      <p className="mk-doc-hash">SHA-256 9f2c…41ab · append-only</p>
    </>
  );
}

function TrackDoc() {
  return (
    <>
      <div className="mk-doc-head"><span className="mk-doc-tag">Link</span><b>Track ORD-2041</b><small>No login needed</small></div>
      <div className="mk-doc-route">
        <span>Kanpur</span>
        <i className="mk-doc-line"><i className="mk-doc-truck" /></i>
        <span>Lucknow</span>
      </div>
      <dl className="mk-doc-lines">
        <div><dt>Status</dt><dd className="mk-doc-ok">In transit</dd></div>
        <div><dt>Position</dt><dd>From the driver’s phone</dd></div>
        <div><dt>Truck</dt><dd>UP78 CT 4410</dd></div>
      </dl>
    </>
  );
}

function TallyDoc() {
  return (
    <>
      <div className="mk-doc-head"><span className="mk-doc-tag">XML</span><b>Send to Tally</b><small>For TallyPrime import</small></div>
      <pre className="mk-doc-code">{`<VOUCHER VCHTYPE="Sales">
  <VOUCHERNUMBER>INV-2041</VOUCHERNUMBER>
  <PARTYLEDGERNAME>
    Sunrise Agro Mills
  </PARTYLEDGERNAME>
  <PLACEOFSUPPLY>
    Uttar Pradesh
  </PLACEOFSUPPLY>
  <ISREVERSECHARGEAPPLICABLE>
    Yes
  </ISREVERSECHARGEAPPLICABLE>
</VOUCHER>`}</pre>
    </>
  );
}

const DOCS = { invoice: InvoiceDoc, pod: PodDoc, track: TrackDoc, tally: TallyDoc };

export function PaperworkDeck() {
  const deckRef = useRef<HTMLUListElement | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (deck.getBoundingClientRect().top < window.innerHeight) return; // already on screen: leave it fanned
    setOpen(false);
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      setOpen(true);
    }, { threshold: 0.35 });
    io.observe(deck);
    return () => io.disconnect();
  }, []);

  return (
    <ul ref={deckRef} className="mk-deck" data-open={open || undefined}>
      {CARDS.map((c, i) => {
        const Doc = DOCS[c.key];
        return (
          <li key={c.key} className="mk-deck-card" style={{ '--i': i } as React.CSSProperties}>
            <div className="mk-doc" aria-hidden="true"><Doc /></div>
            <p className="mk-deck-caption"><b>{c.title}</b> {c.caption}</p>
          </li>
        );
      })}
    </ul>
  );
}
