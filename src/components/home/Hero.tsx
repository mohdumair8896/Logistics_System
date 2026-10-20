'use client';
// ─── Home hero: the scroll film ───────────────────────────────────────────────
// 249 frames (public/frames) scrubbed by scroll: warehouse aisle → dock door → golden-hour yard → clouds →
// city → a van leaving a parcel at the door. Five chapters ride on it, one per screen a load passes through.
// Frame 0 is a server-rendered <img>, so the hero is visible on first paint with no loader; the canvas takes
// over once frames stream in. Frames are kept compressed and only those near the scroll position are decoded
// (see the loader below). Design: docs/DESIGN_SYSTEM.md §8.3.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

const TOTAL_FRAMES = 249;
const frameName = (i: number) => `frame_${String(i).padStart(3, '0')}.webp`;
const frameSrc = (i: number) => `/frames/${frameName(i)}`;

// Each chapter starts at this share of the scroll, timed to the film: aisle and dock door (Book), the yard
// (Allocate), sky and city from above (Track), the street (Deliver), the parcel at the door (Bill).
// Before the first chapter the intro copy is showing.
const CHAPTERS = [
  {
    at: 0.12,
    step: 'Book',
    screen: 'Orders',
    title: 'Take the booking once',
    text: 'Customer, pickup, drop, weight and deadline go in once. The same record follows the load all the way to the invoice.',
    record: { id: 'ORD-1042', meta: 'Lucknow → Kanpur · 9 t · due 6 pm', status: 'Waiting for truck', tone: 'warn' },
  },
  {
    at: 0.3,
    step: 'Allocate',
    screen: 'Allocation',
    title: 'Put it on a free truck',
    text: 'Loads waiting for a truck sit next to the trucks and drivers that are free right now. Allocate from the same screen.',
    record: { id: 'UP32AB4521', meta: '32 ft closed body · Ravi Kumar', status: 'Available', tone: 'done' },
  },
  {
    at: 0.46,
    step: 'Track',
    screen: 'Corridor Tracking',
    title: 'Know where it is without a call',
    text: 'The driver opens a trip link on their phone and their position comes in while it is open. Your customer gets a tracking page with no login.',
    record: { id: 'TRP-2207', meta: 'Near Unnao · last position 4 min ago', status: 'In transit', tone: 'active' },
  },
  {
    at: 0.72,
    step: 'Deliver',
    screen: 'Delivery & POD',
    title: 'Close the trip at the door',
    text: 'At handover, record who received the load and any damage deduction. The trip closes with its proof of delivery.',
    record: { id: 'TRP-2207', meta: 'Received by S. Verma · deduction ₹0', status: 'Delivered', tone: 'done' },
  },
  {
    at: 0.88,
    step: 'Bill',
    screen: 'Invoices & Billing',
    title: 'Bill from the delivered trip',
    text: 'The invoice is built from the trip: freight and charges, less any deduction. It shows the 5% GST your customer pays under reverse charge. Download the PDF and mark it paid.',
    record: { id: 'INV-0187', meta: 'From TRP-2207 · PDF ready', status: 'Unpaid', tone: 'warn' },
  },
] as const;

const TONE_CLASS = { warn: 'mk-tag-warn', done: 'mk-tag-done', active: 'mk-tag-active' } as const;

function chapterAt(p: number) {
  let idx = -1;
  for (let i = 0; i < CHAPTERS.length; i++) if (p >= CHAPTERS[i].at) idx = i;
  return idx;
}

export function Hero() {
  const trackRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [live, setLive] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) return;
    setLive(true);

    const track = trackRef.current, stage = stageRef.current, canvas = canvasRef.current;
    if (!track || !stage || !canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Phones, Save-Data and 2G get the 960×540 set (every 2nd frame, public/frames/m); everyone else gets all 249
    // frames at 1280×720.
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const lite = !!conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? '') || window.matchMedia('(max-width: 640px)').matches;
    const step = lite ? 2 : 1;
    const src = (i: number) => (lite ? `/frames/m/${frameName(i)}` : `/frames/${frameName(i)}`);
    const canBitmap = typeof createImageBitmap === 'function';

    // Frames arrive as compressed blobs (2–12 MB in all). Only those near the scroll position are decoded into
    // bitmaps, off the main thread, and the furthest are closed again. Decoding all 249 at 1280×720 would take
    // about 918 MB, enough for a phone browser to kill the tab.
    const CACHE = 32;            // decoded frames kept at most
    const AHEAD = 12 * step;     // frames either side of the scroll position worth decoding
    const blobs: (Blob | null)[] = new Array(TOTAL_FRAMES).fill(null);
    const decoded = new Map<number, ImageBitmap | HTMLImageElement>();
    const decoding = new Set<number>();
    let disposed = false;
    let target = 0, current = 0, raf = 0, drawn = -1, activeIdx = -1;

    const wantIndex = (p: number) => Math.round(p * (TOTAL_FRAMES - 1));

    const paint = (img: ImageBitmap | HTMLImageElement, idx: number) => {
      const iw = 'naturalWidth' in img ? img.naturalWidth : img.width;
      const ih = 'naturalHeight' in img ? img.naturalHeight : img.height;
      const w = canvas.width, h = canvas.height;
      const scale = Math.max(w / iw, h / ih);
      const dw = iw * scale, dh = ih * scale;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      drawn = idx;
      if (!stage.dataset.ready) stage.dataset.ready = 'true';
    };

    const evict = (center: number) => {
      if (decoded.size <= CACHE) return;
      const furthest = [...decoded.keys()].sort((a, b) => Math.abs(b - center) - Math.abs(a - center));
      for (const k of furthest.slice(0, decoded.size - CACHE)) {
        if (k === drawn) continue;
        const frame = decoded.get(k);
        if (frame && 'close' in frame) frame.close();
        decoded.delete(k);
      }
    };

    const decodeOne = (i: number) => {
      const blob = blobs[i];
      if (!blob || decoded.has(i) || decoding.has(i)) return;
      decoding.add(i);
      createImageBitmap(blob)
        .then(bmp => {
          decoding.delete(i);
          if (disposed) { bmp.close(); return; }
          decoded.set(i, bmp);
          const want = wantIndex(current);
          // Repaint only if this frame is closer to where the viewer is than what is on screen.
          if (drawn < 0 || Math.abs(i - want) < Math.abs(drawn - want)) paint(bmp, i);
          evict(want);
        })
        .catch(() => decoding.delete(i));
    };

    const decodeAround = (want: number) => {
      if (!canBitmap) return;
      for (let d = 0; d <= AHEAD; d++) { decodeOne(want + d); decodeOne(want - d); }
    };

    const draw = (p: number, force = false) => {
      const want = wantIndex(p);
      // Nearest frame already decoded, searching outwards from the one we want.
      let idx = -1;
      for (let d = 0; d < TOTAL_FRAMES && idx < 0; d++) {
        if (decoded.has(want - d)) idx = want - d;
        else if (decoded.has(want + d)) idx = want + d;
      }
      if (idx >= 0 && (idx !== drawn || force)) paint(decoded.get(idx)!, idx);
      decodeAround(want);
    };

    const apply = (p: number) => {
      track.style.setProperty('--p', p.toFixed(4));
      draw(p);
      const next = chapterAt(p);
      if (next !== activeIdx) { activeIdx = next; setActive(next); }
    };

    const tick = () => {
      current += (target - current) * 0.16;
      if (Math.abs(target - current) < 0.0004) current = target;
      apply(current);
      raf = current === target ? 0 : requestAnimationFrame(tick);
    };

    const onScroll = () => {
      // How far the pinned wrapper can travel inside the track is the length of the film.
      const rect = track.getBoundingClientRect();
      const run = rect.height - (stage.parentElement ?? stage).getBoundingClientRect().height;
      target = run > 0 ? Math.min(1, Math.max(0, -rect.top / run)) : 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = stage.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      draw(current, true);
      onScroll();
    };

    // Two passes: every 8th frame so the whole film is roughly there, then the frames in between.
    const order: number[] = [];
    for (let i = 0; i < TOTAL_FRAMES; i += 8) order.push(i);
    for (let i = 0; i < TOTAL_FRAMES; i += step) if (i % 8) order.push(i);

    let cursor = 0;
    const loadNext = () => {
      if (disposed || cursor >= order.length) return;
      const i = order[cursor++];
      if (canBitmap) {
        fetch(src(i))
          .then(r => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
          .then(blob => {
            if (disposed) return;
            blobs[i] = blob;
            if (drawn < 0 || Math.abs(i - wantIndex(current)) <= AHEAD) decodeOne(i);
          })
          .catch(() => {})
          .finally(loadNext);
      } else {
        // Older browsers: decoded <img> elements, as before
        const img = new Image();
        img.decoding = 'async';
        img.src = src(i);
        img.decode()
          .then(() => {
            if (disposed) return;
            decoded.set(i, img);
            const want = wantIndex(current);
            if (drawn < 0 || Math.abs(i - want) < Math.abs(drawn - want)) paint(img, i);
          })
          .catch(() => {})
          .finally(loadNext);
      }
    };
    for (let k = 0; k < 6; k++) loadNext();

    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    window.addEventListener('scroll', onScroll, { passive: true });
    resize();

    return () => {
      disposed = true;
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
      decoded.forEach(frame => { if ('close' in frame) frame.close(); });
      decoded.clear();
    };
  }, []);

  const scrollIntoFilm = () => {
    const track = trackRef.current;
    if (!track) return;
    const run = track.offsetHeight - window.innerHeight;
    window.scrollTo({ top: track.offsetTop + run * CHAPTERS[0].at + 2, behavior: 'smooth' });
  };

  return (
    <section ref={trackRef} id="how" className={`mk-film${live ? ' mk-film-live' : ''}`} aria-labelledby="hero-title">
      <div className="mk-film-sticky">
        <div ref={stageRef} className="mk-film-stage" data-chapter={active}>
          {/* eslint-disable-next-line @next/next/no-img-element -- the first frame must paint before any script runs */}
          <img
            className="mk-film-poster"
            src={frameSrc(0)}
            alt=""
            width={1280}
            height={720}
            fetchPriority="high"
            decoding="async"
          />
          <canvas ref={canvasRef} className="mk-film-canvas" aria-hidden="true" />
          <div className="mk-film-scrim" aria-hidden="true" />

          <div className="mk-film-intro">
            <p className="mk-film-pill"><span aria-hidden="true" />For fleet owners, transporters and 3PLs in India</p>
            <h1 id="hero-title" className="mk-film-title">
              Run your trucks from <mark className="mk-mark">one screen</mark>, not fifty phone calls.
            </h1>
            <p className="mk-film-lede">
              Take the booking, put it on a free truck, share a tracking link, close the trip at handover and raise the
              GST invoice. Dispatch and accounts work from the same list.
            </p>
            <div className="mk-cta-row">
              <Link href="/pricing" className="btn btn-primary mk-btn mk-glow">Start a workspace</Link>
              <Link href="#quote" className="btn mk-btn mk-btn-glass">Get a rate for a load</Link>
            </div>
            <button type="button" className="mk-film-cue" onClick={scrollIntoFilm}>
              Scroll to follow a load
              <ChevronDown size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Overlaid on the film while it plays; a plain list below it with reduced motion or no script */}
        <div className="mk-film-story">
          <h2 className="mk-film-story-title">How a load moves</h2>
          <ol className="mk-chapters">
            {CHAPTERS.map((c, i) => (
              <li key={c.step} className="mk-chapter" data-active={i === active || undefined}>
                <p className="mk-chapter-step">
                  <span className="mk-chapter-num">{String(i + 1).padStart(2, '0')}</span>
                  {c.step}
                  <span className="mk-chapter-screen">{c.screen}</span>
                </p>
                <h3 className="mk-chapter-title">{c.title}</h3>
                <p className="mk-chapter-text">{c.text}</p>
                <div className="mk-record">
                  <div>
                    <small>Example record</small>
                    <b className="mk-mono">{c.record.id}</b>
                    <span>{c.record.meta}</span>
                  </div>
                  <span className={`mk-tag ${TONE_CLASS[c.record.tone]}`}>{c.record.status}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mk-film-rail" aria-hidden="true">
          <ol>
            {CHAPTERS.map((c, i) => (
              <li key={c.step} data-done={i <= active || undefined}>{c.step}</li>
            ))}
          </ol>
          <div className="mk-film-rail-bar"><span /></div>
        </div>
      </div>
    </section>
  );
}
