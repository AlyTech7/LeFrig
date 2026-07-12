'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SERVICE_CATEGORIES, resolveServiceCategoryFromQuery } from '@lefrig/shared';
import type { CampSummary, PaginatedResponse } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { demoCamps, demoServices, fetchWithMeta, mapApiService, type ServiceItem, unwrapPaginated } from '@/lib/api';
import { AppImage } from '@/lib/images';
import { useLocale, useT } from '@/lib/locale';
import { localizedCampFromSummary, pickLocalized } from '@lefrig/shared';

function campEmoji(slug: string) {
  if (slug === 'tindouf') return '🏜️';
  return 'ⵣ';
}

export function ServicesHub() {
  const t = useT();
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const initialCategory = searchParams.get('category') ?? '';
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [camps, setCamps] = useState<CampSummary[]>(demoCamps);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [campId, setCampId] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
    if (!initialCategory && initialQuery.trim()) {
      const cat = resolveServiceCategoryFromQuery(initialQuery);
      if (cat) {
        setCategory(cat);
        if (initialQuery.trim().toLowerCase() === cat || initialQuery.trim().toLowerCase().includes(cat)) {
          // keep query for text filter
        }
      }
    }
  }, [initialQuery, initialCategory]);

  useEffect(() => {
    if (initialCategory) setCategory(initialCategory);
  }, [initialCategory]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (campId) params.set('campId', campId);
    if (category) params.set('category', category);

    const [campsRes, svcRes] = await Promise.all([
      fetchWithMeta<CampSummary[]>('/camps', demoCamps),
      fetchWithMeta<PaginatedResponse<Record<string, unknown>> | ServiceItem[]>(
        `/services?${params}`,
        { data: demoServices, meta: { total: demoServices.length, page: 1, limit: 50, totalPages: 1 } },
      ),
    ]);

    setCamps(campsRes.data.length ? campsRes.data : demoCamps);
    const raw = unwrapPaginated(svcRes.data);
    setServices(
      svcRes.fromFallback
        ? demoServices
        : raw.map((item) =>
            'categorySlug' in item && typeof item.categorySlug === 'string'
              ? (item as ServiceItem)
              : mapApiService(item as Record<string, unknown>),
          ),
    );
    setUsingDemo(svcRes.fromFallback);
    setLoading(false);
  }, [campId, category]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.categoryName.toLowerCase().includes(q) ||
        s.campName.toLowerCase().includes(q) ||
        (s.nameAr?.includes(q) ?? false),
    );
  }, [services, query]);

  const clearFilters = () => {
    setCategory('');
    setCampId('');
    setQuery('');
  };

  return (
    <div className="svc">
      <header className="svc-hero">
        <div className="svc-hero__row">
          <div>
            <p className="svc-kicker">
              <span className="svc-kicker__dot" aria-hidden />
              {t('services.kicker')}
            </p>
            <h1>
              {t('services.heroTitle')}
              <br />
              <span className="svc-gradient">{t('services.heroAccent')}</span>
            </h1>
            <p className="svc-lead">{t('services.lead')}</p>
          </div>
          <Link href="/services/create" className="svc-cta">
            <AppIcon name="zap" size={18} color="#1a1612" />
            {t('services.offerMine')}
          </Link>
        </div>

        <div className="svc-toolbar">
          <label className="svc-search">
            <AppIcon name="search" size={18} color="var(--svc-gold)" />
            <input
              type="search"
              placeholder={t('services.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t('services.searchAria')}
            />
          </label>
          <select
            className="svc-select"
            value={campId}
            onChange={(e) => setCampId(e.target.value)}
            aria-label={t('services.filterCampAria')}
          >
            <option value="">{t('marketplace.allCamps')}</option>
            {camps.map((c) => (
              <option key={c.id} value={c.id}>
                {campEmoji(c.slug)} {localizedCampFromSummary(c, locale)}
              </option>
            ))}
          </select>
          {(category || campId || query) && (
            <button type="button" className="svc-cat" onClick={clearFilters}>
              {t('services.clearFilters')}
            </button>
          )}
        </div>

        <div className="svc-cats" role="tablist" aria-label={t('services.categoriesAria')}>
          <button
            type="button"
            role="tab"
            aria-selected={!category}
            className={!category ? 'svc-cat svc-cat--on' : 'svc-cat'}
            onClick={() => setCategory('')}
          >
            {t('common.all')}
          </button>
          {SERVICE_CATEGORIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              role="tab"
              aria-selected={category === c.slug}
              className={category === c.slug ? 'svc-cat svc-cat--on' : 'svc-cat'}
              onClick={() => setCategory(c.slug)}
            >
              {c.icon} {pickLocalized(c, locale)}
            </button>
          ))}
        </div>
      </header>

      {usingDemo && <p className="svc-banner">{t('services.demoBanner')}</p>}

      {loading ? (
        <div className="svc-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="svc-skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="svc-empty">
          <h3>{t('services.emptyTitle')}</h3>
          <p>{t('services.emptyHint')}</p>
          <Link href="/services/create" className="svc-cta">
            {t('services.publishMine')}
          </Link>
        </div>
      ) : (
        <div className="svc-grid">
          {filtered.map((svc) => (
            <Link key={svc.id} href={`/services/${svc.id}`} className="svc-card">
              <div className="svc-card__media">
                {svc.imageUrl ? (
                  <AppImage src={svc.imageUrl} alt="" loading="lazy" />
                ) : (
                  <span aria-hidden>{svc.icon}</span>
                )}
                <span className="svc-card__verified">{t('services.verifiedBadge')}</span>
              </div>
              <div className="svc-card__body">
                <p className="svc-card__cat">
                  {svc.icon} {svc.categoryName}
                </p>
                <h2 className="svc-card__title">{svc.title}</h2>
                {svc.description && <p className="svc-card__desc">{svc.description}</p>}
                <div className="svc-card__foot">
                  <span className="svc-card__price">
                    {t('services.priceFrom', { price: svc.priceFrom.toLocaleString('es-ES') })}
                  </span>
                  <span>
                    ⭐ {svc.rating.toFixed(1)} · {svc.campName}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
