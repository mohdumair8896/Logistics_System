'use client';
/**
 * LabeledProgress — inspired by watermelon.sh labeled-progress-indicator
 *
 * Animated progress bar with a smoothly cycling label above it.
 * Uses motion/react for spring animations.
 *
 * Usage:
 *   <LabeledProgress
 *     progress={65}
 *     labels={['Loading cargo manifest…', 'Verifying waypoints…', 'Syncing telemetry…']}
 *   />
 */

import { useState, useEffect, type FC } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface LabeledProgressProps {
  /** 0–100 */
  progress: number;
  /** Cycling status labels shown above the bar */
  labels?: string[];
  /** ms between label transitions */
  intervalMs?: number;
  /** Height of the bar in px */
  height?: number;
  /** Show numeric % to the right */
  showPercent?: boolean;
}

export const LabeledProgress: FC<LabeledProgressProps> = ({
  progress,
  labels = ['Processing…'],
  intervalMs = 2200,
  height = 8,
  showPercent = true,
}) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (labels.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % labels.length), intervalMs);
    return () => clearInterval(t);
  }, [labels.length, intervalMs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      {/* Animated label */}
      <div style={{ position: 'relative', height: 20, overflow: 'hidden', perspective: 600 }}>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={idx}
            initial={{ opacity: 0, y: 8, rotateX: -40, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, rotateX: 0,  filter: 'blur(0px)' }}
            exit={{   opacity: 0, rotateX: 60, filter: 'blur(3px)' }}
            transition={{ type: 'spring', stiffness: 500, damping: 80 }}
            style={{
              position: 'absolute',
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--text-mid)',
              whiteSpace: 'nowrap',
              transformOrigin: 'bottom center',
            }}
          >
            {labels[idx]}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Bar + percent */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          flex: 1,
          height,
          background: 'var(--surface-2)',
          borderRadius: height,
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}>
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: 'var(--brand)',
              borderRadius: height,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Shimmer sweep */}
            <motion.div
              initial={{ x: '-120%' }}
              animate={{ x: '220%' }}
              transition={{ duration: intervalMs / 1000, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              }}
            />
          </motion.div>
        </div>

        {showPercent && (
          <motion.span
            key={progress}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--brand)',
              minWidth: 38,
              textAlign: 'right',
            }}
          >
            {progress}%
          </motion.span>
        )}
      </div>
    </div>
  );
};
