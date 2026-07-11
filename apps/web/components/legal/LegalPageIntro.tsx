'use client';

import { LEGAL_META } from '@/lib/legal-content';
import { useT } from '@/lib/locale';

export function LegalPageIntro() {
  const t = useT();
  return (
    <section className="lf-page-hero">
      <div className="lf-page-hero-inner">
        <p className="sv-kicker" style={{ marginBottom: '0.75rem' }}>
          {t('legal.hubKicker')}
        </p>
        <h1 className="lf-page-title">{t('legal.hubTitle')}</h1>
        <p className="lf-page-sub">
          {t('legal.hubSubtitle', { date: LEGAL_META.lastUpdated })}
        </p>
      </div>
    </section>
  );
}
