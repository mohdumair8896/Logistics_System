'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Breadcrumb({
  className,
  children,
  ...props
}: React.ComponentProps<'nav'>) {
  return (
    <nav aria-label="breadcrumb" className={cn('flex items-center text-xs text-[var(--text-mid)]', className)} {...props}>
      {children}
    </nav>
  );
}

export function BreadcrumbList({
  className,
  children,
  ...props
}: React.ComponentProps<'ol'>) {
  return (
    <ol
      className={cn(
        'flex flex-wrap items-center gap-1.5 break-words text-xs text-[var(--text-low)] sm:gap-2',
        className
      )}
      {...props}
    >
      {children}
    </ol>
  );
}

export function BreadcrumbItem({
  className,
  children,
  ...props
}: React.ComponentProps<'li'>) {
  return (
    <li
      className={cn('inline-flex items-center gap-1.5', className)}
      {...props}
    >
      {children}
    </li>
  );
}

export function BreadcrumbLink({
  href,
  className,
  children,
  ...props
}: {
  href?: string;
  className?: string;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          'transition-colors hover:text-[var(--text-high)] font-medium text-[var(--text-mid)]',
          className
        )}
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <span className={cn('text-[var(--text-mid)]', className)} {...props}>
      {children}
    </span>
  );
}

export function BreadcrumbPage({
  className,
  children,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('font-semibold text-[var(--text-high)]', className)}
      {...props}
    >
      {children}
    </span>
  );
}

export function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<'li'>) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn('[&>svg]:size-3.5 text-[var(--text-low)]', className)}
      {...props}
    >
      {children ?? <ChevronRight className="size-3.5" />}
    </li>
  );
}

export function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn('flex size-6 items-center justify-center text-[var(--text-low)]', className)}
      {...props}
    >
      <MoreHorizontal className="size-3.5" />
      <span className="sr-only">More</span>
    </span>
  );
}
