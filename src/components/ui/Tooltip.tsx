'use client';

import React, { useState, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

const emptySubscribe = () => () => {};

export interface TooltipProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
}

export function TooltipTrigger({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`inline-flex items-center ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Tooltip({
  title,
  description,
  children,
  placement = 'right',
  className = '',
  delay = 50,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + 10;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - 10;
        break;
      case 'bottom':
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2;
        break;
      case 'top':
      default:
        top = rect.top - 8;
        left = rect.left + rect.width / 2;
        break;
    }

    setCoords({ top, left });
  }, [placement]);

  useEffect(() => {
    if (!isVisible) return;
    const handleScrollOrResize = () => {
      updateCoords();
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isVisible, updateCoords]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updateCoords();
    timeoutRef.current = setTimeout(() => {
      updateCoords();
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const getTransform = () => {
    switch (placement) {
      case 'right':
        return 'translateY(-50%)';
      case 'left':
        return 'translate(-100%, -50%)';
      case 'bottom':
        return 'translateX(-50%)';
      case 'top':
      default:
        return 'translate(-50%, -100%)';
    }
  };

  const getMotionProps = () => {
    switch (placement) {
      case 'right':
        return {
          initial: { opacity: 0, scale: 0.95, x: -5 },
          animate: { opacity: 1, scale: 1, x: 0 },
          exit: { opacity: 0, scale: 0.95, x: -5 },
        };
      case 'left':
        return {
          initial: { opacity: 0, scale: 0.95, x: 5 },
          animate: { opacity: 1, scale: 1, x: 0 },
          exit: { opacity: 0, scale: 0.95, x: 5 },
        };
      case 'bottom':
        return {
          initial: { opacity: 0, scale: 0.95, y: -4 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.95, y: -4 },
        };
      case 'top':
      default:
        return {
          initial: { opacity: 0, scale: 0.95, y: 4 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.95, y: 4 },
        };
    }
  };

  const motionProps = getMotionProps();

  return (
    <div
      ref={triggerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}

      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isVisible && coords && (
            <motion.div
              initial={motionProps.initial}
              animate={motionProps.animate}
              exit={motionProps.exit}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              role="tooltip"
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                transform: getTransform(),
                backgroundColor: '#0B0F19',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: 8,
                padding: '6px 11px',
                fontSize: 12,
                lineHeight: 1.35,
                maxWidth: 260,
                width: 'max-content',
                whiteSpace: 'nowrap',
                zIndex: 999999,
                boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.25)',
                pointerEvents: 'none',
                textAlign: 'left',
                backdropFilter: 'blur(8px)',
              }}
            >
              {placement === 'right' && (
                <div
                  style={{
                    position: 'absolute',
                    left: -4,
                    top: '50%',
                    transform: 'translateY(-50%) rotate(45deg)',
                    width: 8,
                    height: 8,
                    backgroundColor: '#0B0F19',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.14)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.14)',
                  }}
                />
              )}
              <div style={{ fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.1px' }}>
                {title}
              </div>
              {description && (
                <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2, fontWeight: 400 }}>
                  {description}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
