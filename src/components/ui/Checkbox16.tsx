'use client';

import { useId, type FC, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Checkbox16Props {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  badge?: string;
  badgeColor?: 'warning' | 'success' | 'info' | 'purple' | 'neutral';
  variant?: 'card' | 'row';
}

const BADGE_STYLES: Record<string, string> = {
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  info: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
  purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
  neutral: 'bg-[var(--surface-3)] text-[var(--text-mid)] border-[var(--border)]',
};

export const Checkbox16: FC<Checkbox16Props> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = '',
  badge,
  badgeColor = 'neutral',
  variant = 'row',
}) => {
  const id = useId();

  if (variant === 'row') {
    return (
      <label
        htmlFor={id}
        className={cn(
          'relative flex items-center justify-between gap-3.5 px-4 py-3 transition-colors cursor-pointer select-none border-b last:border-b-0 border-[var(--border)]',
          checked ? 'bg-[rgba(0,87,255,0.02)]' : 'hover:bg-[var(--surface-2)]',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
          className="sr-only"
        />

        {/* Checkbox box + label */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div
            className={cn(
              'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all',
              checked
                ? 'bg-[var(--brand)] border-[var(--brand)] text-white shadow-xs'
                : 'border-[var(--border-mid)] bg-[var(--surface-2)] text-transparent'
            )}
          >
            <AnimatePresence>
              {checked && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <Check size={13} strokeWidth={3} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col min-w-0">
            <span className={cn('text-xs font-semibold leading-tight', checked ? 'text-[var(--text-high)]' : 'text-[var(--text-mid)]')}>
              {label}
            </span>
            {description && (
              <span className="text-[11.5px] text-[var(--text-low)] leading-tight mt-0.5">
                {description}
              </span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        {badge && (
          <span className={cn(
            'text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 border ml-3',
            BADGE_STYLES[badgeColor] || BADGE_STYLES.neutral
          )}>
            {badge}
          </span>
        )}
      </label>
    );
  }

  // Card variant
  return (
    <label
      htmlFor={id}
      style={{ padding: '12px 18px' }}
      className={cn(
        'relative flex items-center gap-3.5 rounded-xl border transition-all cursor-pointer select-none',
        checked
          ? 'bg-[rgba(0,87,255,0.03)] border-[rgba(0,87,255,0.32)] shadow-xs hover:border-[var(--brand)]'
          : 'bg-[var(--surface-1)] border-[var(--border)] hover:border-[var(--border-mid)] hover:bg-[var(--surface-2)]',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
        className="sr-only"
      />

      <div
        className={cn(
          'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
          checked
            ? 'bg-[var(--brand)] border-[var(--brand)] text-white shadow-xs'
            : 'border-[var(--border-mid)] bg-[var(--surface-2)] text-transparent'
        )}
      >
        <AnimatePresence>
          {checked && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <Check size={13} strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-2">
        <div className="flex items-center justify-between gap-3">
          <span className={cn('text-xs font-bold leading-tight', checked ? 'text-[var(--text-high)]' : 'text-[var(--text-mid)]')}>
            {label}
          </span>
          {badge && (
            <span className={cn(
              'text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 border ml-2.5',
              BADGE_STYLES[badgeColor] || BADGE_STYLES.neutral
            )}>
              {badge}
            </span>
          )}
        </div>
        {description && (
          <span className="text-[11.5px] text-[var(--text-low)] leading-relaxed mt-0.5">
            {description}
          </span>
        )}
      </div>
    </label>
  );
};
