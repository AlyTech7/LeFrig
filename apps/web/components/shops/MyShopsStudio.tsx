'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppIcon } from '@/components/AppIcon';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';
import { localizedCampFromSummary } from '@lefrig/shared';

type MineShop = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shopType: string;
  imageUrl?: string | null;
  isActive: boolean;
  verified?: boolean;
  phone?: string;
  camp?: { id?: string; slug?: string; nameEs?: string; nameAr?: string };
  _count?: { products: number };
};

const TYPE_KEYS: Record<string, string> = {
  individual: 'shops.typeIndividual',
  restaurant: 'shops.typeRestaurant',
  cooperative: 'shops.typeCooperative',
  association: 'shops.typeAssociation',
  workshop: 'shops.typeWorkshop',
};

const TYPE_ICONS: Record<string, string> = {
  individual: '🏪',
  restaurant: '🍽️',
  cooperative: '🤝',
  association: '👥',
  workshop: '🔧',
};

export function MyShopsStudio() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const { authFetch, isSignedIn, isLoaded } = useAuthFetch();
  const [shops, setShops] = useState<MineShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await authFetch('/auth/sync', { method: 'POST' });
      const mine = await authFetch<MineShop[]>('/shops/mine');
      setShops(Array.isArray(mine) ? mine : []);
    } catch {
      setError(t('shops.mine.loadError'));
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, [authFetch, t]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=/shops/mine');
      return;
    }
    void load();
  }, [isLoaded, isSignedIn, load, router]);

  return (
    <div className="shp-mine">
      <header className="shp-mine__hero">
        <div className="shp-mine__hero-top">
          <Link href="/me" className="pub-back">
            <AppIcon name="arrow-left" size={16} color="var(--shp-gold)" />
            {t('shops.mine.back')}
          </Link>
          <div className="shp-mine__hero-actions">
            <Link href="/shops" className="pub-btn pub-btn--ghost">
              {t('shops.mine.browse')}
            </Link>
            <Link href="/shops/register" className="pub-btn pub-btn--gold">
              <AppIcon name="store" size={16} color="#1a1612" />
              {t('shops.mine.openShop')}
            </Link>
          </div>
        </div>
        <p className="pub-badge">{t('shops.mine.badge')}</p>
        <h1>{t('shops.mine.title')}</h1>
        <p className="shp-lead">{t('shops.mine.lead')}</p>
        {!loading && !error && shops.length > 0 ? (
          <p className="shp-mine__count">{t('shops.mine.countLabel', { count: shops.length })}</p>
        ) : null}
      </header>

      {loading ? (
        <div className="shp-mine__grid">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="shp-skeleton shp-mine__skel" />
          ))}
          <p className="shp-mine__loading">{t('shops.mine.loading')}</p>
        </div>
      ) : error ? (
        <div className="shp-mine__empty">
          <p className="pub-error">{error}</p>
          <button type="button" className="pub-btn pub-btn--gold" onClick={() => void load()}>
            {t('common.retry')}
          </button>
        </div>
      ) : shops.length === 0 ? (
        <div className="shp-mine__empty">
          <span className="shp-mine__empty-icon" aria-hidden>
            🏪
          </span>
          <h2>{t('shops.mine.emptyTitle')}</h2>
          <p>{t('shops.mine.emptyHint')}</p>
          <Link href="/shops/register" className="pub-btn pub-btn--gold">
            {t('shops.mine.emptyCta')}
            <AppIcon name="arrow-up-right" size={18} color="#1a1612" />
          </Link>
        </div>
      ) : (
        <ul className="shp-mine__grid">
          {shops.map((shop) => {
            const typeKey = TYPE_KEYS[shop.shopType] ?? 'shops.typeIndividual';
            const productCount = shop._count?.products ?? 0;
            const campLabel = shop.camp
              ? localizedCampFromSummary(
                  {
                    slug: shop.camp.slug ?? '',
                    nameEs: shop.camp.nameEs ?? '',
                    nameAr: shop.camp.nameAr ?? shop.camp.nameEs ?? '',
                  },
                  locale,
                )
              : '';
            return (
              <li key={shop.id} className={`shp-mine__card ${shop.isActive ? '' : 'shp-mine__card--paused'}`}>
                <div className="shp-mine__media">
                  {shop.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shop.imageUrl} alt="" />
                  ) : (
                    <span aria-hidden>{TYPE_ICONS[shop.shopType] ?? '🏪'}</span>
                  )}
                  <span className={`shp-mine__status ${shop.isActive ? 'shp-mine__status--on' : 'shp-mine__status--off'}`}>
                    {shop.isActive ? t('shops.mine.statusActive') : t('shops.mine.statusPaused')}
                  </span>
                </div>
                <div className="shp-mine__body">
                  <div className="shp-mine__meta">
                    <span className="shp-mine__type">{t(typeKey)}</span>
                    {shop.verified ? <span className="shp-mine__verified">{t('shops.verified')}</span> : null}
                  </div>
                  <h2>{shop.name}</h2>
                  {campLabel ? <p className="shp-mine__camp">{campLabel}</p> : null}
                  {shop.description ? <p className="shp-mine__desc">{shop.description}</p> : null}
                  <p className="shp-mine__products">{t('shops.mine.productsCount', { count: productCount })}</p>
                  <div className="shp-mine__actions">
                    <Link href={`/shops/${shop.id}/manage`} className="pub-btn pub-btn--gold">
                      {t('shops.mine.manage')}
                    </Link>
                    <Link href={`/shops/${shop.id}`} className="pub-btn pub-btn--ghost">
                      {t('shops.mine.viewPublic')}
                    </Link>
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
