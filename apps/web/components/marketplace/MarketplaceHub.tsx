'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ListingCard, ListingCardSkeleton, EmptyState } from '@lefrig/ui/client';
import {
  MARKETPLACE_DEPARTMENTS,
  getMarketplaceItemHref,
  findDepartmentForSlug,
  listingAttributeFilterSchema,
  type MarketplaceItem,
  type ListingAttributeFilterValues,
} from '@lefrig/shared';
import type { CampSummary, ListingSummary, PaginatedResponse } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { MarketplaceToolbar } from '@/components/marketplace/MarketplaceToolbar';
import { demoCamps, demoListingsPage, fetchWithMeta, filterDemoListings, mapListingsResponse } from '@/lib/api';
import { useT, useLocale } from '@/lib/locale';
import { localizedMarketplaceItem, resolveMarketplaceSearch } from '@lefrig/shared';

function itemHref(item: MarketplaceItem) {
  const base = getMarketplaceItemHref(item);
  if (item.kind === 'listing') return `${base}#listings`;
  return base;
}

function parseAttrFilters(searchParams: URLSearchParams): ListingAttributeFilterValues {
  const raw: Record<string, string> = {};
  for (const key of ['brand', 'yearMin', 'yearMax', 'areaMin', 'propertyType', 'fuel', 'storage']) {
    const v = searchParams.get(key);
    if (v) raw[key] = v;
  }
  return listingAttributeFilterSchema.parse(raw);
}

function appendAttrFilters(params: URLSearchParams, filters: ListingAttributeFilterValues) {
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
}

export function MarketplaceHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const { locale } = useLocale();
  const initialCategory = searchParams.get('category') ?? '';
  const initialQuery = searchParams.get('q') ?? '';

  const [camps, setCamps] = useState<CampSummary[]>(demoCamps);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [campId, setCampId] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const [usingDemo, setUsingDemo] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [attrFilters, setAttrFilters] = useState<ListingAttributeFilterValues>(() =>
    parseAttrFilters(searchParams),
  );

  useEffect(() => {
    setAttrFilters(parseAttrFilters(searchParams));
  }, [searchParams]);

  useEffect(() => {
    setCategory(initialCategory);
    if (initialCategory) {
      const dept = findDepartmentForSlug(initialCategory);
      setActiveDept(dept?.id ?? null);
    }
  }, [initialCategory]);

  useEffect(() => {
    setQuery(initialQuery);
    if (!initialCategory && initialQuery.trim()) {
      const resolved = resolveMarketplaceSearch(initialQuery);
      if (resolved.category) {
        setCategory(resolved.category);
        setActiveDept(findDepartmentForSlug(resolved.category)?.id ?? null);
        if (!resolved.q) setQuery('');
      }
    }
  }, [initialQuery, initialCategory]);

  const load = useCallback(async () => {
    setLoading(true);
    setApiError(false);
    const resolved = resolveMarketplaceSearch(query);
    const effectiveCategory = category || resolved.category || '';
    const effectiveQuery = category ? query.trim() : resolved.q;

    const params = new URLSearchParams();
    if (campId) params.set('campId', campId);
    if (effectiveCategory) params.set('category', effectiveCategory);
    if (effectiveQuery) params.set('q', effectiveQuery);
    appendAttrFilters(params, attrFilters);

    try {
      const campsRes = await fetchWithMeta<CampSummary[]>('/camps', demoCamps);
      setCamps(campsRes.data.length ? campsRes.data : demoCamps);

      const listingsRes = await fetchWithMeta<PaginatedResponse<Record<string, unknown>>>(
        `/listings?${params}`,
        demoListingsPage as unknown as PaginatedResponse<Record<string, unknown>>,
      );
      const mapped = mapListingsResponse(listingsRes.data);
      const data = listingsRes.fromFallback
        ? filterDemoListings(mapped.data.length ? mapped.data : demoListingsPage.data, {
            q: query,
            category: effectiveCategory || undefined,
            campId: campId || undefined,
          })
        : mapped.data;
      setListings(data);
      setUsingDemo(campsRes.fromFallback || listingsRes.fromFallback);
    } catch {
      setListings([]);
      setUsingDemo(false);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }, [campId, category, query, attrFilters]);

  useEffect(() => {
    load();
  }, [load]);

  const selectListingCategory = (slug: string, deptId: string) => {
    setCategory(slug);
    setActiveDept(deptId);
    setAttrFilters({});
    router.replace(`/marketplace?category=${slug}`, { scroll: false });
    document.getElementById('mkt-listings')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearFilters = () => {
    setCategory('');
    setActiveDept(null);
    setQuery('');
    setAttrFilters({});
    router.replace('/marketplace', { scroll: false });
  };

  const applyAttrFilters = (next: ListingAttributeFilterValues) => {
    setAttrFilters(next);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (query) params.set('q', query);
    appendAttrFilters(params, next);
    router.replace(`/marketplace?${params.toString()}`, { scroll: false });
  };

  const clearCategory = () => {
    setCategory('');
    setActiveDept(null);
    setAttrFilters({});
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (campId) params.set('campId', campId);
    router.replace(params.toString() ? `/marketplace?${params}` : '/marketplace', { scroll: false });
  };

  const runSearch = () => {
    const resolved = resolveMarketplaceSearch(query);
    const effectiveCategory = category || resolved.category || '';
    const effectiveQuery = category ? query.trim() : resolved.q;
    const params = new URLSearchParams();
    if (effectiveCategory) params.set('category', effectiveCategory);
    if (effectiveQuery) params.set('q', effectiveQuery);
    if (campId) params.set('campId', campId);
    appendAttrFilters(params, attrFilters);
    if (effectiveCategory && !category) {
      setCategory(effectiveCategory);
      setActiveDept(findDepartmentForSlug(effectiveCategory)?.id ?? null);
    }
    if (!effectiveQuery && resolved.category && !category) setQuery('');
    router.replace(params.toString() ? `/marketplace?${params.toString()}` : '/marketplace', { scroll: false });
  };

  const activeItem = useMemo(() => {
    if (!category) return null;
    for (const d of MARKETPLACE_DEPARTMENTS) {
      const item = d.items.find((i) => i.slug === category);
      if (item) return { dept: d, item };
    }
    return null;
  }, [category]);

  const filteredDepts = activeDept
    ? MARKETPLACE_DEPARTMENTS.filter((d) => d.id === activeDept)
    : MARKETPLACE_DEPARTMENTS;

  return (
    <div className="mkt">
      <header className="mkt-hero">
        <div className="mkt-hero__row">
          <div>
            <p className="mkt-kicker">
              <span className="mkt-live" /> {t('marketplace.kicker')}
            </p>
            <h1>
              {t('marketplace.title')}
              <br />
              <span className="mkt-gradient">{t('marketplace.titleAccent')}</span>
            </h1>
            <p className="mkt-lead">{t('marketplace.lead')}</p>
          </div>
          <Link href="/marketplace/create" className="mkt-cta-pub">
            <AppIcon name="tag" size={20} color="#070b10" />
            {t('marketplace.publishListing')}
          </Link>
        </div>

        {usingDemo && (
          <p className="mkt-demo">{t('common.demo')}</p>
        )}
        {apiError && (
          <p className="mkt-demo" role="alert" style={{ borderColor: 'rgba(196, 92, 58, 0.35)', color: 'var(--sv-terracotta, #c45c3a)' }}>
            {t('errors.apiUnavailable')}
          </p>
        )}
      </header>

      <section className="mkt-departments" aria-label={t('marketplace.exploreCategories')}>
        <div className="mkt-departments__head">
          <h2>{t('marketplace.exploreCategories')}</h2>
          {activeDept && (
            <button type="button" className="mkt-show-all" onClick={() => { setActiveDept(null); }}>
              {t('marketplace.showAll')}
            </button>
          )}
        </div>

        <div className="mkt-dept-grid">
          {filteredDepts.map((dept) => (
            <article
              key={dept.id}
              className={`mkt-dept ${activeDept === dept.id ? 'mkt-dept--focus' : ''}`}
              style={{ '--mkt-accent': dept.accent } as React.CSSProperties}
            >
              <header className="mkt-dept__head">
                <span className="mkt-dept__icon">{dept.icon}</span>
                <div>
                  <h3>{locale === 'ar' ? dept.nameAr : dept.nameEs}</h3>
                </div>
              </header>
              <div className="mkt-dept__items">
                {dept.items.map((item) => {
                  const isActive = category === item.slug;
                  const isListing = item.kind === 'listing';
                  return isListing ? (
                    <button
                      key={item.slug}
                      type="button"
                      className={isActive ? 'mkt-chip mkt-chip--on' : 'mkt-chip'}
                      onClick={() => selectListingCategory(item.slug, dept.id)}
                    >
                      <span>{item.icon}</span>
                      <span>
                        <strong>{item.nameEs}</strong>
                        <em>{item.nameAr}</em>
                      </span>
                    </button>
                  ) : (
                    <Link
                      key={item.slug}
                      href={itemHref(item)}
                      className="mkt-chip mkt-chip--link"
                    >
                      <span>{item.icon}</span>
                      <span>
                        <strong>{item.nameEs}</strong>
                        <em>{item.nameAr}</em>
                      </span>
                      <AppIcon name="arrow-up-right" size={14} color="var(--lf-gold)" />
                    </Link>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="mkt-listings" className="mkt-listings">
        <MarketplaceToolbar
          query={query}
          onQueryChange={setQuery}
          onSearch={runSearch}
          campId={campId}
          onCampChange={setCampId}
          camps={camps}
          category={category}
          categoryLabel={activeItem ? `${activeItem.item.icon} ${localizedMarketplaceItem(activeItem.item.slug, locale)}` : undefined}
          attrFilters={attrFilters}
          onAttrFiltersChange={applyAttrFilters}
          onClearAll={clearFilters}
          onClearCategory={clearCategory}
          resultCount={loading ? undefined : listings.length}
        />

        <div className="mkt-listings__head">
          <h2>{category ? t('marketplace.categoryListings') : t('marketplace.recentListings')}</h2>
        </div>

        {loading ? (
          <div className="mkt-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : apiError ? (
          <EmptyState
            icon="⚠️"
            title={t('errors.genericTitle')}
            description={t('errors.apiUnavailable')}
          />
        ) : listings.length === 0 ? (
          <EmptyState
            icon="🏜️"
            title={t('marketplace.noListings')}
            description={t('marketplace.noListingsHint')}
          />
        ) : (
          <div className="mkt-grid">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/marketplace/${listing.id}`} className="mkt-card-link">
                <ListingCard listing={listing} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
