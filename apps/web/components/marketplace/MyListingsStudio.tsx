'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { localizedCampFromSummary, resolveImageUrl } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { API_URL } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';

type MineListing = {
  id: string;
  title: string;
  price: number | string;
  currency?: string;
  status: string;
  images?: string[];
  camp?: { slug?: string; nameEs?: string; nameAr?: string };
};

const STATUS_KEY: Record<string, string> = {
  active: 'marketplace.mine.statusActive',
  paused: 'marketplace.mine.statusPaused',
  sold: 'marketplace.mine.statusSold',
  draft: 'marketplace.mine.statusDraft',
};

export function MyListingsStudio() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const { authFetch, isSignedIn, isLoaded } = useAuthFetch();
  const [listings, setListings] = useState<MineListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await authFetch('/auth/sync', { method: 'POST' });
      const mine = await authFetch<MineListing[]>('/listings/mine');
      setListings(Array.isArray(mine) ? mine : []);
    } catch {
      setError(t('marketplace.mine.loadError'));
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [authFetch, t]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=/marketplace/mine');
      return;
    }
    void load();
  }, [isLoaded, isSignedIn, load, router]);

  const setStatus = async (id: string, status: string) => {
    setBusyId(id);
    setError('');
    try {
      await authFetch(`/listings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      flash(t('marketplace.mine.updated'));
    } catch {
      setError(t('marketplace.mine.updateError'));
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
            {t('marketplace.mine.back')}
          </Link>
          <div className="hub-hero__actions">
            <Link href="/marketplace" className="hub-btn hub-btn--ghost">
              {t('marketplace.mine.browse')}
            </Link>
            <Link href="/marketplace/create" className="hub-btn">
              {t('marketplace.mine.publish')}
            </Link>
          </div>
        </div>
        <p className="hub-badge">{t('marketplace.mine.badge')}</p>
        <h1>{t('marketplace.mine.title')}</h1>
        <p className="hub-lead">{t('marketplace.mine.lead')}</p>
        {!loading && !error && listings.length > 0 ? (
          <p className="hub-count">{t('marketplace.mine.countLabel', { count: listings.length })}</p>
        ) : null}
      </header>

      {toast ? <p className="hub-toast">{toast}</p> : null}
      {error ? <p className="hub-error">{error}</p> : null}

      {loading ? (
        <div className="hub-grid">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="hub-skel" />
          ))}
          <p className="hub-lead">{t('marketplace.mine.loading')}</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="hub-empty">
          <span className="hub-empty__icon" aria-hidden>
            🏷️
          </span>
          <h2>{t('marketplace.mine.emptyTitle')}</h2>
          <p>{t('marketplace.mine.emptyHint')}</p>
          <Link href="/marketplace/create" className="hub-btn">
            {t('marketplace.mine.emptyCta')}
            <AppIcon name="arrow-up-right" size={18} color="#1a1612" />
          </Link>
        </div>
      ) : (
        <ul className="hub-grid">
          {listings.map((item) => {
            const img = resolveImageUrl(item.images?.[0], API_URL);
            const camp = item.camp
              ? localizedCampFromSummary(
                  {
                    slug: item.camp.slug,
                    nameEs: item.camp.nameEs,
                    nameAr: item.camp.nameAr,
                  },
                  locale,
                )
              : '';
            const statusKey = STATUS_KEY[item.status] ?? STATUS_KEY.active;
            const active = item.status === 'active';
            return (
              <li key={item.id} className={`hub-card ${active ? '' : 'hub-card--paused'}`}>
                <div className="hub-card__media">
                  {img ? (
                    <img src={img} alt="" />
                  ) : (
                    <span aria-hidden>📦</span>
                  )}
                  <span className={`hub-card__status ${active ? 'hub-card__status--on' : ''}`}>
                    {t(statusKey)}
                  </span>
                </div>
                <div className="hub-card__body">
                  <h2>{item.title}</h2>
                  {camp ? <p className="hub-card__meta">{camp}</p> : null}
                  <p className="hub-card__price">
                    {Number(item.price).toLocaleString(locale === 'ar' ? 'ar' : 'es-ES')}{' '}
                    {t('marketplace.mine.currency')}
                  </p>
                  <div className="hub-card__actions">
                    <Link href={`/marketplace/${item.id}`} className="hub-btn hub-btn--ghost">
                      {t('marketplace.mine.viewPublic')}
                    </Link>
                    {item.status === 'active' ? (
                      <button
                        type="button"
                        className="hub-btn hub-btn--ghost"
                        disabled={busyId === item.id}
                        onClick={() => void setStatus(item.id, 'paused')}
                      >
                        {t('marketplace.mine.pause')}
                      </button>
                    ) : item.status === 'paused' || item.status === 'draft' ? (
                      <button
                        type="button"
                        className="hub-btn"
                        disabled={busyId === item.id}
                        onClick={() => void setStatus(item.id, 'active')}
                      >
                        {t('marketplace.mine.resume')}
                      </button>
                    ) : null}
                    {item.status !== 'sold' ? (
                      <button
                        type="button"
                        className="hub-btn hub-btn--ghost"
                        disabled={busyId === item.id}
                        onClick={() => void setStatus(item.id, 'sold')}
                      >
                        {t('marketplace.mine.markSold')}
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
