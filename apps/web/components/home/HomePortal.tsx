'use client';

import { HomeAtlas } from '@/components/home/HomeAtlas';
import { HomeSpotlight } from '@/components/home/HomeSpotlight';

export function HomePortal() {
  return (
    <div className="lf-home">
      <HomeAtlas />
      <HomeSpotlight />
    </div>
  );
}
