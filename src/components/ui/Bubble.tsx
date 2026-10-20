'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end';
  variant?: 'default' | 'muted' | 'brand';
}

export function Bubble({
  align = 'start',
  variant = 'default',
  className,
  children,
  ...props
}: BubbleProps) {
  const isEnd = align === 'end';

  const variantStyles = {
    default: isEnd
      ? 'bg-[var(--brand,#0B6B4E)] text-white'
      : 'bg-[var(--surface-1,#FFFFFF)] text-[var(--text-high,#141414)] border border-[var(--border,#E6E4DF)]',
    muted: 'bg-[var(--surface-2,#F3F2EF)] text-[var(--text-high,#141414)] border border-[var(--border,#E6E4DF)]',
    brand: 'bg-[var(--brand,#0B6B4E)] text-white',
  }[variant];

  return (
    <div
      className={cn(
        'relative flex flex-col max-w-[82%] text-sm rounded-2xl px-4 py-2.5 shadow-sm transition-all',
        isEnd ? 'self-end rounded-br-sm' : 'self-start rounded-bl-sm',
        variantStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function BubbleContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('leading-relaxed break-words text-xs sm:text-sm', className)} {...props}>
      {children}
    </div>
  );
}
