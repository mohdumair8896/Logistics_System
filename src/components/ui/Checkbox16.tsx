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
}

export const Checkbox16: FC<Checkbox16Props> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = '',
  badge,
}) => {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className={cn(
        'relative flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer select-none',
        checked
          ? 'bg-[rgba(0,87,255,0.05)] border-[var(--brand)] shadow-xs'
          : 'bg-[var(--surface-1)] border-[var(--border)] hover:bg-[var(--surface-2)]',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* Hidden Native Checkbox */}
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
        className="sr-only"
      />

      {/* Custom Animated Checkbox Box */}
      <div
        className={cn(
          'w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors mt-0.5',
          checked
            ? 'bg-[var(--brand)] border-[var(--brand)] text-white shadow-xs'
            : 'border-[var(--border)] bg-[var(--surface-2)] text-transparent'
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

      {/* Copy: Label & Description */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('text-xs font-bold leading-tight', checked ? 'text-[var(--text-high)]' : 'text-[var(--text-mid)]')}>
            {label}
          </span>
          {badge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--text-low)] border border-[var(--border)] uppercase">
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
