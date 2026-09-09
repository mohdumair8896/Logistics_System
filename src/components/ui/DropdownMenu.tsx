'use client';

import { useState, useRef, useEffect, type ReactNode, type FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string;
  disabled?: boolean;
  destructive?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

export interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
  className?: string;
  width?: number;
}

export const DropdownMenu: FC<DropdownMenuProps> = ({
  trigger,
  items,
  align = 'right',
  className = '',
  width = 210,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className={cn('relative inline-block text-left', className)}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            style={{
              width,
              [align === 'right' ? 'right' : 'left']: 0,
            }}
            className="absolute top-full mt-1.5 z-50 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-1.5 shadow-lg overflow-hidden"
          >
            {items.map((item, idx) => {
              if (item.divider) {
                return <div key={`div-${idx}`} className="h-px my-1 bg-[var(--border)]" />;
              }

              return (
                <button
                  key={item.id}
                  disabled={item.disabled}
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick?.();
                      setIsOpen(false);
                    }
                  }}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer select-none',
                    item.disabled && 'opacity-40 cursor-not-allowed',
                    item.destructive
                      ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                      : 'text-[var(--text-mid)] hover:bg-[var(--surface-2)] hover:text-[var(--text-high)]'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-low)]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
