'use client';
// ─── "What's in the workspace": a horizontal rail of module cards ─────────────
// Phones and tablets: native horizontal scroll with snap points, so touch, trackpad and keyboard all work; the
// buttons are a convenience for mouse users. Laptops and up (CSS, ≥1024 px): the cards become tall slivers and the
// one under the pointer or keyboard focus widens into a full card while its neighbours make room.
// Images come from the caller (public/media/modules).

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export type Module = { name: string; text: string; image: string };

export function ModuleRail({ modules }: { modules: Module[] }) {
  const railRef = useRef<HTMLUListElement | null>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const [active, setActive] = useState(0);
  // Hover intent: the cards move as one widens, so wait for the pointer to settle before switching
  const hoverTimer = useRef<number | undefined>(undefined);
  const hoverTo = (i: number) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setActive(i), 90);
  };
  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const onScroll = () => setEdge({
      start: rail.scrollLeft < 8,
      end: rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8,
    });
    onScroll();
    rail.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      rail.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const page = (dir: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>('.mk-module');
    const stepPx = card ? card.offsetWidth + 16 : rail.clientWidth * 0.8;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.scrollBy({ left: dir * stepPx, behavior: smooth ? 'smooth' : 'auto' });
  };

  return (
    <div className="mk-rail-wrap">
      <div className="mk-rail-controls">
        <button type="button" className="mk-round-btn" onClick={() => page(-1)} disabled={edge.start} aria-label="Previous modules">
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <button type="button" className="mk-round-btn" onClick={() => page(1)} disabled={edge.end} aria-label="Next modules">
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
      <ul ref={railRef} className="mk-rail" aria-label="Modules in a workspace">
        {modules.map((m, i) => (
          <li
            key={m.name}
            className="mk-module"
            tabIndex={0}
            data-active={i === active || undefined}
            onPointerEnter={() => hoverTo(i)}
            onPointerLeave={() => window.clearTimeout(hoverTimer.current)}
            onFocus={() => setActive(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- already sized WebP stills */}
            <img src={m.image} alt="" width={1280} height={720} loading="lazy" decoding="async" />
            <span className="mk-module-spine" aria-hidden="true">{m.name}</span>
            <div className="mk-module-body">
              <h3>{m.name}</h3>
              <p>{m.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
