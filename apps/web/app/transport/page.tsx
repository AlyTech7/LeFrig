'use client';

import { Suspense } from 'react';
import { TransportConnect } from '@/components/transport/TransportConnect';
import { useT } from '@/lib/locale';
import './transport.css';

function TransportLoading() {
  const t = useT();
  return <div className="transport-page__loading">{t('transport.loading')}</div>;
}

export default function TransportPage() {
  return (
    <div className="transport-page">
      <Suspense fallback={<TransportLoading />}>
        <TransportConnect />
      </Suspense>
    </div>
  );
}
