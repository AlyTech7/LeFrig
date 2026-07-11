'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { CampSummary, PaginatedResponse } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
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

type PayFilter = 'all' | 'cash' | 'fiado' | 'vouchers' | 'verified';

const SHOP_TYPE_KEYS: Record<string, string> = {
  individual: 'shops.typeIndividual',
  cooperative: 'shops.typeCooperative',
  association: 'shops.typeAssociation',
  workshop: 'shops.typeWorkshop',
};

function campEmoji(slug: string) {
  if (slug === 'tindouf') return '🏜️';
  return 'ⵣ';
}

function paymentTags(shop: ShopListItem, t: ReturnType<typeof useT>) {
  const tags: { key: string; label: string; cls: string }[] = [];
  if (shop.acceptsCash) tags.push({ key: 'cash', label: t('shops.tagCash'), cls: 'shp-tag--cash' });
  if (shop.acceptsFiado) tags.push({ key: 'fiado', label: t('shops.tagFiado'), cls: 'shp-tag--fiado' });
  if (shop.acceptsVouchers) tags.push({ key: 'voucher', label: t('shops.tagVoucher'), cls: 'shp-tag--voucher' });
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
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (campId) params.set('campId', campId);

    const [campsRes, shopsRes] = await Promise.all([
      fetchWithMeta<CampSummary[]>('/camps', demoCamps),
      fetchWithMeta<PaginatedResponse<ShopListItem> | ShopListItem[]>(
        `/shops?${params}`,
        { data: demoShops, meta: { total: demoShops.length, page: 1, limit: 50, totalPages: 1 } },
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
  }, [campId]);

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
          (s.campName?.toLowerCase().includes(q) ?? false),
      );
    }
    if (payFilter === 'cash') list = list.filter((s) => s.acceptsCash);
    if (payFilter === 'fiado') list = list.filter((s) => s.acceptsFiado);
    if (payFilter === 'vouchers') list = list.filter((s) => s.acceptsVouchers);
    if (payFilter === 'verified') list = list.filter((s) => s.verified);
    return list;
  }, [shops, query, payFilter]);

  const clearFilters = () => {
    setCampId('');
    setPayFilter('all');
    setQuery('');
  };

  return (
    <div className="shp">
      <header className="shp-hero">
        <div className="shp-hero__row">
          <div>
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
          <Link href="/shops/register" className="shp-cta">
            <AppIcon name="store" size={18} color="#1a1612" />
            {t('shops.register')}
          </Link>
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
          {(campId || payFilter !== 'all' || query) && (
            <button type="button" className="shp-pill" onClick={clearFilters}>
              {t('common.clear')}
            </button>
          )}
        </div>

        <div className="shp-filters" role="tablist" aria-label={t('shops.paymentFiltersAria')}>
          {(
            [
              ['all', 'shops.filterAll'],
              ['cash', 'shops.tagCash'],
              ['fiado', 'shops.tagFiado'],
              ['vouchers', 'shops.tagVoucher'],
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

      {loading ? (
        <div className="shp-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shp-skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="shp-empty">
          <h3>{t('shops.emptyTitle')}</h3>
          <p>{t('shops.emptyHint')}</p>
          <Link href="/shops/register" className="shp-cta">
            {t('shops.register')}
          </Link>
        </div>
      ) : (
        <div className="shp-grid">
          {filtered.map((shop) => (
            <Link key={shop.id} href={`/shops/${shop.id}`} className="shp-card">
              <div className="shp-card__media">
                {shop.imageUrl ? <img src={shop.imageUrl} alt="" loading="lazy" /> : <span>🏪</span>}
                {shop.verified && <span className="shp-card__verified">{t('shops.filterVerified')}</span>}
              </div>
              <div className="shp-card__body">
                <p className="shp-card__type">
                  {t(SHOP_TYPE_KEYS[shop.shopType ?? 'individual'] ?? 'shops.title')}
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
                  <span>📍 {shop.campName ?? t('shops.campFallback')}</span>
                  {shop.productCount != null && (
                    <span>{t('shops.productCount', { count: shop.productCount })}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
