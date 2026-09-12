'use client';

import React from 'react';

interface DotSpinnerProps {
  size?: number | string;
  speed?: string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function DotSpinner({
  size = 28,
  speed = '0.9s',
  color,
  className = '',
  style,
}: DotSpinnerProps) {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  const customStyle: React.CSSProperties = {
    ...style,
    ['--uib-size' as string]: sizeValue,
    ['--uib-speed' as string]: speed,
    ...(color ? { ['--uib-color' as string]: color } : {}),
  };

  return (
    <div
      className={`dot-spinner ${className}`}
      style={customStyle}
      role="status"
      aria-label="Loading"
    >
      <div className="dot-spinner__dot" />
      <div className="dot-spinner__dot" />
      <div className="dot-spinner__dot" />
      <div className="dot-spinner__dot" />
      <div className="dot-spinner__dot" />
      <div className="dot-spinner__dot" />
      <div className="dot-spinner__dot" />
      <div className="dot-spinner__dot" />
    </div>
  );
}
