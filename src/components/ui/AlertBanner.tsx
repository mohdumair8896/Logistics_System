'use client';
/**
 * Alert Banner — Operational status and warning notifications
 * Fully themed to Signal Blue (#0057FF) / Porcelain (#F8F7F4)
 */

import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2, AlertTriangle, AlertCircle, Info, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertBannerProps {
  variant?: AlertVariant;
  title: string;
  children?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
  icon?: ReactNode;
}

const VARIANT_TOKENS: Record<AlertVariant, {
  bg: string;
  border: string;
  text: string;
  subtxt: string;
  Icon: typeof Info;
}> = {
  info: {
    bg: 'rgba(0, 87, 255, 0.08)',
    border: 'rgba(0, 87, 255, 0.22)',
    text: '#0057FF',
    subtxt: 'rgba(0, 87, 255, 0.75)',
    Icon: Info,
  },
  success: {
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.25)',
    text: '#059669',
    subtxt: 'rgba(5, 150, 105, 0.75)',
    Icon: CheckCircle2,
  },
  warning: {
    bg: 'rgba(217, 119, 6, 0.08)',
    border: 'rgba(217, 119, 6, 0.25)',
    text: '#D97706',
    subtxt: 'rgba(180, 83, 9, 0.75)',
    Icon: AlertTriangle,
  },
  error: {
    bg: 'rgba(220, 38, 38, 0.08)',
    border: 'rgba(220, 38, 38, 0.25)',
    text: '#DC2626',
    subtxt: 'rgba(185, 28, 28, 0.75)',
    Icon: AlertCircle,
  },
};

export function AlertBanner({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className = '',
  compact = false,
  icon,
}: AlertBannerProps) {
  const [visible, setVisible] = useState(true);
  const t = VARIANT_TOKENS[variant];
  const IconComponent = t.Icon;

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  // Compact one-liner style
  if (compact && !dismissible && !children) {
    return (
      <div
        role="alert"
        className={cn('flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-semibold', className)}
        style={{
          background: t.bg,
          color: t.text,
          border: `1px solid ${t.border}`,
        }}
      >
        {icon || <IconComponent size={14} className="shrink-0" />}
        <span className="flex-1">{title}</span>
      </div>
    );
  }

  // Standard bordered banner with optional children and dismiss
  return (
    <AnimatePresence>
      <motion.div
        role="alert"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className={cn(className)}
        style={{
          display: 'flex',
          alignItems: compact ? 'center' : 'flex-start',
          gap: 10,
          padding: compact ? '10px 14px' : '13px 16px',
          borderRadius: 10,
          border: `1px solid ${t.border}`,
          background: t.bg,
        }}
      >
        <div style={{ flexShrink: 0, marginTop: compact ? 0 : 1 }}>
          {icon || <IconComponent size={16} color={t.text} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: t.text,
              lineHeight: 1.35,
            }}
          >
            {title}
          </div>
          {children && (
            <div
              style={{
                fontSize: 11.5,
                color: t.subtxt,
                marginTop: 3,
                lineHeight: 1.45,
              }}
            >
              {children}
            </div>
          )}
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            aria-label="Dismiss notice"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: t.text,
              opacity: 0.65,
              padding: 2,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
