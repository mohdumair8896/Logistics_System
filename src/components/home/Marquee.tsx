// ─── Marquee: what a workspace handles, on an endless strip ───────────────────
// The list is rendered twice so the strip can loop seamlessly; the second copy is hidden from screen readers.
// The motion is CSS only (.mk-marquee in marketing.css): it pauses on hover and stops with reduced motion.

const ITEMS = [
  'Orders',
  'Allocation',
  'Driver trip links',
  'Corridor tracking',
  'Customer tracking page',
  'Proof of delivery',
  'GST invoices',
  'Licence expiry alerts',
  'Leads CRM',
];

export function Marquee() {
  return (
    <div className="mk-marquee">
      <div className="mk-marquee-track">
        {[0, 1].map(copy => (
          <ul key={copy} aria-hidden={copy === 1 || undefined} aria-label={copy === 0 ? 'What a workspace handles' : undefined}>
            {ITEMS.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
