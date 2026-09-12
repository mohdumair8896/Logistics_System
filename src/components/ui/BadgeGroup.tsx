'use client';

import React from 'react';
import type { BadgeColor, BadgeSize } from './BadgeWithDot';

export interface BadgeGroupProps {
  addonText: string;
  children: React.ReactNode;
  color?: BadgeColor;
  size?: BadgeSize;
  align?: 'leading' | 'trailing';
  className?: string;
  style?: React.CSSProperties;
}

const colorMap: Record<BadgeColor, { bg: string; text: string; border: string; addonBg: string; addonText: string }> = {
  brand: {
    bg: 'var(--surface-1, #FFFFFF)',
    text: 'var(--text-high, #141414)',
    border: 'var(--border, #E6E4DF)',
    addonBg: 'var(--brand-10, rgba(0, 87, 255, 0.08))',
    addonText: 'var(--brand, #0057FF)',
  },
  success: {
    bg: 'var(--surface-1, #FFFFFF)',
    text: 'var(--text-high, #141414)',
    border: 'rgba(26, 127, 84, 0.25)',
    addonBg: 'var(--status-done-bg, rgba(26, 127, 84, 0.1))',
    addonText: 'var(--status-done, #1A7F54)',
  },
  warning: {
    bg: 'var(--surface-1, #FFFFFF)',
    text: 'var(--text-high, #141414)',
    border: 'rgba(154, 107, 10, 0.25)',
    addonBg: 'var(--status-warn-bg, rgba(154, 107, 10, 0.1))',
    addonText: 'var(--status-warn, #9A6B0A)',
  },
  error: {
    bg: 'var(--surface-1, #FFFFFF)',
    text: 'var(--text-high, #141414)',
    border: 'rgba(192, 57, 43, 0.25)',
    addonBg: 'var(--status-error-bg, rgba(192, 57, 43, 0.1))',
    addonText: 'var(--status-error, #C0392B)',
  },
  neutral: {
    bg: 'var(--surface-1, #FFFFFF)',
    text: 'var(--text-high, #141414)',
    border: 'var(--border, #E6E4DF)',
    addonBg: 'var(--surface-2, #F3F2EF)',
    addonText: 'var(--text-mid, #525252)',
  },
  gray: {
    bg: 'var(--surface-1, #FFFFFF)',
    text: 'var(--text-high, #141414)',
    border: 'var(--border, #E6E4DF)',
    addonBg: 'var(--surface-2, #F3F2EF)',
    addonText: 'var(--text-mid, #525252)',
  },
};

const sizeMap: Record<BadgeSize, { padding: string; addonPadding: string; fontSize: number; gap: number }> = {
  sm: { padding: '2px 8px 2px 3px', addonPadding: '1px 6px', fontSize: 11, gap: 6 },
  md: { padding: '3px 10px 3px 4px', addonPadding: '2px 8px', fontSize: 12, gap: 8 },
  lg: { padding: '4px 14px 4px 5px', addonPadding: '3px 10px', fontSize: 13, gap: 10 },
};

export function BadgeGroup({
  addonText,
  children,
  color = 'brand',
  size = 'md',
  align = 'leading',
  className = '',
  style,
}: BadgeGroupProps) {
  const c = colorMap[color] || colorMap.brand;
  const s = sizeMap[size];

  const addonElement = (
    <span
      style={{
        padding: s.addonPadding,
        borderRadius: 99,
        background: c.addonBg,
        color: c.addonText,
        fontWeight: 700,
        fontSize: s.fontSize - 0.5,
        letterSpacing: '0.2px',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      {addonText}
    </span>
  );

  return (
    <div
      className={`inline-flex items-center rounded-full border shadow-xs select-none ${className}`}
      style={{
        padding: align === 'trailing' ? `${s.padding.split(' ')[0]} 4px ${s.padding.split(' ')[0]} 10px` : s.padding,
        fontSize: s.fontSize,
        background: c.bg,
        color: c.text,
        borderColor: c.border,
        gap: s.gap,
        fontWeight: 500,
        ...style,
      }}
    >
      {align === 'leading' && addonElement}
      <span className="truncate">{children}</span>
      {align === 'trailing' && addonElement}
    </div>
  );
}
