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
      ? 'bg-[var(--brand,#0057FF)] text-white'
      : 'bg-[var(--surface-1,#FFFFFF)] text-[var(--text-high,#141414)] border border-[var(--border,#E6E4DF)]',
    muted: 'bg-[var(--surface-2,#F3F2EF)] text-[var(--text-high,#141414)] border border-[var(--border,#E6E4DF)]',
    brand: 'bg-[var(--brand,#0057FF)] text-white',
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

export function BubbleGroup({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)} {...props}>
      {children}
    </div>
  );
}

export function BubbleReactions({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--surface-1,#FFFFFF)] border border-[var(--border,#E6E4DF)] text-[var(--text-mid)] shadow-xs select-none',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
