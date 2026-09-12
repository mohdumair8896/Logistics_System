'use client';

import { useState, type ReactNode, type FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreHorizontal, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActionItem {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
}

export interface InlineDisclosureMenuProps {
  actions: ActionItem[];
  triggerLabel?: string;
  className?: string;
  confirmLabel?: string;
}

export const InlineDisclosureMenu: FC<InlineDisclosureMenuProps> = ({
  actions,
  triggerLabel,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null);

  const handleActionClick = (action: ActionItem) => {
    if (action.variant === 'danger' && pendingConfirm !== action.id) {
      setPendingConfirm(action.id);
      return;
    }
    action.onClick();
    setPendingConfirm(null);
    setIsOpen(false);
  };

  return (
    <div className={cn('inline-flex items-center relative select-none', className)}>
      <AnimatePresence mode="wait">
        {!isOpen ? (
          /* Collapsed Trigger Pill */
          <motion.button
            key="trigger"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--text-mid)] hover:text-[var(--brand)] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            aria-label="Open row actions menu"
          >
            <MoreHorizontal size={14} />
            {triggerLabel && <span>{triggerLabel}</span>}
          </motion.button>
        ) : (
          /* Expanded Horizontal Action Bar */
          <motion.div
            key="bar"
            initial={{ opacity: 0, width: 40 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 40 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className="flex items-center gap-1 p-1 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] shadow-md overflow-hidden"
          >
            {actions.map(act => {
              const isConfirming = pendingConfirm === act.id;

              return (
                <button
                  key={act.id}
                  disabled={act.disabled}
                  onClick={() => !act.disabled && handleActionClick(act)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                    act.disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
                    isConfirming
                      ? 'bg-red-600 text-white shadow-xs animate-pulse'
                      : act.variant === 'primary'
                      ? 'bg-[var(--brand)] text-white hover:opacity-90'
                      : act.variant === 'danger'
                      ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                      : 'text-[var(--text-mid)] hover:bg-[var(--surface-2)] hover:text-[var(--text-high)]'
                  )}
                >
                  {isConfirming ? <Check size={12} /> : act.icon}
                  <span>{isConfirming ? 'Confirm?' : act.label}</span>
                </button>
              );
            })}

            {/* Close button */}
            <button
              onClick={() => {
                setIsOpen(false);
                setPendingConfirm(null);
              }}
              className="p-1 rounded-lg text-[var(--text-low)] hover:text-[var(--text-high)] hover:bg-[var(--surface-2)] cursor-pointer"
              aria-label="Close menu"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
