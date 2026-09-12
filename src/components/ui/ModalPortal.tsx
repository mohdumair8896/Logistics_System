'use client';
import { useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const emptySubscribe = () => () => {};

/**
 * ModalPortal — renders children directly into document.body via a React portal.
 * This ensures modals always appear on top of everything, independent of
 * any parent element's overflow, transform, or z-index stacking context.
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isMounted || typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
