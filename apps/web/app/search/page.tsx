'use client';

import { Suspense } from 'react';
import { useT } from '@/lib/locale';
import SearchClient from './SearchClient';

function SearchLoading() {
  const t = useT();
  return (
    <div style={{ padding: '3rem 1.25rem', textAlign: 'center', color: 'rgba(26,22,18,0.55)' }}>
      {t('search.searching')}
    </div>
  );
}

export default function SearchRoute() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchClient />
    </Suspense>
  );
}
