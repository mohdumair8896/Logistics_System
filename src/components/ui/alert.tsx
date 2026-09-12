'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export type AlertVariant = 'default' | 'destructive' | 'warning' | 'success' | 'info';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  icon?: React.ReactNode;
}

const variantStyles: Record<AlertVariant, {
  container: string;
  defaultIcon: React.ReactNode;
}> = {
  default: {
    container: 'bg-[var(--surface-2,#F3F2EF)] text-[var(--text-high,#141414)] border-[var(--border,#E6E4DF)]',
    defaultIcon: <Info className="size-4 shrink-0 text-[var(--icon,#6B7280)] mt-0.5" />,
  },
  destructive: {
    container: 'bg-[rgba(220,38,38,0.06)] text-[#DC2626] border-[rgba(220,38,38,0.22)]',
    defaultIcon: <AlertCircle className="size-4 shrink-0 text-[#DC2626] mt-0.5" />,
  },
  warning: {
    container: 'bg-[rgba(217,119,6,0.06)] text-[#D97706] border-[rgba(217,119,6,0.22)]',
    defaultIcon: <AlertTriangle className="size-4 shrink-0 text-[#D97706] mt-0.5" />,
  },
  success: {
    container: 'bg-[rgba(16,185,129,0.06)] text-[#059669] border-[rgba(16,185,129,0.22)]',
    defaultIcon: <CheckCircle2 className="size-4 shrink-0 text-[#059669] mt-0.5" />,
  },
  info: {
    container: 'bg-[rgba(0,87,255,0.06)] text-[#0057FF] border-[rgba(0,87,255,0.2)]',
    defaultIcon: <Info className="size-4 shrink-0 text-[#0057FF] mt-0.5" />,
  },
};

export function Alert({
  variant = 'default',
  icon,
  className,
  children,
  ...props
}: AlertProps) {
  const v = variantStyles[variant];

  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-xl border p-3.5 text-xs flex gap-3 items-start transition-all shadow-xs',
        v.container,
        className
      )}
      {...props}
    >
      {icon !== undefined ? icon : v.defaultIcon}
      <div className="flex-1 space-y-0.5 min-w-0">{children}</div>
    </div>
  );
}

export function AlertTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn('font-bold leading-tight tracking-tight text-xs text-inherit mb-0.5', className)}
      {...props}
    >
      {children}
    </h5>
  );
}

export function AlertDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn('text-[11.5px] opacity-90 leading-relaxed font-normal text-inherit', className)}
      {...props}
    >
      {children}
    </div>
  );
}
