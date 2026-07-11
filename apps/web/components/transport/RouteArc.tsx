'use client';

import { useMemo } from 'react';
import { getTransportHub, hubLabel } from '@lefrig/shared';

type Props = {
  originSlug: string;
  destSlug: string;
};

export function RouteArc({ originSlug, destSlug }: Props) {
  const origin = getTransportHub(originSlug);
  const dest = getTransportHub(destSlug);

  const corridorType = useMemo(() => {
    if (!origin || !dest) return 'local';
    if (origin.zone === 'espana' || origin.zone === 'francia' || dest.zone === 'espana' || dest.zone === 'francia') {
      return 'intercontinental';
    }
    if (origin.zone === 'mauritania' || dest.zone === 'mauritania' || origin.zone === 'tindouf' || dest.zone === 'tindouf') {
      return 'corridor';
    }
    return 'wilaya';
  }, [origin, dest]);

  const label = `${hubLabel(originSlug)} → ${hubLabel(destSlug)}`;

  return (
    <div className="lx-arc" aria-hidden>
      <svg viewBox="0 0 400 120" className="lx-arc__svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="lx-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#e8b86d" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
          <filter id="lx-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M 24 90 Q 120 20, 200 55 T 376 35"
          fill="none"
          stroke="url(#lx-arc-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="6 8"
          className="lx-arc__path"
          filter="url(#lx-glow)"
        />
        <circle cx="24" cy="90" r="7" fill="#34d399" className="lx-arc__dot lx-arc__dot--a" />
        <circle cx="376" cy="35" r="7" fill="#e8b86d" className="lx-arc__dot lx-arc__dot--b" />
      </svg>
      <div className="lx-arc__meta">
        <span className={`lx-arc__tag lx-arc__tag--${corridorType}`}>
          {corridorType === 'intercontinental' ? 'Intercontinental' : corridorType === 'corridor' ? 'Corredor sur' : 'Wilaya'}
        </span>
        <span className="lx-arc__label">{label}</span>
      </div>
    </div>
  );
}
