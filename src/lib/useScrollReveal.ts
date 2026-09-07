'use client';

import { useEffect, useRef } from 'react';

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  safetyMs?: number;
}

/**
 * Attaches an IntersectionObserver to a DOM element.
 * Adds class 'revealed' once the element enters the viewport.
 * Disconnects after first trigger — animation fires exactly once.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const {
    threshold = 0.12,
    rootMargin = '0px 0px -60px 0px',
    safetyMs = 3000,
  } = options;

  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const safety = setTimeout(() => {
      el.classList.add('revealed');
    }, safetyMs);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed');
          clearTimeout(safety);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(safety);
    };
  }, [threshold, rootMargin, safetyMs]);

  return ref;
}
