'use client';
// ─── Closing band background: a muted golden-hour highway loop ────────────────
// Generated with Veo in Gemini. The band's own background (a still from the hero film) shows until the video
// is actually playing, then the video fades in over it. It is fetched and played only while the band is near the
// screen, and never with reduced motion or Save-Data, so those visitors simply keep the still.

import { useEffect, useRef } from 'react';

export function ClosingVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || conn?.saveData) return;

    const onPlaying = () => { video.dataset.playing = 'true'; };
    video.addEventListener('playing', onPlaying);

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!video.getAttribute('src')) video.src = src;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }, { rootMargin: '200px 0px' });
    io.observe(video);
    return () => {
      io.disconnect();
      video.removeEventListener('playing', onPlaying);
    };
  }, [src]);

  return <video ref={ref} className="mk-closing-video" muted loop playsInline preload="none" aria-hidden="true" />;
}
