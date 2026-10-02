'use client';

import {
  PLAY_STORE_BADGE_SRC,
  PLAY_STORE_URL,
  type Locale,
} from '@lefrig/shared';
import { useLocale, useT } from '@/lib/locale';

const BADGE_LOCALES = new Set<string>(Object.keys(PLAY_STORE_BADGE_SRC));

function badgeLocale(locale: Locale): keyof typeof PLAY_STORE_BADGE_SRC {
  return (BADGE_LOCALES.has(locale) ? locale : 'en') as keyof typeof PLAY_STORE_BADGE_SRC;
}

type PlayStoreBadgeProps = {
  className?: string;
  /** Altura visual del badge oficial (Google recomienda ~40–60px). */
  height?: number;
};

/** Badge oficial Google Play — solo Android (App Store aún no publicada). */
export function PlayStoreBadge({ className = 'sv-play-badge', height = 52 }: PlayStoreBadgeProps) {
  const { locale } = useLocale();
  const t = useT();
  const src = PLAY_STORE_BADGE_SRC[badgeLocale(locale)];
  const width = Math.round(height * 2.58);

  return (
    <a
      href={PLAY_STORE_URL}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('stores.playBadgeAria')}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- badge oficial CDN Google Play */}
      <img
        src={src}
        alt={t('stores.getOnPlay')}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
      />
    </a>
  );
}
