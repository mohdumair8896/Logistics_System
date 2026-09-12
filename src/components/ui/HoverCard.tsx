'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface HoverCardContextValue {
  isOpen: boolean;
  openCard: () => void;
  closeCard: () => void;
}

const HoverCardContext = React.createContext<HoverCardContextValue | null>(null);

function useHoverCard() {
  const ctx = React.useContext(HoverCardContext);
  if (!ctx) throw new Error('HoverCard components must be used within <HoverCard>');
  return ctx;
}

export function HoverCard({
  children,
  openDelay = 150,
  closeDelay = 200,
}: {
  children: React.ReactNode;
  openDelay?: number;
  closeDelay?: number;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const openTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const closeTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const openCard = React.useCallback(() => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    openTimeout.current = setTimeout(() => setIsOpen(true), openDelay);
  }, [openDelay]);

  const closeCard = React.useCallback(() => {
    if (openTimeout.current) clearTimeout(openTimeout.current);
    closeTimeout.current = setTimeout(() => setIsOpen(false), closeDelay);
  }, [closeDelay]);

  React.useEffect(() => {
    return () => {
      if (openTimeout.current) clearTimeout(openTimeout.current);
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };
  }, []);

  return (
    <HoverCardContext.Provider value={{ isOpen, openCard, closeCard }}>
      <div
        className="relative inline-block"
        onMouseEnter={openCard}
        onMouseLeave={closeCard}
      >
        {children}
      </div>
    </HoverCardContext.Provider>
  );
}

export function HoverCardTrigger({
  render,
  children,
  className,
  ...props
}: {
  render?: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  children?: React.ReactNode;
  className?: string;
  delay?: number;
  closeDelay?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  if (render) {
    return render;
  }

  return (
    <div className={cn('inline-block cursor-pointer', className)} {...props}>
      {children}
    </div>
  );
}

export function HoverCardContent({
  children,
  className,
  side = 'bottom',
  align = 'center',
}: {
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
}) {
  const { isOpen, openCard, closeCard } = useHoverCard();

  const sideStyle = side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';
  const alignStyle =
    align === 'start' ? 'left-0' : align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: side === 'top' ? 4 : -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: side === 'top' ? 4 : -4 }}
          transition={{ duration: 0.12 }}
          onMouseEnter={openCard}
          onMouseLeave={closeCard}
          style={{ zIndex: 999 }}
          className={cn(
            'absolute w-64 rounded-xl border border-[var(--border,#E6E4DF)] bg-[var(--surface-1,#FFFFFF)] p-3.5 shadow-xl text-xs text-[var(--text-high,#141414)]',
            sideStyle,
            alignStyle,
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
