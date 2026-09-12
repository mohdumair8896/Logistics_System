'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { cn } from '@/lib/utils';

interface DrawerContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  direction?: 'right' | 'bottom' | 'left';
}

const DrawerContext = React.createContext<DrawerContextValue | null>(null);

function useDrawer() {
  const ctx = React.useContext(DrawerContext);
  if (!ctx) throw new Error('Drawer components must be used within <Drawer>');
  return ctx;
}

export interface DrawerProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  swipeDirection?: 'right' | 'bottom' | 'left';
  showSwipeHandle?: boolean;
}

export function Drawer({
  children,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  swipeDirection = 'right',
}: DrawerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) setUncontrolledOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  return (
    <DrawerContext.Provider value={{ open, setOpen, direction: swipeDirection }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function DrawerTrigger({
  render,
  children,
  className,
  ...props
}: {
  render?: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  children?: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDrawer();

  if (render) {
    return React.cloneElement(render, {
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        render.props.onClick?.(e);
        setOpen(true);
      },
    });
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

export function DrawerContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, setOpen, direction = 'right' } = useDrawer();

  const isBottom = direction === 'bottom';

  const motionInitial = isBottom ? { y: '100%' } : { x: '100%' };
  const motionAnimate = isBottom ? { y: 0 } : { x: 0 };
  const motionExit = isBottom ? { y: '100%' } : { x: '100%' };

  return (
    <ModalPortal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[9999] flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={motionInitial}
              animate={motionAnimate}
              exit={motionExit}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className={cn(
                'relative z-10 flex flex-col bg-[var(--surface-1,#FFFFFF)] border-[var(--border,#E6E4DF)] shadow-2xl overflow-hidden',
                isBottom
                  ? 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t'
                  : 'h-full w-full max-w-md border-l',
                className
              )}
            >
              {isBottom && (
                <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-[var(--border-mid,#D2CFC8)]" />
              )}
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}

export function DrawerHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { setOpen } = useDrawer();

  return (
    <div
      className={cn(
        'relative flex flex-col gap-1 p-5 border-b border-[var(--border,#E6E4DF)] text-left',
        className
      )}
      {...props}
    >
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="modal-close-btn absolute right-4 top-4"
        aria-label="Close drawer"
      >
        <X className="size-4" />
      </button>
      {children}
    </div>
  );
}

export function DrawerTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-bold text-[var(--text-high)] tracking-tight pr-10', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function DrawerDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-xs text-[var(--text-mid)] leading-relaxed', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function DrawerFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 p-4 border-t border-[var(--border,#E6E4DF)] bg-[var(--surface-2,#F3F2EF)]/40 mt-auto',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DrawerClose({
  render,
  children,
  className,
  ...props
}: {
  render?: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  children?: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDrawer();

  if (render) {
    return React.cloneElement(render, {
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        render.props.onClick?.(e);
        setOpen(false);
      },
    });
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(false)}
      className={className}
      {...props}
    >
      {children || 'Cancel'}
    </button>
  );
}
