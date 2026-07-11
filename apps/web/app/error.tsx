'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useT } from '@/lib/locale';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="sv-page sv-page--centered" style={{ minHeight: '50vh', padding: '3rem 1.25rem' }}>
      <p className="sv-page__eyebrow">{t('errors.genericEyebrow')}</p>
      <h1>{t('errors.genericTitle')}</h1>
      <p style={{ color: 'var(--sv-text-muted)', maxWidth: '28rem', margin: '0.75rem auto 1.5rem' }}>
        {t('errors.genericBody')}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="sv-btn sv-btn--primary" onClick={() => reset()}>
          {t('errors.retry')}
        </button>
        <Link href="/" className="sv-btn sv-btn--ghost">
          {t('errors.backHome')}
        </Link>
      </div>
    </main>
  );
}
