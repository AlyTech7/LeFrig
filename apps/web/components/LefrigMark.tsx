'use client';

import { useId } from 'react';

export type LefrigMarkProps = {
  size?: number;
  variant?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
  title?: string;
  /** Anillo punteado alrededor del compás */
  showOrbit?: boolean;
};

const VARIANT_SIZE = { sm: 36, md: 44, lg: 72, xl: 96 } as const;

/** Rosa de los vientos Lefrig — compás del Sáhara */
export function LefrigMark({
  size,
  variant = 'sm',
  animated = false,
  className = '',
  title = 'Lefrig',
  showOrbit = true,
}: LefrigMarkProps) {
  const uid = useId().replace(/:/g, '');
  const px = size ?? VARIANT_SIZE[variant];
  const showRing = showOrbit && px >= 28;

  return (
    <span
      className={`lf-compass ${animated ? 'lf-compass--live' : ''} lf-compass--${variant} ${className}`.trim()}
      style={{ width: px, height: px }}
      role="img"
      aria-label={title}
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="lf-compass__svg">
        <defs>
          <filter id={`lf-sh-${uid}`} x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="1.4" stdDeviation="1.1" floodColor="#000" floodOpacity="0.45" />
          </filter>
          <filter id={`lf-glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`lf-gn-a-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#6ee7a8" />
            <stop offset="55%" stopColor="#2d9a64" />
            <stop offset="100%" stopColor="#165a3a" />
          </linearGradient>
          <linearGradient id={`lf-gn-b-${uid}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#52d492" />
            <stop offset="100%" stopColor="#1f7a52" />
          </linearGradient>
          <linearGradient id={`lf-gd-a-${uid}`} x1="100%" y1="50%" x2="0%" y2="50%">
            <stop offset="0%" stopColor="#f0cc7a" />
            <stop offset="55%" stopColor="#d4a853" />
            <stop offset="100%" stopColor="#8a6b2e" />
          </linearGradient>
          <linearGradient id={`lf-gd-b-${uid}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c9a24d" />
            <stop offset="100%" stopColor="#e8c56a" />
          </linearGradient>
          <linearGradient id={`lf-or-a-${uid}`} x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#e88a5c" />
            <stop offset="55%" stopColor="#c45c3a" />
            <stop offset="100%" stopColor="#8f3d24" />
          </linearGradient>
          <linearGradient id={`lf-or-b-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4613f" />
            <stop offset="100%" stopColor="#a84828" />
          </linearGradient>
          <linearGradient id={`lf-pu-a-${uid}`} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#8b6fc4" />
            <stop offset="55%" stopColor="#5c3f8f" />
            <stop offset="100%" stopColor="#3d2860" />
          </linearGradient>
          <linearGradient id={`lf-pu-b-${uid}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6b4fa0" />
            <stop offset="100%" stopColor="#4a3278" />
          </linearGradient>
          <linearGradient id={`lf-spk-a-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3a3a44" />
            <stop offset="100%" stopColor="#222228" />
          </linearGradient>
          <linearGradient id={`lf-spk-b-${uid}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#404048" />
            <stop offset="100%" stopColor="#2a2a32" />
          </linearGradient>
          <linearGradient id={`lf-ring-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0cc7a" />
            <stop offset="50%" stopColor="#c9a24d" />
            <stop offset="100%" stopColor="#8a6b2e" />
          </linearGradient>
          <radialGradient id={`lf-core-${uid}`} cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#1a1b22" />
            <stop offset="100%" stopColor="#08090c" />
          </radialGradient>
          <radialGradient id={`lf-pearl-${uid}`} cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#f4f1ea" />
            <stop offset="100%" stopColor="#c9bba8" />
          </radialGradient>
        </defs>

        {/* Halo ambiente */}
        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(201,162,77,0.07)" strokeWidth="1.1" />

        {showRing && (
          <>
            <circle
              cx="50"
              cy="50"
              r="44"
              className="lf-compass__orbit"
              stroke="rgba(244, 241, 234, 0.16)"
              strokeWidth="0.7"
              strokeDasharray="1.8 3.6"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="rgba(201, 162, 77, 0.12)"
              strokeWidth="0.35"
              strokeDasharray="1.8 3.6"
              strokeDashoffset="2.7"
              fill="none"
            />
          </>
        )}

        {/* Puntas diagonales */}
        <path d="M58 42 L68 32 L52 48 Z" fill={`url(#lf-spk-a-${uid})`} className="lf-compass__spike" />
        <path d="M58 58 L68 68 L52 52 Z" fill={`url(#lf-spk-b-${uid})`} className="lf-compass__spike" />
        <path d="M42 58 L32 68 L48 52 Z" fill={`url(#lf-spk-a-${uid})`} className="lf-compass__spike" />
        <path d="M42 42 L32 32 L48 48 Z" fill={`url(#lf-spk-b-${uid})`} className="lf-compass__spike" />

        <g filter={`url(#lf-sh-${uid})`}>
          {/* Norte — verde */}
          <path d="M50 11 L61 27 L50 35 L39 27 Z" fill={`url(#lf-gn-a-${uid})`} filter={`url(#lf-glow-${uid})`} />
          <path d="M50 11 L50 35 L39 27 Z" fill={`url(#lf-gn-b-${uid})`} opacity="0.9" />
          <path d="M50 13.5 L56.5 26 L50 31.5 L43.5 26 Z" fill="rgba(255,255,255,0.12)" />

          {/* Este — oro */}
          <path d="M89 50 L73 61 L65 50 L73 39 Z" fill={`url(#lf-gd-a-${uid})`} filter={`url(#lf-glow-${uid})`} />
          <path d="M89 50 L65 50 L73 39 Z" fill={`url(#lf-gd-b-${uid})`} opacity="0.9" />
          <path d="M86 50 L73.5 56.5 L68.5 50 L73.5 43.5 Z" fill="rgba(255,255,255,0.14)" />

          {/* Sur — terracota */}
          <path d="M50 89 L39 73 L50 65 L61 73 Z" fill={`url(#lf-or-a-${uid})`} filter={`url(#lf-glow-${uid})`} />
          <path d="M50 89 L50 65 L61 73 Z" fill={`url(#lf-or-b-${uid})`} opacity="0.9" />
          <path d="M50 86 L43.5 73.5 L50 68.5 L56.5 73.5 Z" fill="rgba(255,255,255,0.1)" />

          {/* Oeste — violeta */}
          <path d="M11 50 L27 39 L35 50 L27 61 Z" fill={`url(#lf-pu-a-${uid})`} filter={`url(#lf-glow-${uid})`} />
          <path d="M11 50 L35 50 L27 61 Z" fill={`url(#lf-pu-b-${uid})`} opacity="0.9" />
          <path d="M14 50 L26.5 43.5 L31.5 50 L26.5 56.5 Z" fill="rgba(255,255,255,0.12)" />
        </g>

        {/* Núcleo */}
        <circle cx="50" cy="50" r="12" fill={`url(#lf-core-${uid})`} className="lf-compass__core" />
        <circle cx="50" cy="50" r="12" stroke={`url(#lf-ring-${uid})`} strokeWidth="1.35" fill="none" />
        <circle cx="50" cy="50" r="12" stroke="rgba(255,255,255,0.16)" strokeWidth="0.3" fill="none" />
        <circle cx="50" cy="50" r="8.2" stroke="rgba(201,162,77,0.25)" strokeWidth="0.35" fill="none" />
        <circle cx="50" cy="50" r="2.35" fill={`url(#lf-pearl-${uid})`} className="lf-compass__eye" />
        <circle cx="49.15" cy="49" r="0.65" fill="rgba(255,255,255,0.85)" />
      </svg>
    </span>
  );
}

export type LefrigBrandProps = {
  variant?: 'hero' | 'header' | 'footer';
  animated?: boolean;
  className?: string;
  asLink?: boolean;
};

/** Lockup completo: compás + estela + wordmark */
export function LefrigBrand({
  variant = 'hero',
  animated = false,
  className = '',
  asLink = false,
}: LefrigBrandProps) {
  const sizes = { hero: 96, header: 38, footer: 40 } as const;
  const markSize = sizes[variant];
  const showTagline = variant === 'hero' || variant === 'footer';
  const showTrail = variant !== 'footer';

  const content = (
    <div className={`lf-brand lf-brand--${variant} ${className}`.trim()}>
      <LefrigMark size={markSize} animated={animated} showOrbit={markSize >= 44} />
      {showTrail && (
        <span className="lf-brand__trail" aria-hidden>
          <i className="lf-brand__trail-dot lf-brand__trail-dot--on" />
          <i className="lf-brand__trail-dot" />
          <i className="lf-brand__trail-dot" />
          <i className="lf-brand__trail-dot" />
          <i className="lf-brand__trail-dot" />
        </span>
      )}
      <div className="lf-brand__wordmark">
        <span className="lf-brand__name">LEFRIG</span>
        {showTagline && <span className="lf-brand__tagline">el bazar del Sáhara</span>}
      </div>
    </div>
  );

  if (asLink) {
    return (
      <a href="/" className="lf-brand-link" aria-label="Lefrig — Inicio">
        {content}
      </a>
    );
  }

  return content;
}

/** Icono de búsqueda lineal */
export function IconSearch({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 16L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Icono de campana lineal */
export function IconBell({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4.5c-2.5 0-4.5 2-4.5 4.5v3.5l-1.5 2.5h12l-1.5-2.5V9c0-2.5-2-4.5-4.5-4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 18.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
