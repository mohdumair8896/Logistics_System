'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModalPortal } from './ModalPortal';

interface ContextMenuContextValue {
  isOpen: boolean;
  position: { x: number; y: number };
  openMenu: (e: React.MouseEvent) => void;
  closeMenu: () => void;
}

const ContextMenuContext = React.createContext<ContextMenuContextValue | null>(null);

export function ContextMenu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  const openMenu = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Bound within viewport
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 280);

    setPosition({ x, y });
    setIsOpen(true);
  }, []);

  const closeMenu = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleClick = () => closeMenu();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('contextmenu', handleClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('contextmenu', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeMenu]);

  return (
    <ContextMenuContext.Provider value={{ isOpen, position, openMenu, closeMenu }}>
      {children}
    </ContextMenuContext.Provider>
  );
}

export interface ContextMenuTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
  render?: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  children?: React.ReactNode;
  className?: string;
}

export function ContextMenuTrigger({
  asChild,
  render,
  children,
  className,
  ...props
}: ContextMenuTriggerProps) {
  const ctx = React.useContext(ContextMenuContext);

  if (render && React.isValidElement<React.HTMLAttributes<HTMLElement>>(render)) {
    const childProps = render.props || {};
    return React.cloneElement(render, {
      className: cn(childProps.className, className),
      style:
        childProps.style || props.style
          ? { ...childProps.style, ...props.style }
          : undefined,
      onContextMenu: (e: React.MouseEvent<HTMLElement>) => {
        childProps.onContextMenu?.(e);
        ctx?.openMenu(e);
      },
    });
  }

  if (asChild && React.isValidElement<React.HTMLAttributes<HTMLElement>>(children)) {
    const childProps = children.props || {};
    return React.cloneElement(children, {
      className: cn(childProps.className, className),
      style:
        childProps.style || props.style
          ? { ...childProps.style, ...props.style }
          : undefined,
      onContextMenu: (e: React.MouseEvent<HTMLElement>) => {
        childProps.onContextMenu?.(e);
        ctx?.openMenu(e);
      },
    });
  }

  return (
    <div
      onContextMenu={(e) => ctx?.openMenu(e)}
      className={cn('select-none', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ContextMenuContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(ContextMenuContext);
  if (!ctx) return null;

  return (
    <ModalPortal>
      <AnimatePresence>
        {ctx.isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'fixed',
              top: ctx.position.y,
              left: ctx.position.x,
              zIndex: 99999,
            }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'min-w-[180px] rounded-xl border border-[var(--border,#E6E4DF)] bg-[var(--surface-1,#FFFFFF)] p-1.5 shadow-xl text-xs text-[var(--text-high,#141414)]',
              className
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}

export function ContextMenuGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('flex flex-col gap-0.5', className)}>{children}</div>;
}

export function ContextMenuItem({
  children,
  className,
  disabled,
  variant = 'default',
  onClick,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(ContextMenuContext);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        onClick?.(e);
        ctx?.closeMenu();
      }}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none transition-colors text-left',
        disabled && 'pointer-events-none opacity-40',
        variant === 'destructive'
          ? 'text-red-600 hover:bg-red-500/10'
          : 'text-[var(--text-high)] hover:bg-[var(--surface-2,#F3F2EF)]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ContextMenuShortcut({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'ml-auto pl-3 font-mono text-[10px] tracking-widest text-[var(--text-low,#909090)]',
        className
      )}
    >
      {children}
    </span>
  );
}

export function ContextMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('my-1 h-px bg-[var(--border,#E6E4DF)]', className)} />;
}

export function ContextMenuLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-2.5 py-1 text-[10px] font-bold text-[var(--text-low)] uppercase tracking-wider', className)}>
      {children}
    </div>
  );
}

export function ContextMenuSub({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child, { isOpen, setIsOpen } as Record<string, unknown>);
      })}
    </div>
  );
}

export function ContextMenuSubTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-[var(--surface-2)] text-[var(--text-high)]',
        className
      )}
    >
      <span>{children}</span>
      <ChevronRight className="size-3.5 text-[var(--icon,#6B7280)] ml-2" />
    </div>
  );
}

export function ContextMenuSubContent({
  children,
  className,
  isOpen,
}: {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'absolute left-full top-0 min-w-[160px] -ml-1 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-1.5 shadow-xl',
        className
      )}
    >
      {children}
    </div>
  );
}
