'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * ModalPortal — renders children directly into document.body via a React portal.
 * This ensures modals always appear on top of everything, independent of
 * any parent element's overflow, transform, or z-index stacking context.
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  const elRef = useRef<HTMLDivElement | null>(null);

  if (!elRef.current) {
    elRef.current = document.createElement('div');
  }

  useEffect(() => {
    const el = elRef.current!;
    document.body.appendChild(el);
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.removeChild(el);
      document.body.style.overflow = '';
    };
  }, []);

  return createPortal(children, elRef.current);
}
