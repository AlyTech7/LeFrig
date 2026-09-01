'use client';

import { localizeLegalMeta } from '@/lib/legal-content';
import { useLocale, useT } from '@/lib/locale';

export function LegalPageIntro() {
  const t = useT();
  const { locale } = useLocale();
  const meta = localizeLegalMeta(locale);
  return (
    <section className="lf-page-hero">
      <div className="lf-page-hero-inner">
        <p className="sv-kicker" style={{ marginBottom: '0.75rem' }}>
          {t('legal.hubKicker')}
        </p>
        <h1 className="lf-page-title">{t('legal.hubTitle')}</h1>
        <p className="lf-page-sub">
          {t('legal.hubSubtitle', { date: meta.lastUpdated })}
        </p>
      </div>
    </section>
  );
}
