'use client';

import { type FC } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Pagination2Props {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
  showItemCount?: boolean;
}

export const Pagination2: FC<Pagination2Props> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  className = '',
  showItemCount = true,
}) => {
  if (totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-4 py-3 px-4 border-t border-[var(--border)] text-xs text-[var(--text-mid)]', className)}>
      {showItemCount && totalItems !== undefined && (
        <div className="font-medium">
          Showing <span className="font-bold text-[var(--text-high)]">{startIdx}</span>–
          <span className="font-bold text-[var(--text-high)]">{endIdx}</span> of{' '}
          <span className="font-bold text-[var(--text-high)]">{totalItems}</span> results
        </div>
      )}

      <nav aria-label="Pagination Navigation" className="flex items-center gap-1.5 ml-auto">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex items-center justify-center w-8 h-8 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer text-[var(--text-mid)]"
          aria-label="Previous Page"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Page Pills */}
        <div className="flex items-center gap-1">
          {pages.map(page => {
            const isActive = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  'relative flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer select-none',
                  isActive
                    ? 'text-white'
                    : 'text-[var(--text-mid)] hover:bg-[var(--surface-2)] hover:text-[var(--text-high)]'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="pagination-pill"
                    className="absolute inset-0 rounded-xl bg-[var(--brand)] shadow-xs"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{page}</span>
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center justify-center w-8 h-8 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer text-[var(--text-mid)]"
          aria-label="Next Page"
        >
          <ChevronRight size={15} />
        </button>
      </nav>
    </div>
  );
};
