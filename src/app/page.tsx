// ─── Home ─────────────────────────────────────────────────────────────────────
// The scroll film (frame 0 is server-rendered, the rest stream in), then the product, the problems as
// stacking cards, the modules rail, the rate calculator and answers. Design: docs/DESIGN_SYSTEM.md §8.

import '@/components/marketing/marketing.css';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { Hero } from '@/components/home/Hero';
import LogisticsSections from '@/components/home/LogisticsSections';

export default function Home() {
  return (
    <div className="mk">
      <SiteHeader />
      <main id="main">
        <Hero />
        <LogisticsSections />
      </main>
      <SiteFooter />
    </div>
  );
}
