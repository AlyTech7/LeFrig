'use client';

import { ExclusiveAdsCarousel } from '@/components/home/ExclusiveAdsCarousel';
import { useT } from '@/lib/locale';

/** Patrocinados discretos — debajo del Atlas, sin duplicar CTAs */
export function HomeSpotlight() {
  const t = useT();

  return (
    <aside className="lf-home-spotlight" aria-label={t('promo.label')}>
      <ExclusiveAdsCarousel />
    </aside>
  );
}
