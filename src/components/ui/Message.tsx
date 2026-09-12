'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end';
}

export function Message({
  align = 'start',
  className,
  children,
  ...props
}: MessageProps) {
  const isEnd = align === 'end';

  return (
    <div
      className={cn(
        'flex gap-2.5 items-end max-w-full my-1',
        isEnd ? 'flex-row-reverse self-end' : 'flex-row self-start',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function MessageAvatar({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('shrink-0 mb-1', className)} {...props}>
      {children}
    </div>
  );
}

export function MessageContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-1 min-w-0 max-w-full', className)} {...props}>
      {children}
    </div>
  );
}

export function MessageFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('text-[10px] text-[var(--text-low,#909090)] px-1 mt-0.5 self-end', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Marker({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-center my-2 text-xs text-[var(--text-low,#909090)]', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function MarkerContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'px-3 py-1 rounded-full bg-[var(--surface-2,#F3F2EF)] border border-[var(--border,#E6E4DF)] text-[11px] font-medium text-[var(--text-mid)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
