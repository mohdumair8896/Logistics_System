'use client';
// ─── "Sound familiar?": four problem cards that stack as you scroll ───────────
// The stacking is plain position: sticky, so it works without JavaScript. The script only adds depth:
// a card shrinks a little as the next one slides over it. Skipped when reduced motion is requested.

import { useEffect, useRef } from 'react';

export type Problem = { q: string; pain: string; fix: string };

export function ProblemStack({ problems }: { problems: Problem[] }) {
  const listRef = useRef<HTMLOListElement | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cards = Array.from(list.querySelectorAll<HTMLElement>('.mk-stack-card'));
    let raf = 0;

    const update = () => {
      raf = 0;
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        const a = card.getBoundingClientRect(), b = next.getBoundingClientRect();
        // 0 while the next card is a full card-height below, 1 once it has slid all the way over.
        const cover = Math.min(1, Math.max(0, 1 - (b.top - a.top) / a.height));
        card.style.setProperty('--cover', cover.toFixed(3));
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };

    // Only listen while the stack is on screen.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { window.addEventListener('scroll', onScroll, { passive: true }); update(); }
      else window.removeEventListener('scroll', onScroll);
    });
    io.observe(list);
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <ol ref={listRef} className="mk-stack">
      {problems.map((p, i) => (
        <li key={p.q} className="mk-stack-card" style={{ '--i': i } as React.CSSProperties}>
          <div className="mk-stack-head">
            <span className="mk-stack-num">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mk-stack-q">{p.q}</h3>
          </div>
          <p className="mk-stack-pain">{p.pain}</p>
          <p className="mk-stack-fix"><b>With LogisticsEdge</b>{p.fix}</p>
        </li>
      ))}
    </ol>
  );
}
