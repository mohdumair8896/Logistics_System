'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Link2, MessageSquare, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export interface ShareButtonProps {
  /** The URL to share (defaults to current window location) */
  url?: string;
  /** Share title */
  title?: string;
  /** Share description text */
  text?: string;
  /** Custom button label */
  buttonText?: string;
  /** Class name */
  className?: string;
  /** Custom inline style */
  style?: React.CSSProperties;
  /** Icon size */
  size?: number;
}

export function ShareButton({
  url,
  title = 'Live Consignment Tracking',
  text = 'Track this shipment in real time on LogiFlow:',
  buttonText = 'Share Link',
  className = '',
  style = {},
  size = 14,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getShareUrl = useCallback(() => {
    if (url) return url;
    if (typeof window !== 'undefined') return window.location.href;
    return '';
  }, [url]);

  // Handle native Web Share API on mobile or modern supported browsers
  const handleNativeOrToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = getShareUrl();

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: `${text} ${shareUrl}`,
          url: shareUrl,
        });
        toast.success('Shared successfully!');
        return;
      } catch (err: unknown) {
        // User cancelled or share aborted — fallback to dropdown menu
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    setOpen(prev => !prev);
  };

  const handleCopyLink = async () => {
    const shareUrl = getShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Public tracking link copied to clipboard!');
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1500);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleWhatsApp = () => {
    const shareUrl = getShareUrl();
    const message = encodeURIComponent(`*${title}*\n${text}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <motion.button
        type="button"
        onClick={handleNativeOrToggle}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: 8,
          padding: '6px 14px',
          color: 'var(--text-high, #e2e8f0)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background 0.2s, border-color 0.2s',
          ...style,
        }}
      >
        <Share2 size={size} />
        <span>{buttonText}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 6px)',
              width: 220,
              background: 'rgba(15, 23, 42, 0.96)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 12,
              padding: '6px',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
              zIndex: 100,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#94a3b8' }}>
                Share Tracking
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2, display: 'flex' }}
              >
                <X size={12} />
              </button>
            </div>

            {/* Option 1: Copy Link */}
            <motion.button
              type="button"
              onClick={handleCopyLink}
              whileHover={{ background: 'rgba(255, 255, 255, 0.08)' }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 8,
                background: 'transparent',
                border: 'none',
                color: copied ? '#10b981' : '#f8fafc',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Link2 size={14} color="var(--brand, #0057FF)" />}
              <span>{copied ? 'Link Copied!' : 'Copy Public Link'}</span>
            </motion.button>

            {/* Option 2: WhatsApp */}
            <motion.button
              type="button"
              onClick={handleWhatsApp}
              whileHover={{ background: 'rgba(255, 255, 255, 0.08)' }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 8,
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <MessageSquare size={14} color="#25D366" />
              <span>Share via WhatsApp</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
