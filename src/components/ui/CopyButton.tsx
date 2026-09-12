'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export interface CopyButtonProps {
  /** The text to copy to the clipboard */
  text: string;
  /** Optional human-readable label for the toast notification (e.g., "Waybill Number") */
  label?: string;
  /** Visual presentation style */
  variant?: 'icon' | 'badge' | 'button';
  /** Optional custom button label (defaults to "Copy") */
  buttonText?: string;
  /** Custom className */
  className?: string;
  /** Custom inline style */
  style?: React.CSSProperties;
  /** Icon size in pixels */
  size?: number;
}

export function CopyButton({
  text,
  label = 'Value',
  variant = 'icon',
  buttonText = 'Copy',
  className = '',
  style = {},
  size = 13,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      if (typeof window !== 'undefined' && navigator?.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(`${label} copied to clipboard!`, {
          description: text.length > 32 ? `${text.slice(0, 32)}...` : text,
          duration: 2500,
        });
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  }, [text, label]);

  if (variant === 'badge') {
    return (
      <motion.button
        type="button"
        onClick={handleCopy}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
        title={`Click to copy ${label}`}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '2px 8px',
          borderRadius: 6,
          background: copied ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.06)',
          border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.12)'}`,
          color: copied ? '#10b981' : 'var(--text-medium, #94a3b8)',
          fontSize: 11,
          fontWeight: 600,
          fontFamily: 'var(--font-mono, monospace)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          ...style,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'inline-flex' }}
            >
              <Check size={size} color="#10b981" />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'inline-flex' }}
            >
              <Copy size={size} />
            </motion.span>
          )}
        </AnimatePresence>
        <span>{copied ? 'Copied!' : text}</span>
      </motion.button>
    );
  }

  if (variant === 'button') {
    return (
      <motion.button
        type="button"
        onClick={handleCopy}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        title={`Copy ${label}`}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 8,
          background: copied ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
          border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.15)'}`,
          color: copied ? '#10b981' : 'var(--text-high, #f8fafc)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          ...style,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.6, rotate: 20, opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'inline-flex' }}
            >
              <Check size={size + 1} color="#10b981" />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'inline-flex' }}
            >
              <Copy size={size + 1} />
            </motion.span>
          )}
        </AnimatePresence>
        <span>{copied ? 'Copied!' : buttonText}</span>
      </motion.button>
    );
  }

  // Default 'icon' variant
  return (
    <motion.button
      type="button"
      onClick={handleCopy}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      title={`Click to copy ${label}: ${text}`}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size + 14,
        height: size + 14,
        borderRadius: 6,
        background: copied ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
        border: 'none',
        color: copied ? '#10b981' : 'var(--text-low, #64748b)',
        cursor: 'pointer',
        transition: 'color 0.15s, background 0.15s',
        padding: 0,
        ...style,
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Check size={size} color="#10b981" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Copy size={size} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
