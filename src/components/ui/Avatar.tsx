'use client';

import React, { useState } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  className?: string;
  style?: React.CSSProperties;
}

const sizeMap: Record<AvatarSize, { dimension: number; fontSize: number; dotSize: number }> = {
  xs: { dimension: 24, fontSize: 10, dotSize: 6 },
  sm: { dimension: 32, fontSize: 12, dotSize: 8 },
  md: { dimension: 40, fontSize: 14, dotSize: 10 },
  lg: { dimension: 48, fontSize: 16, dotSize: 12 },
  xl: { dimension: 64, fontSize: 22, dotSize: 14 },
};

const statusColors: Record<AvatarStatus, string> = {
  online: '#16A34A',  // Green
  offline: '#9CA3AF', // Gray
  busy: '#DC2626',    // Red
  away: '#D97706',    // Amber
};

export function Avatar({
  src,
  alt = '',
  name,
  size = 'md',
  status,
  className = '',
  style,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const { dimension, fontSize, dotSize } = sizeMap[size];

  // Derive initials from name or alt
  const displayName = name || alt || '?';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <div
      className={`relative inline-flex flex-shrink-0 items-center justify-center rounded-full select-none ${className}`}
      style={{
        width: dimension,
        height: dimension,
        minWidth: dimension,
        minHeight: dimension,
        ...style,
      }}
    >
      {src && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt || displayName}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0057FF, #0040CC)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize,
            fontWeight: 700,
            fontFamily: 'var(--font-heading, sans-serif)',
            letterSpacing: '0.2px',
            boxShadow: '0 2px 8px var(--brand-glow, rgba(0,87,255,0.15))',
          }}
          aria-label={displayName}
        >
          {initials}
        </div>
      )}

      {/* Status indicator dot */}
      {status && (
        <span
          title={`Status: ${status}`}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            backgroundColor: statusColors[status],
            boxShadow: '0 0 0 2px var(--surface-1, #FFFFFF)',
            display: 'block',
          }}
        />
      )}
    </div>
  );
}
