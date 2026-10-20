'use client';
// ─── Four product facts that count up as they come into view ──────────────────
// Facts about the product, not customer numbers we can't back up. The server renders the final values, so they
// are right without script; the count-up only plays for a row that starts below the fold, and never with
// reduced motion.

import { useEffect, useRef, useState } from 'react';

const STATS = [
  { value: 1, label: 'screen, Today, showing what is waiting, moving and needs a look' },
  { value: 5, label: 'stops a load passes through, each one a screen' },
  { value: 30, label: 'days’ warning before a driver’s licence runs out' },
  { value: 0, label: 'GPS boxes to fit: the driver’s phone sends the position' },
];

export function StatsRow() {
  const rowRef = useRef<HTMLDListElement | null>(null);
  const [shown, setShown] = useState(STATS.map(s => s.value));

  useEffect(() => {
    const row = rowRef.current;
    if (!row || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (row.getBoundingClientRect().top < window.innerHeight) return; // already on screen: leave the final values
    setShown(STATS.map(() => 0));
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / 1200);
        const eased = 1 - Math.pow(1 - k, 3);
        setShown(STATS.map(s => Math.round(s.value * eased)));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(row);
    return () => { io.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <dl ref={rowRef} className="mk-stats">
      {STATS.map((s, i) => (
        <div key={s.label}>
          <dt>{s.label}</dt>
          <dd>
            <span aria-hidden="true">{shown[i]}</span>
            <span className="mk-sr">{s.value}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
