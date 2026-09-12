'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[var(--surface-2,#F3F2EF)]/80',
        className
      )}
      {...props}
    />
  );
}
