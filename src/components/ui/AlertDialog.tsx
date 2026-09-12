'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { cn } from '@/lib/utils';

// ─── CONTEXT FOR COMPOSABLE ALERT DIALOG ──────────────────────────────────────
interface AlertDialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(null);

function useAlertDialog() {
  const ctx = React.useContext(AlertDialogContext);
  if (!ctx) {
    throw new Error('AlertDialog subcomponents must be used within <AlertDialog>');
  }
  return ctx;
}

// ─── PROPS & ROOT COMPONENT ───────────────────────────────────────────────────
export interface AlertDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;

  // Legacy props compatibility
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm?: () => void | Promise<void>;
  icon?: React.ReactNode;
}

export function AlertDialog({
  children,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  // Legacy props
  title,
  description,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  icon,
}: AlertDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  // If used in legacy mode with direct onConfirm & title props
  if (onConfirm !== undefined || title !== undefined) {
    const handleConfirm = async () => {
      await onConfirm?.();
      setOpen(false);
    };

    const variantTokens = {
      danger: {
        badgeBg: 'rgba(239, 68, 68, 0.12)',
        badgeColor: '#ef4444',
        btnBg: 'var(--status-error, #C0392B)',
        Icon: AlertCircle,
      },
      warning: {
        badgeBg: 'rgba(245, 158, 11, 0.12)',
        badgeColor: '#f59e0b',
        btnBg: '#d97706',
        Icon: AlertTriangle,
      },
      info: {
        badgeBg: 'rgba(0, 87, 255, 0.12)',
        badgeColor: '#0057FF',
        btnBg: 'var(--brand, #0057FF)',
        Icon: Info,
      },
    }[variant];

    const IconComp = variantTokens.Icon;

    return (
      <ModalPortal>
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                role="alertdialog"
                aria-modal="true"
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.18 }}
                className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-2xl"
              >
                <div className="flex items-start gap-3.5 mb-4">
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: variantTokens.badgeBg, color: variantTokens.badgeColor }}
                  >
                    {icon || <IconComp className="size-5" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-[var(--text-high)]">{title}</h3>
                    {description && (
                      <div className="mt-1 text-xs text-[var(--text-mid)] leading-relaxed">
                        {description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] text-[var(--text-high)] hover:bg-[var(--surface-2)] transition"
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    style={{ background: variantTokens.btnBg, color: '#fff' }}
                    className="px-4 py-2 text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition"
                  >
                    {confirmText}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </ModalPortal>
    );
  }

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

// ─── COMPOSABLE PRIMITIVES ────────────────────────────────────────────────────
export function AlertDialogTrigger({
  render,
  children,
  className,
  ...props
}: {
  render?: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  children?: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useAlertDialog();

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

export function AlertDialogContent({
  children,
  className,
  size = 'md',
}: {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const { open, setOpen } = useAlertDialog();

  const maxW = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-lg' : 'max-w-md';

  return (
    <ModalPortal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18 }}
              className={cn(
                'relative z-10 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-2xl',
                maxW,
                className
              )}
            >
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}

export function AlertDialogHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-2 text-left mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function AlertDialogMedia({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex size-11 items-center justify-center rounded-xl bg-red-500/10 text-red-600 mb-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertDialogTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-bold text-[var(--text-high)] tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function AlertDialogDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn('text-xs text-[var(--text-mid)] leading-relaxed', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertDialogFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-[var(--border)] mt-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertDialogCancel({
  children = 'Cancel',
  className,
  variant = 'outline',
  onClick,
  ...props
}: {
  variant?: 'outline' | 'ghost';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useAlertDialog();

  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={cn(
        'px-3.5 py-2 text-xs font-semibold rounded-lg transition cursor-pointer',
        variant === 'ghost'
          ? 'border border-transparent text-[var(--text-mid)] hover:bg-[var(--surface-2)]'
          : 'border border-[var(--border)] text-[var(--text-high)] hover:bg-[var(--surface-2)]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function AlertDialogAction({
  children = 'Continue',
  className,
  variant = 'default',
  onClick,
  ...props
}: {
  variant?: 'default' | 'destructive';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useAlertDialog();

  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={cn(
        'px-4 py-2 text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition cursor-pointer',
        variant === 'destructive'
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-[var(--brand,#0057FF)] text-white hover:bg-[var(--brand-dark,#0040CC)]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
