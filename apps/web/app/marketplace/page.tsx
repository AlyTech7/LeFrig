'use client';

import { Suspense } from 'react';
import { MarketplaceHub } from '@/components/marketplace/MarketplaceHub';
import { useT } from '@/lib/locale';
import './marketplace.css';

function MarketplaceLoading() {
  const t = useT();
  return (
    <div className="mkt" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      {t('marketplace.loading')}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <div className="mkt-page">
      <Suspense fallback={<MarketplaceLoading />}>
        <MarketplaceHub />
      </Suspense>
    </div>
  );
}
