'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical } from 'lucide-react';

export interface DropdownMenuItemProps {
  id?: string;
  label: React.ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string; color?: string }>;
  addon?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface DropdownMenuProps {
  trigger?: React.ReactNode;
  items: (DropdownMenuItemProps | 'separator')[];
  align?: 'left' | 'right';
  className?: string;
  width?: number | string;
}

export function DropdownMenu({
  trigger,
  items,
  align = 'right',
  className = '',
  width = 210,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {trigger ? (
        <div onClick={toggle} role="button" tabIndex={0} style={{ display: 'inline-flex', cursor: 'pointer' }}>
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={toggle}
          className="header-btn"
          aria-label="More actions"
          aria-expanded={isOpen}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 7,
            border: '1px solid var(--border)',
            background: 'var(--surface-1)',
            color: 'var(--icon)',
            cursor: 'pointer',
          }}
        >
          <MoreVertical size={15} />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              [align === 'right' ? 'right' : 'left']: 0,
              width,
              background: 'var(--surface-1, #FFFFFF)',
              border: '1px solid var(--border, #E6E4DF)',
              borderRadius: 12,
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04)',
              padding: 6,
              zIndex: 9999,
            }}
          >
            {items.map((item, idx) => {
              if (item === 'separator') {
                return (
                  <div
                    key={`sep-${idx}`}
                    style={{
                      height: 1,
                      background: 'var(--border, #E6E4DF)',
                      margin: '5px 0',
                    }}
                  />
                );
              }

              const Icon = item.icon;
              return (
                <button
                  key={item.id || idx}
                  type="button"
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!item.disabled && item.onClick) {
                      item.onClick();
                      setIsOpen(false);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    color: item.danger
                      ? 'var(--status-error, #C0392B)'
                      : item.disabled
                      ? 'var(--text-xlow, #B8B8B8)'
                      : 'var(--text-high, #141414)',
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!item.disabled) {
                      e.currentTarget.style.backgroundColor = item.danger
                        ? 'var(--status-error-bg, rgba(192, 57, 43, 0.08))'
                        : 'var(--surface-2, #F3F2EF)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {Icon && <Icon size={14} color={item.danger ? 'var(--status-error)' : 'var(--icon)'} />}
                    <span>{item.label}</span>
                  </div>

                  {item.addon && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: 'var(--text-low)',
                        padding: '2px 6px',
                        borderRadius: 5,
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {item.addon}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
