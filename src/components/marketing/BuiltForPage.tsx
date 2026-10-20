// ─── "Built for" page template (fleet owners, transporters, 3PLs) ─────────────
// Use-case pages by buyer type (research: reports/LogisticsEdge growth roadmap India.md, item 23). Each page names
// the buyer's day, the problems in their words and the screens that answer them; nothing the app doesn't do.

import Link from 'next/link';
import { MarketingShell, PageHero, Band, CardGrid, ClosingCta } from './Page';

export type BuiltFor = {
  kicker: string;
  title: React.ReactNode;
  lede: string;
  /** A module still for the hero card (public/media/modules) */
  image?: string;
  problems: { title: string; text: string }[];
  screens: { name: string; text: string }[];
  closing: { title: string; text: string };
};

export function BuiltForPage({ data }: { data: BuiltFor }) {
  return (
    <MarketingShell>
      <PageHero kicker={data.kicker} title={data.title} lede={data.lede} image={data.image} />
      <Band id="problems" kicker="Your day" title="What gets in the way">
        <CardGrid items={data.problems} />
      </Band>
      <Band id="screens" kicker="In the app" title="The screens you would use" sand>
        <ul className="mk-screen-list">
          {data.screens.map(s => (
            <li key={s.name}>
              <b>{s.name}</b>
              <span>{s.text}</span>
            </li>
          ))}
        </ul>
        <p className="mk-fine">
          See them together on the <Link href="/#modules">home page</Link>, or compare with{' '}
          <Link href="/compare/excel-and-whatsapp">Excel and WhatsApp</Link>.
        </p>
      </Band>
      <ClosingCta title={data.closing.title} text={data.closing.text} />
    </MarketingShell>
  );
}
