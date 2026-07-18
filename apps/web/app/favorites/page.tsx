'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@lefrig/ui/client';
import type { ListingSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { PageBody, PageHero } from '@/components/PageHero';
import { mapApiListing } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useT } from '@/lib/locale';

export default function FavoritesPage() {
  const { authFetch, isSignedIn, isLoaded } = useAuthFetch();
  const t = useT();
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      setListings([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    authFetch<Record<string, unknown>[]>('/listings/favorites/mine')
      .then((items) => {
        if (!cancelled) setListings(items.map((item) => mapApiListing(item)));
      })
      .catch(() => {
        if (!cancelled) setListings([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authFetch, isLoaded, isSignedIn]);

  return (
    <>
      <PageHero icon="heart" title={t('nav.favorites')} subtitle={t('favorites.sub')} maxWidth={900} />
      <PageBody maxWidth={900}>
        {!isLoaded || loading ? (
          <p style={{ color: 'var(--lf-text-muted)' }}>{t('favorites.loading')}</p>
        ) : !isSignedIn ? (
          <Card padding="lg">
            <p style={{ margin: 0, color: 'var(--lf-text-muted)' }}>
              <Link href="/sign-in?redirect_url=/favorites" style={{ color: 'var(--lf-gold)', fontWeight: 600 }}>
                {t('nav.signIn')}
              </Link>
            </p>
          </Card>
        ) : listings.length === 0 ? (
          <Card padding="lg">
            <p style={{ margin: 0, color: 'var(--lf-text-muted)' }}>
              {t('favorites.empty')}{' '}
              <Link href="/marketplace" style={{ color: 'var(--lf-gold)', fontWeight: 600 }}>
                {t('favorites.browseMarket')}
              </Link>
            </p>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {listings.map((item) => (
              <Link
                key={item.id}
                href={`/marketplace/${item.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 18,
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'var(--lf-surface)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <AppIcon name="heart" size={22} color="var(--lf-gold)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800 }}>{item.title}</div>
                  <div style={{ color: 'var(--lf-emerald)', fontWeight: 700, marginTop: 4 }}>
                    {item.price.toLocaleString()} MRU
                  </div>
                </div>
                <AppIcon name="chevron-right" size={18} color="var(--lf-text-muted)" />
              </Link>
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}
