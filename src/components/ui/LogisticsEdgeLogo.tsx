import React from 'react';

interface LogisticsEdgeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon-only' | 'wordmark' | 'full';
  className?: string;
  glow?: boolean;
}

export default function LogisticsEdgeLogo({
  size = 'md',
  variant = 'wordmark',
  className = '',
  glow = true,
}: LogisticsEdgeLogoProps) {
  const pixelSizes = {
    sm: { icon: 26, font: 15, sub: 9, gap: 8 },
    md: { icon: 34, font: 18, sub: 10.5, gap: 10 },
    lg: { icon: 42, font: 22, sub: 11.5, gap: 12 },
    xl: { icon: 54, font: 28, sub: 13, gap: 14 },
  };

  const current = pixelSizes[size] || pixelSizes.md;

  return (
    <div className={`inline-flex items-center select-none ${className}`} style={{ gap: current.gap }}>
      {/* ─── Vector Icon Badge ─── */}
      <div
        style={{
          width: current.icon,
          height: current.icon,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {glow && (
          <div
            style={{
              position: 'absolute',
              inset: -2,
              borderRadius: current.icon * 0.32,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.4), rgba(14, 165, 233, 0.3))',
              filter: 'blur(8px)',
              opacity: 0.8,
            }}
          />
        )}
        <svg
          viewBox="0 0 44 44"
          width={current.icon}
          height={current.icon}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <defs>
            <linearGradient id="le_bg_grad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>
            <linearGradient id="le_amber_grad" x1="8" y1="8" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="le_cyan_edge" x1="18" y1="8" x2="38" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Rounded Hexagonal / Squircle Frame */}
          <rect
            x="1.5"
            y="1.5"
            width="41"
            height="41"
            rx="12"
            fill="url(#le_bg_grad)"
            stroke="url(#le_amber_grad)"
            strokeWidth="1.5"
          />

          {/* Dynamic Velocity Edge Accent */}
          <polygon
            points="29,9 35,9 25,35 19,35"
            fill="url(#le_cyan_edge)"
            opacity="0.95"
          />

          {/* 'L' Stem & Base */}
          <path
            d="M10 11H15.5V28.5H23V33H10V11Z"
            fill="url(#le_amber_grad)"
          />

          {/* 'E' Crossbars */}
          <path
            d="M18 11H29V15H21.5V20H27.5V24H21.5V29H28.5V33H18V11Z"
            fill="#ffffff"
          />

          {/* Precision Dot Target */}
          <circle cx="34" cy="33" r="2.5" fill="#38bdf8" />
        </svg>
      </div>

      {/* ─── Wordmark / Brand Typography ─── */}
      {variant !== 'icon-only' && (
        <div className="flex flex-col justify-center leading-none">
          <div
            style={{
              fontSize: current.font,
              fontWeight: 900,
              letterSpacing: -0.6,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'baseline',
            }}
          >
            <span>Logistics</span>
            <span
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginLeft: 1,
              }}
            >
              Edge
            </span>
          </div>
          {variant === 'full' && (
            <div
              style={{
                fontSize: current.sub,
                fontWeight: 600,
                color: '#64748b',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginTop: 3,
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              Freight &amp; Fleet OS
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { LogisticsEdgeLogo };

