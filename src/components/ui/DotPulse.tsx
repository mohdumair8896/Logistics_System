'use client';

import React from 'react';

interface DotPulseProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function DotPulse({ size = 6, color, className = '', style }: DotPulseProps) {
  const customStyle: React.CSSProperties = {
    ...style,
    ['--pulse-dot-size' as string]: `${size}px`,
    ...(color ? { ['--pulse-dot-color' as string]: color } : {}),
  };

  return (
    <span className={`dots-pulse ${className}`} style={customStyle} aria-label="Loading">
      <span className="dots-pulse__dot" />
      <span className="dots-pulse__dot" />
      <span className="dots-pulse__dot" />
    </span>
  );
}
