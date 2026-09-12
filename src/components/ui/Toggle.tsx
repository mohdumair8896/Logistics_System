'use client';

import React from 'react';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  size = 'md',
  disabled = false,
  className = '',
  id,
}: ToggleProps) {
  const isSm = size === 'sm';
  const trackWidth = isSm ? 34 : 42;
  const trackHeight = isSm ? 18 : 22;
  const thumbSize = isSm ? 14 : 18;
  const translateOffset = trackWidth - thumbSize - 4;

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div
      className={`inline-flex items-start gap-3 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onClick={handleToggle}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        style={{
          position: 'relative',
          width: trackWidth,
          height: trackHeight,
          borderRadius: 99,
          background: checked ? 'var(--brand, #0057FF)' : 'var(--border-mid, #D2CFC8)',
          border: 'none',
          padding: 2,
          display: 'inline-flex',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: checked ? '0 2px 6px var(--brand-glow, rgba(0,87,255,0.25))' : 'none',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: thumbSize,
            height: thumbSize,
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
            transform: checked ? `translateX(${translateOffset}px)` : 'translateX(2px)',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'block',
          }}
        />
      </button>

      {(label || hint) && (
        <div style={{ lineHeight: 1.3 }}>
          {label && (
            <div style={{ fontSize: isSm ? 12 : 13, fontWeight: 600, color: 'var(--text-high, #141414)' }}>
              {label}
            </div>
          )}
          {hint && (
            <div style={{ fontSize: isSm ? 10.5 : 11.5, color: 'var(--text-low, #909090)', marginTop: 2 }}>
              {hint}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
