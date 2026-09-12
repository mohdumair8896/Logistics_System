'use client';

import React from 'react';

export type BadgeColor = 'brand' | 'success' | 'warning' | 'error' | 'neutral' | 'gray';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeWithDotProps {
  children: React.ReactNode;
  color?: BadgeColor;
  size?: BadgeSize;
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const colorStyles: Record<BadgeColor, { bg: string; text: string; border: string; dot: string }> = {
  brand: {
    bg: 'var(--brand-10, rgba(0, 87, 255, 0.08))',
    text: 'var(--brand, #0057FF)',
    border: 'rgba(0, 87, 255, 0.2)',
    dot: 'var(--brand, #0057FF)',
  },
  success: {
    bg: 'var(--status-done-bg, rgba(26, 127, 84, 0.08))',
    text: 'var(--status-done, #1A7F54)',
    border: 'rgba(26, 127, 84, 0.2)',
    dot: 'var(--status-done, #1A7F54)',
  },
  warning: {
    bg: 'var(--status-warn-bg, rgba(154, 107, 10, 0.08))',
    text: 'var(--status-warn, #9A6B0A)',
    border: 'rgba(154, 107, 10, 0.2)',
    dot: 'var(--status-warn, #9A6B0A)',
  },
  error: {
    bg: 'var(--status-error-bg, rgba(192, 57, 43, 0.08))',
    text: 'var(--status-error, #C0392B)',
    border: 'rgba(192, 57, 43, 0.2)',
    dot: 'var(--status-error, #C0392B)',
  },
  neutral: {
    bg: 'var(--status-neutral-bg, rgba(107, 114, 128, 0.08))',
    text: 'var(--status-neutral, #6B7280)',
    border: 'rgba(107, 114, 128, 0.2)',
    dot: 'var(--status-neutral, #6B7280)',
  },
  gray: {
    bg: 'var(--status-neutral-bg, rgba(107, 114, 128, 0.08))',
    text: 'var(--status-neutral, #6B7280)',
    border: 'rgba(107, 114, 128, 0.2)',
    dot: 'var(--status-neutral, #6B7280)',
  },
};

const sizeStyles: Record<BadgeSize, { padding: string; fontSize: number; dotSize: number }> = {
  sm: { padding: '2px 8px', fontSize: 11, dotSize: 5 },
  md: { padding: '3px 10px', fontSize: 12, dotSize: 6 },
  lg: { padding: '5px 12px', fontSize: 13, dotSize: 7 },
};

export function BadgeWithDot({
  children,
  color = 'brand',
  size = 'md',
  pulse = false,
  className = '',
  style,
}: BadgeWithDotProps) {
  const c = colorStyles[color] || colorStyles.brand;
  const s = sizeStyles[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-colors select-none ${className}`}
      style={{
        padding: s.padding,
        fontSize: s.fontSize,
        backgroundColor: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        lineHeight: 1.3,
        ...style,
      }}
    >
      <span
        style={{
          width: s.dotSize,
          height: s.dotSize,
          borderRadius: '50%',
          backgroundColor: c.dot,
          display: 'inline-block',
          flexShrink: 0,
          animation: pulse ? 'dotPulse 1.4s infinite ease-in-out' : undefined,
        }}
      />
      <span>{children}</span>
    </span>
  );
}
