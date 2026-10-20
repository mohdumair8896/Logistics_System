'use client';
// ─── A statement that comes into focus as you scroll ──────────────────────────
// Words wait softened; a viewfinder frame (four corner brackets) travels from word to word and brings each one
// sharp, stretching to the next word's box on the way rather than jumping. Hovering a word sends the frame there.
// Without script, or with reduced motion, every word is simply sharp and there is no frame.

import { Fragment, useEffect, useRef, useState } from 'react';

type Box = { x: number; y: number; w: number; h: number };

export function FocusStatement({ text }: { text: string }) {
  const words = text.split(' ');
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lineRef = useRef<HTMLParagraphElement | null>(null);
  const [live, setLive] = useState(false);
  const [scrollIdx, setScrollIdx] = useState(-1);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [layoutTick, setLayoutTick] = useState(0);
  const idx = hoverIdx ?? scrollIdx;

  // Scroll position → how many words are in focus
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setLive(true);
    const line = lineRef.current;
    if (!line) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = line.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the top of the line reaches 80% down the screen, 1 when its bottom reaches 35%
      const start = vh * 0.8, end = vh * 0.35;
      const p = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height)));
      setScrollIdx(p <= 0 ? -1 : Math.min(words.length - 1, Math.floor(p * words.length)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    const onResize = () => { setLayoutTick(t => t + 1); onScroll(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [words.length]);

  // Measure the word in focus so the frame can travel to it
  useEffect(() => {
    const el = idx >= 0 ? wordRefs.current[idx] : null;
    setBox(live && el ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : null);
  }, [idx, live, layoutTick]);

  return (
    <p ref={lineRef} className="mk-focus" onPointerLeave={() => setHoverIdx(null)}>
      {words.map((word, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span
            ref={el => { wordRefs.current[i] = el; }}
            className="mk-focus-word"
            data-soft={(live && i > scrollIdx && i !== hoverIdx) || undefined}
            onPointerEnter={() => setHoverIdx(i)}
          >
            {word}
          </span>
        </Fragment>
      ))}
      {box && (
        <span
          className="mk-focus-frame"
          aria-hidden="true"
          style={{ transform: `translate(${box.x - 8}px, ${box.y - 4}px)`, width: box.w + 16, height: box.h + 8 }}
        >
          <i /><i /><i /><i />
        </span>
      )}
    </p>
  );
}
