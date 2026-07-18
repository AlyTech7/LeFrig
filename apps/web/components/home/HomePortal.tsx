'use client';

import { ExclusiveAdsCarousel } from '@/components/home/ExclusiveAdsCarousel';
import { HomeAtlas } from '@/components/home/HomeAtlas';

export function HomePortal() {
  return (
    <div className="lf-home">
      <ExclusiveAdsCarousel />
      <HomeAtlas />
    </div>
  );
}
