'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ListingSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { mapApiListing } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';
import '../hub-studio.css';

export default function FavoritesPage() {
  const { authFetch, isSignedIn, isLoaded } = useAuthFetch();
  const t = useT();
  const { locale } = useLocale();
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const removeFavorite = async (id: string) => {
    setBusyId(id);
    try {
      await authFetch(`/listings/${id}/favorite`, { method: 'POST' });
      setListings((prev) => prev.filter((l) => l.id !== id));
      setToast(t('favorites.removed'));
      setTimeout(() => setToast(''), 2800);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="hub-page">
      <header className="hub-hero">
        <div className="hub-hero__top">
          <Link href="/me" className="hub-back">
            <AppIcon name="arrow-left" size={16} color="var(--hub-gold)" />
            {t('favorites.back')}
          </Link>
          <Link href="/marketplace" className="hub-btn hub-btn--ghost">
            {t('favorites.browseMarket')}
          </Link>
        </div>
        <h1>{t('favorites.title')}</h1>
        <p className="hub-lead">{t('favorites.sub')}</p>
        {!loading && listings.length > 0 ? (
          <p className="hub-count">{t('favorites.countLabel', { count: listings.length })}</p>
        ) : null}
      </header>

      {toast ? <p className="hub-toast">{toast}</p> : null}

      {!isLoaded || loading ? (
        <div className="hub-grid">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="hub-skel" />
          ))}
        </div>
      ) : !isSignedIn ? (
        <div className="hub-empty">
          <Link href="/sign-in?redirect_url=/favorites" className="hub-back">
            {t('nav.signIn')}
          </Link>
        </div>
      ) : listings.length === 0 ? (
        <div className="hub-empty">
          <span className="hub-empty__icon" aria-hidden>
            ♥
          </span>
          <h2>{t('favorites.emptyTitle')}</h2>
          <p>{t('favorites.emptyHint')}</p>
          <Link href="/marketplace" className="hub-btn">
            {t('favorites.browseMarket')}
          </Link>
        </div>
      ) : (
        <ul className="hub-grid">
          {listings.map((item) => (
            <li key={item.id} className="hub-card">
              <div className="hub-card__media">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" />
                ) : (
                  <span aria-hidden>📦</span>
                )}
              </div>
              <div className="hub-card__body">
                <h2>{item.title}</h2>
                <p className="hub-card__price">
                  {Number(item.price).toLocaleString(locale === 'ar' ? 'ar' : 'es-ES')}{' '}
                  {item.currency || t('favorites.currency')}
                </p>
                <div className="hub-card__actions">
                  <Link href={`/marketplace/${item.id}`} className="hub-btn">
                    {t('shops.openCta')}
                  </Link>
                  <button
                    type="button"
                    className="hub-btn hub-btn--danger"
                    disabled={busyId === item.id}
                    onClick={() => void removeFavorite(item.id)}
                  >
                    {t('favorites.remove')}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
