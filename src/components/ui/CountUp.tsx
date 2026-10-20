'use client';
// ─── A whole number that counts up from 0 when it first appears ──────────────────
// Used for freshly loaded figures (the Today status strip), so a new number reads as new. Screen readers get the
// final value at once; anything that isn't a whole number, and reduced motion, is shown as is. Later changes to
// the value are shown directly, without counting again. Motion rules: docs/DESIGN_SYSTEM.md §4.4.

import { useLayoutEffect, useRef, useState } from 'react';

export function CountUp({ value, duration = 480 }: { value: string | number; duration?: number }) {
  const target = typeof value === 'number' ? value : /^\d+$/.test(value) ? Number(value) : NaN;
  const [shown, setShown] = useState<number | null>(null);
  // Set only when a count finishes, so React's dev double-run of effects still plays it once
  const done = useRef(false);

  // Layout effect: the first painted frame is already 0, so the final value never flashes before the count
  useLayoutEffect(() => {
    if (done.current || !Number.isInteger(target) || target <= 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { done.current = true; return; }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      if (k < 1) {
        setShown(Math.round(target * (1 - Math.pow(1 - k, 3))));
        raf = requestAnimationFrame(step);
      } else {
        done.current = true;
        setShown(null);
      }
    };
    setShown(0);
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); setShown(null); };
  }, [target, duration]);

  if (shown === null) return <>{value}</>;
  return (
    <>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{value}</span>
    </>
  );
}
