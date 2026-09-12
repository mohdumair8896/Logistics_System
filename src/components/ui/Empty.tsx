'use client';

import * as React from 'react';
import { PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Empty({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-[var(--border,#E6E4DF)] bg-[var(--surface-1,#FFFFFF)]/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function EmptyHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col items-center gap-2 max-w-sm', className)} {...props}>
      {children}
    </div>
  );
}

export function EmptyMedia({
  variant = 'icon',
  className,
  children,
  ...props
}: {
  variant?: 'default' | 'icon';
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        variant === 'icon' && 'size-12 rounded-2xl bg-[var(--surface-2,#F3F2EF)] text-[var(--icon,#6B7280)] mb-2',
        'flex items-center justify-center',
        className
      )}
      {...props}
    >
      {children || <PackageOpen className="size-6 text-[var(--icon)]" />}
    </div>
  );
}

export function EmptyTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h4
      className={cn('text-sm font-bold text-[var(--text-high,#141414)] tracking-tight', className)}
      {...props}
    >
      {children}
    </h4>
  );
}

export function EmptyDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-xs text-[var(--text-low,#909090)] leading-relaxed', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function EmptyContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-4 flex items-center justify-center gap-2', className)} {...props}>
      {children}
    </div>
  );
}
