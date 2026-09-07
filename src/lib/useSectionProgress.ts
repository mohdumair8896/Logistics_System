'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Tracks scroll progress (0-1) through a sticky section track.
 * 0 = top of section just hit the top of the viewport.
 * 1 = bottom of section just left the bottom of the viewport.
 * Uses requestAnimationFrame so it stays off the main thread.
 */
export function useSectionProgress(ref: React.RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0);
  const rafId = useRef<number | null>(null);
  const lastP  = useRef(0);

  useEffect(() => {
    const tick = () => {
      const el = ref.current;
      if (!el) return;
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const scrolled = window.scrollY - el.offsetTop;
      const p = Math.max(0, Math.min(1, scrolled / scrollable));
      if (Math.abs(p - lastP.current) > 0.001) {
        lastP.current = p;
        setProgress(p);
      }
    };

    const onScroll = () => {
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        tick();
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    tick(); // set initial value
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [ref]);

  return progress;
}

/** Map p from [lo, hi] to [0, 1], clamped. */
export function remap(p: number, lo: number, hi: number): number {
  if (hi <= lo) return p >= hi ? 1 : 0;
  return Math.max(0, Math.min(1, (p - lo) / (hi - lo)));
}
