'use client';

import React, { useEffect, useRef, useState } from 'react';
import { HeroOverlay } from './HeroOverlay';
import { JourneyHUD } from './JourneyHUD';

const TOTAL_FRAMES = 249;
const READY_TIMEOUT_MS = 2000;

export default function ScrollJourneyCanvas() {
  const canvasRef    = useRef<HTMLCanvasElement | null>(null);
  const imagesRef    = useRef<HTMLImageElement[]>([]);
  const isReadyRef   = useRef(false);
  const targetProg   = useRef(0);
  const currentProg  = useRef(0);
  const rafId        = useRef<number | null>(null);

  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady,     setIsReady]     = useState(false);
  const [hasFrames,   setHasFrames]   = useState(false);
  const [progress,    setProgress]    = useState(0);

  // ── Single unified useEffect — runs once on mount, [] is always [] ──
  useEffect(() => {
    let mounted = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Render one frame onto the canvas ────────────────────────────
    const renderFrame = (p: number) => {
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;
      const w = canvas.width, h = canvas.height;
      if (!w || !h) return;

      const idx = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(p * (TOTAL_FRAMES - 1))));
      const img = imagesRef.current[idx];

      if (img?.complete && img.naturalWidth > 0) {
        const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        const sw = img.naturalWidth * scale, sh = img.naturalHeight * scale;
        ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh);
      } else {
        // Deep-space cinematic gradient fallback
        const grd = ctx.createLinearGradient(0, 0, 0, h);
        grd.addColorStop(0,    '#020617');
        grd.addColorStop(0.35, '#0c1a35');
        grd.addColorStop(0.65, '#081426');
        grd.addColorStop(1,    '#020617');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
      }
    };

    // ── Resize: set physical pixel buffer, CSS display via style ────
    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = Math.round(window.innerWidth  * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width  = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      renderFrame(currentProg.current);
    };

    // ── Scroll → 0–1 progress scoped to #journey-track ─────────────
    const handleScroll = () => {
      const track = document.getElementById('journey-track');
      if (!track) {
        targetProg.current = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 3)));
        return;
      }
      const top      = track.getBoundingClientRect().top + window.scrollY;
      const scrollable = track.offsetHeight - window.innerHeight;
      const scrolled   = window.scrollY - top;
      targetProg.current = Math.min(1, Math.max(0, scrollable > 0 ? scrolled / scrollable : 0));
    };

    // ── 60fps lerp animation loop ───────────────────────────────────
    const animate = () => {
      currentProg.current += (targetProg.current - currentProg.current) * 0.15;
      if (mounted) setProgress(currentProg.current);
      renderFrame(currentProg.current);
      rafId.current = requestAnimationFrame(animate);
    };

    // Start render loop & listeners immediately
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleResize();
    handleScroll();
    rafId.current = requestAnimationFrame(animate);

    // ── Safety timeout: always show hero within 2 seconds ──────────
    const markReady = () => {
      if (!isReadyRef.current && mounted) {
        isReadyRef.current = true;
        setIsReady(true);
      }
    };
    const safetyTimer = setTimeout(markReady, READY_TIMEOUT_MS);

    // ── Preload frame images ────────────────────────────────────────
    let responded = 0, successes = 0;
    const images: HTMLImageElement[] = [];

    const onResponse = (ok: boolean) => {
      if (!mounted) return;
      responded++;
      if (ok) successes++;
      setLoadedCount(responded);

      if (successes >= 15) {
        if (mounted) setHasFrames(true);
        markReady();
      }
      if (responded >= TOTAL_FRAMES) markReady();
    };

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `/frames/frame_${String(i).padStart(3, '0')}.webp`;
      img.onload  = () => onResponse(true);
      img.onerror = () => onResponse(false);
      images.push(img);
    }
    imagesRef.current = images;

    // ── Cleanup ─────────────────────────────────────────────────────
    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []); // ← ALWAYS [] — never changes size

  const handleScrollClick = () => {
    const track = document.getElementById('journey-track');
    window.scrollTo({
      top: track ? track.offsetTop + window.innerHeight * 0.5 : window.innerHeight * 1.5,
      behavior: 'smooth',
    });
  };

  const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#020617', overflow: 'hidden', userSelect: 'none' }}>

      {/* Deep-space glow when no frames */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 110% 70% at 50% 20%, #0d2a4a 0%, #020617 60%)',
        opacity: hasFrames ? 0 : 1, transition: 'opacity 1s',
      }} />

      {/* Canvas — physical resolution via .width/.height, CSS size via style */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive 3D animated logistics freight corridor visualization"
        style={{
          position: 'absolute', inset: 0, display: 'block', pointerEvents: 'none',
          opacity: (isReady && hasFrames) ? 1 : 0,
          transition: 'opacity 1.2s ease',
        }}
      />

      {/* Cinematic vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
        background: 'linear-gradient(to top, rgba(2,6,23,0.92) 0%, transparent 35%, rgba(2,6,23,0.5) 100%)',
      }} />

      {/* Loading screen — fades out once isReady */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#020617',
        opacity: isReady ? 0 : 1,
        pointerEvents: isReady ? 'none' : 'auto',
        transition: 'opacity 0.7s ease',
      }}>
        <div style={{ position: 'relative', marginBottom: 32 }}>
          <div style={{ position: 'absolute', inset: -12, borderRadius: 28, background: 'rgba(245,158,11,0.12)', filter: 'blur(16px)' }} />
          <div style={{
            position: 'relative', width: 68, height: 68, borderRadius: 22,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 24, color: '#fbbf24',
            boxShadow: '0 0 40px rgba(245,158,11,0.18)',
          }}>LE</div>
        </div>
        <div style={{ textAlign: 'center', width: 260 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
            Initialising Journey Engine
          </p>
          <p style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', marginBottom: 20 }}>
            {hasFrames ? 'Streaming cinematic frames…' : 'Preparing hero experience…'}
          </p>
          <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${hasFrames ? pct : Math.min(pct + 30, 96)}%`,
              background: 'linear-gradient(90deg, #f59e0b, #fde68a)',
              borderRadius: 99, transition: 'width 0.5s ease',
            }} />
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', marginTop: 8 }}>
            {loadedCount} / {TOTAL_FRAMES} &bull; {pct}%
          </p>
        </div>
      </div>

      {/* Hero overlay — fades out on scroll, hidden during loading */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 20,
        opacity: isReady ? Math.max(0, 1 - progress * 14) : 0,
        pointerEvents: (!isReady || progress > 0.08) ? 'none' : 'auto',
        transition: 'opacity 0.15s',
      }}>
        <HeroOverlay onScrollClick={handleScrollClick} />
      </div>

      {/* Telemetry HUD — fades in on scroll */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10,
        opacity: progress > 0.04 ? 1 : 0,
        pointerEvents: progress > 0.04 ? 'auto' : 'none',
        transition: 'opacity 0.3s',
      }}>
        <JourneyHUD progress={progress} />
      </div>

    </div>
  );
}
