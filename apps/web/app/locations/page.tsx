'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@lefrig/ui/client';
import type { CampSummary } from '@lefrig/shared';
import { localizedCampFromSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { PageBody, PageHero } from '@/components/PageHero';
import { demoCamps, fetchApi, fetchWithFallback } from '@/lib/api';
import { useLocale, useT } from '@/lib/locale';

type Market = {
  id: string;
  nameEs: string;
  nameAr?: string;
  description?: string;
  camp?: { slug: string; nameEs: string };
};

type PickupPoint = {
  id: string;
  name: string;
  description?: string;
  campId: string;
};

type Route = {
  id: string;
  name?: string;
  originCamp?: { slug: string; nameEs: string; nameAr?: string };
  destinationCamp?: { slug: string; nameEs: string; nameAr?: string };
  estimatedHours?: number;
};

export default function LocationsPage() {
  const t = useT();
  const { locale } = useLocale();
  const [camps, setCamps] = useState<CampSummary[]>(demoCamps);
  const [campId, setCampId] = useState('');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [pickups, setPickups] = useState<PickupPoint[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithFallback<CampSummary[]>('/camps', demoCamps).then((list) => {
      setCamps(list);
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const slug = params?.get('camp');
      const match = slug ? list.find((c) => c.slug === slug) : list[0];
      setCampId((prev) => prev || match?.id || list[0]?.id || '');
    });
  }, []);

  useEffect(() => {
    if (!campId) return;
    setLoading(true);
    const q = `campId=${campId}`;
    Promise.all([
      fetchApi<Market[]>(`/locations/markets?${q}`).catch(() => [] as Market[]),
      fetchApi<PickupPoint[]>(`/locations/pickup-points?${q}`).catch(() => [] as PickupPoint[]),
      fetchApi<Route[]>(`/locations/routes?originCampId=${campId}`).catch(() => [] as Route[]),
    ]).then(([m, p, r]) => {
      setMarkets(m);
      setPickups(p);
      setRoutes(r);
      setLoading(false);
    });
  }, [campId]);

  const selectedCamp = camps.find((c) => c.id === campId);
  const campName = localizedCampFromSummary(selectedCamp ?? {}, locale);

  const campDisplayName = (camp?: { nameEs: string; nameAr?: string }) =>
    camp ? localizedCampFromSummary(camp, locale) : '';

  return (
    <>
      <PageHero
        icon="map-pin"
        title={t('locations.title')}
        subtitle={t('locations.subtitleFull')}
        action={
          <Link href="/camps" style={{ color: 'var(--lf-gold)', fontWeight: 600, textDecoration: 'none' }}>
            {t('locations.seeCamps')}
          </Link>
        }
      />
      <PageBody maxWidth={1000}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {camps.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCampId(c.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: campId === c.id ? '1px solid var(--lf-gold)' : '1px solid rgba(255,255,255,0.08)',
                background: campId === c.id ? 'rgba(232,184,109,0.12)' : 'transparent',
                color: campId === c.id ? 'var(--lf-gold)' : 'var(--lf-text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {localizedCampFromSummary(c, locale)}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: 'var(--lf-text-muted)' }}>{t('locations.loadingCamp', { camp: campName })}</p>
        ) : (
          <>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 16 }}>{t('locations.marsasInCamp', { camp: campName })}</h2>
            {markets.length === 0 ? (
              <Card padding="md" style={{ marginBottom: 32 }}>
                <p style={{ margin: 0, color: 'var(--lf-text-muted)' }}>{t('locations.noMarsas')}</p>
              </Card>
            ) : (
              <div style={{ display: 'grid', gap: 12, marginBottom: 32, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                {markets.map((m) => (
                  <Card key={m.id} padding="md">
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <AppIcon name="store" size={22} color="var(--lf-gold)" />
                      <div>
                        <h3 style={{ margin: '0 0 4px' }}>
                          {locale === 'ar' && m.nameAr ? m.nameAr : m.nameEs}
                        </h3>
                        <p style={{ margin: 0, color: 'var(--lf-text-muted)', fontSize: '0.9rem' }}>
                          {m.description ?? t('locations.verifiedZone')}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <h2 style={{ fontSize: '1.25rem', marginBottom: 16 }}>{t('locations.points')}</h2>
            {pickups.length === 0 ? (
              <Card padding="md" style={{ marginBottom: 32 }}>
                <p style={{ margin: 0, color: 'var(--lf-text-muted)' }}>{t('locations.noPickup')}</p>
              </Card>
            ) : (
              <div style={{ display: 'grid', gap: 10, marginBottom: 32 }}>
                {pickups.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 14,
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'var(--lf-surface)',
                    }}
                  >
                    <AppIcon name="map-pin" size={18} color="var(--lf-emerald)" />
                    <div>
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: '0.85rem', color: 'var(--lf-text-muted)' }}>{p.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 style={{ fontSize: '1.25rem', marginBottom: 16 }}>{t('locations.routesFromCamp', { camp: campName })}</h2>
            {routes.length === 0 ? (
              <Card padding="md">
                <p style={{ margin: 0, color: 'var(--lf-text-muted)' }}>{t('locations.noRoutesFrom')}</p>
              </Card>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {routes.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: 16,
                      borderRadius: 14,
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'var(--lf-surface)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <AppIcon name="truck" size={18} color="var(--lf-gold)" />
                      <span style={{ fontWeight: 700 }}>
                        {campDisplayName(r.originCamp) || campName} → {campDisplayName(r.destinationCamp) || t('locations.destination')}
                      </span>
                    </div>
                    {r.estimatedHours != null && (
                      <span style={{ color: 'var(--lf-text-muted)', fontSize: '0.85rem' }}>~{r.estimatedHours}h</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <p style={{ marginTop: 40, textAlign: 'center' }}>
          <Link href="/transport" style={{ color: 'var(--lf-gold)', fontWeight: 600 }}>
            {t('locations.requestTransport')}
          </Link>
        </p>
      </PageBody>
    </>
  );
}
