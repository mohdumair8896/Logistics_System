// ─── Building blocks for the simple marketing pages ───────────────────────────
// Trust, comparison and "built for" pages share the home page's header, footer, palette and type
// (marketing.css). Server components only.

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import '@/components/marketing/marketing.css';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

export function MarketingShell({ children, current }: { children: React.ReactNode; current?: '/pricing' }) {
  return (
    <div className="mk">
      <SiteHeader current={current} />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}

/** With `image` (a module still from public/media/modules), the hero gets a picture card beside the text from 1024 px */
export function PageHero({ kicker, title, lede, image, children }: {
  kicker: string;
  title: React.ReactNode;
  lede: React.ReactNode;
  image?: string;
  children?: React.ReactNode;
}) {
  const text = (
    <>
      <p className="mk-kicker">{kicker}</p>
      <h1 className="mk-page-title">{title}</h1>
      <p className="mk-page-lede">{lede}</p>
      {children}
    </>
  );
  return (
    <section className="mk-page-hero">
      {image ? (
        <div className="mk-wrap mk-page-hero-split">
          <div className="mk-page-hero-text">{text}</div>
          <div className="mk-page-hero-media" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element -- already sized WebP stills */}
            <img src={image} alt="" width={1280} height={720} fetchPriority="high" decoding="async" />
          </div>
        </div>
      ) : (
        <div className="mk-wrap mk-page-hero-text">{text}</div>
      )}
    </section>
  );
}

export function Band({ id, kicker, title, lede, sand, children }: {
  id?: string;
  kicker?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  sand?: boolean;
  children: React.ReactNode;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} className={`mk-section mk-band${sand ? ' mk-band-sand' : ''}`} aria-labelledby={headingId}>
      <div className="mk-wrap">
        <div className="mk-band-head">
          {kicker && <p className="mk-kicker">{kicker}</p>}
          <h2 id={headingId} className="mk-h2">{title}</h2>
          {lede && <p className="mk-section-lede">{lede}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

export type CompareRow = { label: string; a: React.ReactNode; b: React.ReactNode };

/** Two-option comparison as a real table, so it reads correctly with a screen reader */
export function CompareTable({ caption, a, b, rows }: { caption: string; a: string; b: string; rows: CompareRow[] }) {
  return (
    <div className="mk-compare-wrap">
      <table className="mk-compare">
        <caption className="mk-sr">{caption}</caption>
        <thead>
          <tr>
            <th scope="col"><span className="mk-sr">Task</span></th>
            <th scope="col">{a}</th>
            <th scope="col">{b}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.label}>
              <th scope="row">{r.label}</th>
              <td>{r.a}</td>
              <td>{r.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardGrid({ items }: { items: { title: string; text: React.ReactNode }[] }) {
  return (
    <ul className="mk-card-grid">
      {items.map(i => (
        <li key={i.title}>
          <h3>{i.title}</h3>
          <p>{i.text}</p>
        </li>
      ))}
    </ul>
  );
}

export function ClosingCta({ title, text }: { title: string; text: string }) {
  return (
    <section className="mk-wrap mk-cta-band-wrap" aria-label="Next step">
      <div className="mk-cta-band">
        <div>
          <h2 className="mk-h2">{title}</h2>
          <p>{text}</p>
        </div>
        <div className="mk-cta-row">
          <Link href="/pricing" className="btn btn-primary mk-btn mk-glow">Start a workspace <ArrowRight size={16} aria-hidden="true" /></Link>
          <Link href="/#quote" className="btn btn-secondary mk-btn">Get a rate for a load</Link>
        </div>
      </div>
    </section>
  );
}
