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
          <linearGradient id={`lf-gn-a-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#52d492" />
            <stop offset="100%" stopColor="#1f7a52" />
          </linearGradient>
          <linearGradient id={`lf-gn-b-${uid}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6ee7a8" />
            <stop offset="100%" stopColor="#2d9a64" />
          </linearGradient>
          <linearGradient id={`lf-gd-a-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c9a24d" />
            <stop offset="100%" stopColor="#8a6b2e" />
          </linearGradient>
          <linearGradient id={`lf-gd-b-${uid}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f0cc7a" />
            <stop offset="100%" stopColor="#d4a853" />
          </linearGradient>
          <linearGradient id={`lf-or-a-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c45c3a" />
            <stop offset="100%" stopColor="#8f3d24" />
          </linearGradient>
          <linearGradient id={`lf-or-b-${uid}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e88a5c" />
            <stop offset="100%" stopColor="#d4613f" />
          </linearGradient>
          <linearGradient id={`lf-pu-a-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5c3f8f" />
            <stop offset="100%" stopColor="#3d2860" />
          </linearGradient>
          <linearGradient id={`lf-pu-b-${uid}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b6fc4" />
            <stop offset="100%" stopColor="#6b4fa0" />
          </linearGradient>
        </defs>

        {showRing && (
          <circle
            cx="50"
            cy="50"
            r="44"
            className="lf-compass__orbit"
            stroke="rgba(244, 241, 234, 0.14)"
            strokeWidth="0.75"
            strokeDasharray="2 4"
            fill="none"
          />
        )}

        {/* Puntas diagonales */}
        <path d="M58 42 L68 32 L52 48 Z" fill="#2e2e36" className="lf-compass__spike" />
        <path d="M58 58 L68 68 L52 52 Z" fill="#35353f" className="lf-compass__spike" />
        <path d="M42 58 L32 68 L48 52 Z" fill="#2e2e36" className="lf-compass__spike" />
        <path d="M42 42 L32 32 L48 48 Z" fill="#35353f" className="lf-compass__spike" />

        {/* Norte — verde */}
        <path d="M50 11 L61 27 L50 35 L39 27 Z" fill={`url(#lf-gn-a-${uid})`} />
        <path d="M50 11 L50 35 L39 27 Z" fill={`url(#lf-gn-b-${uid})`} opacity="0.92" />

        {/* Este — oro */}
        <path d="M89 50 L73 61 L65 50 L73 39 Z" fill={`url(#lf-gd-a-${uid})`} />
        <path d="M89 50 L65 50 L73 39 Z" fill={`url(#lf-gd-b-${uid})`} opacity="0.92" />

        {/* Sur — terracota */}
        <path d="M50 89 L39 73 L50 65 L61 73 Z" fill={`url(#lf-or-a-${uid})`} />
        <path d="M50 89 L50 65 L61 73 Z" fill={`url(#lf-or-b-${uid})`} opacity="0.92" />

        {/* Oeste — violeta */}
        <path d="M11 50 L27 39 L35 50 L27 61 Z" fill={`url(#lf-pu-a-${uid})`} />
        <path d="M11 50 L35 50 L27 61 Z" fill={`url(#lf-pu-b-${uid})`} opacity="0.92" />

        {/* Núcleo */}
        <circle cx="50" cy="50" r="11" fill="#08090c" className="lf-compass__core" />
        <circle cx="50" cy="50" r="11" stroke="#c9a24d" strokeWidth="1.25" fill="none" />
        <circle cx="50" cy="50" r="2.2" fill="#f4f1ea" className="lf-compass__eye" />
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
