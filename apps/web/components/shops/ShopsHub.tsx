'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { CampSummary, PaginatedResponse } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { AppImage } from '@/lib/images';
import {
  demoCamps,
  demoShops,
  fetchWithMeta,
  mapApiShop,
  type ShopListItem,
  unwrapPaginated,
} from '@/lib/api';
import { useLocale, useT } from '@/lib/locale';
import { localizedCampFromSummary } from '@lefrig/shared';

type PayFilter = 'all' | 'cash' | 'verified';
type TypeFilter = 'all' | 'individual' | 'restaurant' | 'cooperative' | 'association' | 'workshop';

const SHOP_TYPE_KEYS: Record<string, string> = {
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

const TYPE_FILTERS: { id: TypeFilter; labelKey: string; icon?: string }[] = [
  { id: 'all', labelKey: 'shops.filterAll' },
  { id: 'individual', labelKey: 'shops.typeIndividual', icon: '🏪' },
  { id: 'restaurant', labelKey: 'shops.typeRestaurant', icon: '🍽️' },
  { id: 'cooperative', labelKey: 'shops.typeCooperative', icon: '🤝' },
  { id: 'workshop', labelKey: 'shops.typeWorkshop', icon: '🔧' },
  { id: 'association', labelKey: 'shops.typeAssociation', icon: '👥' },
];

function campEmoji(slug: string) {
  if (slug === 'tindouf') return '🇩🇿';
  return '🇪🇭';
}

function paymentTags(shop: ShopListItem, t: ReturnType<typeof useT>) {
  const tags: { key: string; label: string; cls: string }[] = [];
  if (shop.acceptsCash) tags.push({ key: 'cash', label: t('shops.tagCash'), cls: 'shp-tag--cash' });
  return tags;
}

export function ShopsHub() {
  const t = useT();
  const { locale } = useLocale();
  const [shops, setShops] = useState<ShopListItem[]>([]);
  const [camps, setCamps] = useState<CampSummary[]>(demoCamps);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [campId, setCampId] = useState('');
  const [payFilter, setPayFilter] = useState<PayFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (campId) params.set('campId', campId);
    if (typeFilter !== 'all') params.set('shopType', typeFilter);
    params.set('limit', '100');

    const [campsRes, shopsRes] = await Promise.all([
      fetchWithMeta<CampSummary[]>('/camps', demoCamps),
      fetchWithMeta<PaginatedResponse<ShopListItem> | ShopListItem[]>(
        `/shops?${params}`,
        { data: demoShops, meta: { total: demoShops.length, page: 1, limit: 100, totalPages: 1 } },
      ),
    ]);

    setCamps(campsRes.data.length ? campsRes.data : demoCamps);
    const raw = unwrapPaginated(shopsRes.data);
    setShops(
      shopsRes.fromFallback
        ? demoShops
        : raw.map((item) =>
            'campName' in item && typeof item.campName === 'string'
              ? item
              : mapApiShop(item as unknown as Record<string, unknown>),
          ),
    );
    setUsingDemo(campsRes.fromFallback || shopsRes.fromFallback);
    setLoading(false);
  }, [campId, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = shops;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description?.toLowerCase().includes(q) ?? false) ||
          (s.campName?.toLowerCase().includes(q) ?? false) ||
          (s.shopType?.toLowerCase().includes(q) ?? false),
      );
    }
    if (typeFilter !== 'all' && usingDemo) {
      list = list.filter((s) => (s.shopType ?? 'individual') === typeFilter);
    }
    if (payFilter === 'cash') list = list.filter((s) => s.acceptsCash);
    if (payFilter === 'verified') list = list.filter((s) => s.verified);
    return list;
  }, [shops, query, payFilter, typeFilter, usingDemo]);

  const hasActiveFilters = Boolean(campId || payFilter !== 'all' || typeFilter !== 'all' || query);

  const clearFilters = () => {
    setCampId('');
    setPayFilter('all');
    setTypeFilter('all');
    setQuery('');
  };

  return (
    <div className="shp">
      <header className="shp-hero">
        <div className="shp-hero__row">
          <div className="shp-hero__copy">
            <p className="shp-kicker">
              <span className="shp-kicker__dot" aria-hidden />
              {t('shops.kicker')}
            </p>
            <h1>
              {t('shops.heroTitle')}
              <br />
              <span className="shp-gradient">{t('shops.heroAccent')}</span>
            </h1>
            <p className="shp-lead">{t('shops.lead')}</p>
          </div>
          <div className="shp-hero__actions">
            <Link href="/shops/register" className="shp-cta">
              <AppIcon name="store" size={18} color="#1a1612" />
              {t('shops.registerCta')}
            </Link>
            <p className="shp-hero__hint">{t('shops.browseHint')}</p>
          </div>
        </div>

        <div className="shp-toolbar">
          <label className="shp-search">
            <AppIcon name="search" size={18} color="var(--shp-gold)" />
            <input
              type="search"
              placeholder={t('shops.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t('shops.searchAria')}
            />
          </label>
          <select
            className="shp-select"
            value={campId}
            onChange={(e) => setCampId(e.target.value)}
            aria-label={t('shops.filterCampAria')}
          >
            <option value="">{t('marketplace.allCamps')}</option>
            {camps.map((c) => (
              <option key={c.id} value={c.id}>
                {campEmoji(c.slug)} {localizedCampFromSummary(c, locale)}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <button type="button" className="shp-pill shp-pill--clear" onClick={clearFilters}>
              {t('common.clear')}
            </button>
          )}
        </div>

        <div className="shp-type-rail" role="tablist" aria-label={t('shops.typeFiltersAria')}>
          {TYPE_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={typeFilter === item.id}
              className={typeFilter === item.id ? 'shp-type shp-type--on' : 'shp-type'}
              onClick={() => setTypeFilter(item.id)}
            >
              {item.icon ? <span aria-hidden>{item.icon}</span> : null}
              {t(item.labelKey)}
            </button>
          ))}
        </div>

        <div className="shp-filters" role="tablist" aria-label={t('shops.paymentFiltersAria')}>
          {(
            [
              ['all', 'shops.filterAll'],
              ['cash', 'shops.tagCash'],
              ['verified', 'shops.filterVerified'],
            ] as const
          ).map(([id, labelKey]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={payFilter === id}
              className={payFilter === id ? 'shp-pill shp-pill--on' : 'shp-pill'}
              onClick={() => setPayFilter(id)}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </header>

      {usingDemo && <p className="shp-banner">{t('shops.demoBanner')}</p>}

      {!loading && filtered.length > 0 && (
        <div className="shp-results">
          <p className="shp-results__count">
            {filtered.length === 1
              ? t('shops.resultsCountOne')
              : t('shops.resultsCount', { count: filtered.length })}
          </p>
        </div>
      )}

      {loading ? (
        <div className="shp-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shp-skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="shp-empty">
          <span className="shp-empty__icon" aria-hidden>
            {typeFilter === 'restaurant' ? '🍽️' : '🏪'}
          </span>
          <h3>{t('shops.emptyTitle')}</h3>
          <p>{t('shops.emptyHint')}</p>
          <Link href="/shops/register" className="shp-cta">
            {t('shops.registerCta')}
          </Link>
        </div>
      ) : (
        <div className="shp-grid">
          {filtered.map((shop) => {
            const type = shop.shopType ?? 'individual';
            return (
              <Link key={shop.id} href={`/shops/${shop.id}`} className="shp-card">
                <div className="shp-card__media">
                  {shop.imageUrl ? (
                    <AppImage src={shop.imageUrl} alt="" loading="lazy" />
                  ) : (
                    <span>{TYPE_ICONS[type] ?? '🏪'}</span>
                  )}
                  {shop.verified && (
                    <span className="shp-card__verified">{t('shops.filterVerified')}</span>
                  )}
                </div>
                <div className="shp-card__body">
                  <p className="shp-card__type">
                    <span aria-hidden>{TYPE_ICONS[type] ?? '🏪'}</span>
                    {t(SHOP_TYPE_KEYS[type] ?? 'shops.title')}
                  </p>
                  <h2 className="shp-card__title">{shop.name}</h2>
                  {shop.description && <p className="shp-card__desc">{shop.description}</p>}
                  <div className="shp-card__tags">
                    {paymentTags(shop, t).map((tag) => (
                      <span key={tag.key} className={`shp-tag ${tag.cls}`}>
                        {tag.label}
                      </span>
                    ))}
                  </div>
                  <div className="shp-card__foot">
                    <span>
                      📍 {shop.campName ?? t('shops.campFallback')}
                    </span>
                    {shop.productCount != null && (
                      <span>{t('shops.productCount', { count: shop.productCount })}</span>
                    )}
                  </div>
                  <span className="shp-card__cta">{t('shops.openCta')} →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
