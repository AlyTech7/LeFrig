'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useT } from '@/lib/locale';

export default function NotFound() {
  const t = useT();

  useEffect(() => {
    document.title = t('errors.notFoundTitle');
  }, [t]);

  return (
    <main className="sv-page sv-page--centered" style={{ minHeight: '50vh', padding: '3rem 1.25rem' }}>
      <p className="sv-page__eyebrow">404</p>
      <h1>{t('errors.notFoundTitle')}</h1>
      <p style={{ color: 'var(--sv-text-muted)', maxWidth: '28rem', margin: '0.75rem auto 1.5rem' }}>
        {t('errors.notFoundBody')}
      </p>
      <Link href="/" className="sv-btn sv-btn--primary">
        {t('errors.backHome')}
      </Link>
    </main>
  );
}
