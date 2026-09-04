import React from 'react';

export default function SaturdayLogo({
  size = 48,
  variant = 'icon', // 'icon' | 'full' | 'login'
  theme = 'light', // 'light' (on dark background) | 'dark' (on light background)
  className = ''
}) {
  const isLightOnDark = theme === 'light';

  if (variant === 'icon') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="satShieldGrad" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="45%" stopColor="#005a9c" />
            <stop offset="100%" stopColor="#0f2b48" />
          </linearGradient>
          <linearGradient id="satGoldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <filter id="logoGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Squircle App Shield */}
        <rect width="56" height="56" rx="14" fill="url(#satShieldGrad)" filter="url(#logoGlow)" />

        {/* Subtle Inner Border */}
        <rect x="0.75" y="0.75" width="54.5" height="54.5" rx="13.25" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" />

        {/* Top Calendar Accent Header Bar */}
        <path d="M0 14C0 6.26801 6.26801 0 14 0H42C49.732 0 56 6.26801 56 14V16H0V14Z" fill="rgba(255,255,255,0.14)" />

        {/* Dual Calendar Binder Pins */}
        <rect x="14" y="3" width="5" height="8" rx="2.5" fill="#ffffff" />
        <rect x="37" y="3" width="5" height="8" rx="2.5" fill="#ffffff" />

        {/* 'S' Ribbon Vector Path */}
        <path
          d="M37 24.5C37 21.4624 34.5376 19 31.5 19H23.5C20.4624 19 18 21.4624 18 24.5C18 27.5376 20.4624 30 23.5 30H32.5C35.5376 30 38 32.4624 38 35.5C38 38.5376 35.5376 41 32.5 41H24.5C21.4624 41 19 38.5376 19 35.5"
          stroke="#ffffff"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Gold Achievement Star Sparkle */}
        <path
          d="M42 12L43.2 15.5L47 16.5L43.2 17.8L42 21.5L40.8 17.8L37 16.5L40.8 15.5L42 12Z"
          fill="url(#satGoldGrad)"
        />
      </svg>
    );
  }

  if (variant === 'login') {
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ position: 'relative' }}>
          <SaturdayLogo size={size} variant="icon" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            lineHeight: 1
          }}>
            <span style={{
              fontSize: '1.45rem',
              fontWeight: 900,
              letterSpacing: '1px',
              color: isLightOnDark ? '#ffffff' : '#0f172a',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif"
            }}>
              SATURDAY
            </span>
            <span style={{
              fontSize: '1.45rem',
              fontWeight: 900,
              letterSpacing: '0.5px',
              color: isLightOnDark ? '#38bdf8' : '#005a9c',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif"
            }}>
              SAT
            </span>
          </div>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '1.8px',
            color: isLightOnDark ? '#bfdbfe' : '#64748b',
            textTransform: 'uppercase',
            marginTop: '3px'
          }}>
            Digital Practice Platform
          </div>
        </div>
      </div>
    );
  }

  // variant === 'full' (horizontal lockup)
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }} className={className}>
      <SaturdayLogo size={size} variant="icon" />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', lineHeight: 1.1 }}>
          <span style={{
            fontSize: `${Math.round(size * 0.38)}px`,
            fontWeight: 900,
            letterSpacing: '0.8px',
            color: isLightOnDark ? '#ffffff' : '#0f172a'
          }}>
            SATURDAY
          </span>
          <span style={{
            fontSize: `${Math.round(size * 0.38)}px`,
            fontWeight: 900,
            letterSpacing: '0.5px',
            color: isLightOnDark ? '#38bdf8' : '#005a9c'
          }}>
            SAT
          </span>
        </div>
        <span style={{
          fontSize: `${Math.max(10, Math.round(size * 0.22))}px`,
          fontWeight: 700,
          letterSpacing: '1px',
          color: isLightOnDark ? '#bfdbfe' : '#64748b',
          textTransform: 'uppercase'
        }}>
          Practice System
        </span>
      </div>
    </div>
  );
}
