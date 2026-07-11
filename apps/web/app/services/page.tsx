'use client';

import { Suspense } from 'react';
import { ServicesHub } from '@/components/services/ServicesHub';
import { useT } from '@/lib/locale';
import './services.css';

function ServicesLoading() {
  const t = useT();
  return (
    <div className="svc-page" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
      {t('common.loading')}
    </div>
  );
}

export default function ServicesPage() {
  return (
    <div className="svc-page">
      <Suspense fallback={<ServicesLoading />}>
        <ServicesHub />
      </Suspense>
    </div>
  );
}
