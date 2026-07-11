'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, colors } from '@lefrig/ui/client';
import { CAMPS, demoCamps, fetchWithFallback } from '@/lib/api';
import { PageBody, PageHero } from '@/components/PageHero';
import type { CampSummary } from '@lefrig/shared';
import { localizedCampFromSummary } from '@lefrig/shared';
import { useLocale, useT } from '@/lib/locale';

export default function CampsPage() {
  const t = useT();
  const { locale } = useLocale();
  const [camps, setCamps] = useState<CampSummary[]>(demoCamps);

  useEffect(() => {
    fetchWithFallback<CampSummary[]>('/camps', demoCamps).then(setCamps);
  }, []);

  return (
    <>
      <PageHero
        icon="map-pin"
        title={t('camps.title')}
        subtitle={t('camps.sub')}
        action={
          <Link href="/locations" style={{ color: 'var(--lf-gold)', fontWeight: 600, textDecoration: 'none' }}>
            {t('camps.viewMap')}
          </Link>
        }
      />
      <PageBody>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {camps.map((camp) => {
          const meta = CAMPS.find((c) => c.slug === camp.slug);
          const campName = localizedCampFromSummary(camp, locale);
          return (
            <Card
              key={camp.id}
              padding="lg"
              hover
              style={{
                borderLeft: `4px solid ${meta?.isTindouf ? colors.amber[600] : colors.deepGreen[500]}`,
              }}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 700 }}>{campName}</h3>
              <p style={{ margin: 0, color: colors.gray[600], fontSize: '0.9rem' }}>
                {meta?.isTindouf ? `🏜️ ${t('camps.intlHub')}` : `🏕️ ${t('camps.activeCamp')}`}
              </p>
              <Link
                href={`/locations?camp=${camp.slug}`}
                style={{ display: 'inline-block', marginTop: 12, color: 'var(--lf-gold)', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}
              >
                {t('camps.seeMarsas')}
              </Link>
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  fontSize: '0.8rem',
                  color: colors.gray[500],
                }}
              >
                <span>🛒 {t('nav.marketplace')}</span>
                <span>🚐 {t('nav.transport')}</span>
                <span>🏪 {t('nav.shops')}</span>
                <span>🤝 {t('nav.community')}</span>
              </div>
            </Card>
          );
        })}
      </div>
      </PageBody>
    </>
  );
}
