'use client';
/**
 * Alert Suite — Inspired by watermelon.sh:
 * - Alert1 (minimal icon + message)
 * - Alert10 (dismissible gradient card with close action)
 * - Alert20 (bordered warning card)
 * - Alert24 (border-free soft tinted alert)
 * - Alert27 (solid high-visibility status banner)
 * - Alert28 (spring animated system notice)
 *
 * Fully themed to Signal Blue (#0057FF) / Porcelain (#F8F7F4)
 */

import { useState, type ReactNode, type FC } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2, AlertTriangle, AlertCircle, Info, X, ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';
export type AlertDesignStyle = 'standard' | 'minimal' | 'gradient' | 'bordered' | 'subtle' | 'solid';

export interface AlertBannerProps {
  variant?: AlertVariant;
  styleVariant?: AlertDesignStyle;
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
  gradient: string;
  solidBg: string;
  Icon: typeof Info;
}> = {
  info: {
    bg: 'rgba(0, 87, 255, 0.08)',
    border: 'rgba(0, 87, 255, 0.22)',
    text: '#0057FF',
    subtxt: 'rgba(0, 87, 255, 0.75)',
    gradient: 'linear-gradient(135deg, rgba(0, 87, 255, 0.12) 0%, rgba(248, 247, 244, 0.4) 100%)',
    solidBg: '#0057FF',
    Icon: Info,
  },
  success: {
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.25)',
    text: '#059669',
    subtxt: 'rgba(5, 150, 105, 0.75)',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(248, 247, 244, 0.4) 100%)',
    solidBg: '#10B981',
    Icon: CheckCircle2,
  },
  warning: {
    bg: 'rgba(217, 119, 6, 0.08)',
    border: 'rgba(217, 119, 6, 0.25)',
    text: '#D97706',
    subtxt: 'rgba(180, 83, 9, 0.75)',
    gradient: 'linear-gradient(135deg, rgba(217, 119, 6, 0.14) 0%, rgba(248, 247, 244, 0.4) 100%)',
    solidBg: '#D97706',
    Icon: AlertTriangle,
  },
  error: {
    bg: 'rgba(220, 38, 38, 0.08)',
    border: 'rgba(220, 38, 38, 0.25)',
    text: '#DC2626',
    subtxt: 'rgba(185, 28, 28, 0.75)',
    gradient: 'linear-gradient(135deg, rgba(220, 38, 38, 0.14) 0%, rgba(248, 247, 244, 0.4) 100%)',
    solidBg: '#DC2626',
    Icon: AlertCircle,
  },
};

export function AlertBanner({
  variant = 'info',
  styleVariant = 'standard',
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

  // 1. Minimal Style (like Alert1)
  if (styleVariant === 'minimal' || (compact && !dismissible && !children)) {
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

  // 2. Solid Style (like Alert27)
  if (styleVariant === 'solid') {
    return (
      <div
        role="alert"
        className={cn('flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-white shadow-sm', className)}
        style={{ background: t.solidBg }}
      >
        <div className="flex items-center gap-2.5">
          {icon || <IconComponent size={17} className="shrink-0 text-white" />}
          <div>
            <div className="text-xs font-bold tracking-wide uppercase opacity-90">{title}</div>
            {children && <div className="text-xs text-white/90 mt-0.5">{children}</div>}
          </div>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md hover:bg-white/20 transition-colors text-white cursor-pointer"
            aria-label="Dismiss alert"
          >
            <X size={15} />
          </button>
        )}
      </div>
    );
  }

  // 3. Gradient Style (like Alert10)
  if (styleVariant === 'gradient') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          role="alert"
          className={cn('flex items-start justify-between gap-3.5 p-4 rounded-xl shadow-sm border', className)}
          style={{
            background: t.gradient,
            borderColor: t.border,
            color: t.text,
          }}
        >
          <div className="flex items-start gap-3 flex-1">
            {icon || <IconComponent size={18} className="shrink-0 mt-0.5" style={{ color: t.text }} />}
            <div className="flex flex-col gap-0.5">
              <div className="text-xs font-bold leading-tight" style={{ color: t.text }}>{title}</div>
              {children && (
                <div className="text-xs leading-relaxed" style={{ color: t.subtxt }}>
                  {children}
                </div>
              )}
            </div>
          </div>
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer shrink-0"
              style={{ color: t.text }}
              aria-label="Dismiss alert"
            >
              <X size={15} />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  // 4. Subtle Style (like Alert24 - borderless, soft background)
  if (styleVariant === 'subtle') {
    return (
      <div
        role="alert"
        className={cn('flex items-start gap-3 p-3.5 rounded-xl border-none', className)}
        style={{ background: t.bg, color: t.text }}
      >
        {icon || <IconComponent size={16} className="shrink-0 mt-0.5" />}
        <div className="flex-1">
          <div className="text-xs font-bold">{title}</div>
          {children && <div className="text-xs mt-1" style={{ color: t.subtxt }}>{children}</div>}
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-black/5 cursor-pointer"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }

  // 5. Standard / Bordered (like Alert20 & Alert28 default)
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

// ── Base UI Primitives for Direct Compatibility ─────────────────────
export const Alert: FC<{ className?: string; children: ReactNode; style?: React.CSSProperties }> = ({ className, children, style }) => (
  <div role="alert" className={cn('relative w-full rounded-xl border p-4 flex gap-3 items-start', className)} style={style}>
    {children}
  </div>
);

export const AlertTitle: FC<{ className?: string; children: ReactNode }> = ({ className, children }) => (
  <div className={cn('text-xs font-bold leading-none tracking-tight', className)}>
    {children}
  </div>
);

export const AlertDescription: FC<{ className?: string; children: ReactNode }> = ({ className, children }) => (
  <div className={cn('text-xs opacity-80 mt-1 leading-relaxed', className)}>
    {children}
  </div>
);
