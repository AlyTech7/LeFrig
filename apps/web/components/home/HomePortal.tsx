'use client';

import { ExclusiveAdsCarousel } from '@/components/home/ExclusiveAdsCarousel';
import { HomeAtlas } from '@/components/home/HomeAtlas';

/** Carrusel patrocinado — OFF hasta tener anunciantes reales. Reactivar: true */
const SHOW_PROMO_CAROUSEL = false;

export function HomePortal() {
  return (
    <div className="lf-home">
      {SHOW_PROMO_CAROUSEL ? <ExclusiveAdsCarousel /> : null}
      <HomeAtlas />
    </div>
  );
}
