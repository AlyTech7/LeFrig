'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  getListingAttributeFilters,
  hasActiveAttributeFilters,
  type ListingAttributeFilterValues,
} from '@lefrig/shared';
import type { CampSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { ListingAttributeFilters } from '@/components/marketplace/ListingAttributeFilters';
import { useT } from '@/lib/locale';

type ActiveChip = { key: string; label: string; onRemove: () => void };

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
  campId: string;
  onCampChange: (id: string) => void;
  camps: CampSummary[];
  category: string;
  categoryLabel?: string;
  attrFilters: ListingAttributeFilterValues;
  onAttrFiltersChange: (v: ListingAttributeFilterValues) => void;
  onClearAll: () => void;
  onClearCategory: () => void;
  resultCount?: number;
};

export function MarketplaceToolbar({
  query,
  onQueryChange,
  onSearch,
  campId,
  onCampChange,
  camps,
  category,
  categoryLabel,
  attrFilters,
  onAttrFiltersChange,
  onClearAll,
  onClearCategory,
  resultCount,
}: Props) {
  const t = useT();
  const showAttrFilters = Boolean(category && getListingAttributeFilters(category).length > 0);
  const hasAttrActive = hasActiveAttributeFilters(attrFilters);
  const hasFilters = !!query.trim() || !!campId || !!category || hasAttrActive;
  const [attrsOpen, setAttrsOpen] = useState(false);

  useEffect(() => {
    setAttrsOpen(false);
  }, [category]);

  const chips: ActiveChip[] = [];
  if (categoryLabel) {
    chips.push({
      key: 'cat',
      label: categoryLabel,
      onRemove: onClearCategory,
    });
  }
  if (query.trim()) {
    chips.push({
      key: 'q',
      label: `"${query.trim()}"`,
      onRemove: () => onQueryChange(''),
    });
  }
  if (campId) {
    const camp = camps.find((c) => c.id === campId);
    if (camp) {
      chips.push({
        key: 'camp',
        label: camp.nameEs,
        onRemove: () => onCampChange(''),
      });
    }
  }
  for (const def of getListingAttributeFilters(category)) {
    const val = attrFilters[def.param as keyof ListingAttributeFilterValues];
    if (val == null || val === '') continue;
    const label =
      def.type === 'select' && def.options
        ? (def.options.find((o) => o.value === String(val))?.labelEs ?? String(val))
        : String(val);
    chips.push({
      key: def.param,
      label: `${def.labelEs}: ${label}`,
      onRemove: () => {
        const next = { ...attrFilters };
        delete next[def.param as keyof ListingAttributeFilterValues];
        onAttrFiltersChange(next);
      },
    });
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const campSelect = (
    <label className="mkt-toolbar__camp">
      <AppIcon name="map-pin" size={15} color="#0d9488" />
      <select
        value={campId}
        onChange={(e) => onCampChange(e.target.value)}
        aria-label={t('marketplace.allCamps')}
      >
        <option value="">{t('marketplace.allCamps')}</option>
        {camps.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nameEs}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="mkt-toolbar">
      <form className="mkt-toolbar__bar" onSubmit={handleSubmit} role="search">
        <label className="mkt-search-box">
          <span className="mkt-search-box__ico" aria-hidden>
            <AppIcon name="search" size={16} color="#a8842d" />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t('marketplace.searchPlaceholder')}
            aria-label={t('marketplace.searchPlaceholder')}
            autoComplete="off"
            enterKeyHint="search"
          />
          {query ? (
            <button
              type="button"
              className="mkt-search-box__clear"
              aria-label={t('common.clearAll')}
              onClick={() => onQueryChange('')}
            >
              <AppIcon name="x" size={14} color="#5c6570" />
            </button>
          ) : null}
        </label>

        <span className="mkt-toolbar__sep" aria-hidden />
        {campSelect}
        <button type="submit" className="mkt-toolbar__submit" aria-label={t('common.search')}>
          <AppIcon name="search" size={18} color="#1a1612" />
        </button>
      </form>

      <div className="mkt-toolbar__strip">
        {campSelect}
        {showAttrFilters ? (
          <button
            type="button"
            className={
              attrsOpen || hasAttrActive
                ? 'mkt-toolbar__filter-btn mkt-toolbar__filter-btn--on'
                : 'mkt-toolbar__filter-btn'
            }
            aria-expanded={attrsOpen}
            onClick={() => setAttrsOpen((o) => !o)}
          >
            <AppIcon name="sliders" size={14} color="currentColor" />
            {t('common.filters')}
            {hasAttrActive ? <i className="mkt-toolbar__filter-dot" aria-hidden /> : null}
          </button>
        ) : null}
        {resultCount !== undefined ? (
          <span className="mkt-toolbar__count mkt-toolbar__count--strip">
            {resultCount}{' '}
            {t(resultCount === 1 ? 'common.results' : 'common.results_plural', {
              count: resultCount,
            })}
          </span>
        ) : null}
        {hasFilters ? (
          <button type="button" className="mkt-toolbar__clear" onClick={onClearAll}>
            {t('common.clearAll')}
          </button>
        ) : null}
      </div>

      {showAttrFilters ? (
        <div
          className={
            attrsOpen ? 'mkt-toolbar__attrs mkt-toolbar__attrs--open' : 'mkt-toolbar__attrs'
          }
        >
          <ListingAttributeFilters
            categorySlug={category}
            values={attrFilters}
            onChange={onAttrFiltersChange}
            variant="inline"
          />
        </div>
      ) : null}

      {(chips.length > 0 || resultCount !== undefined) && (
        <div className="mkt-toolbar__foot">
          <div className="mkt-toolbar__chips">
            {chips.map((chip) => (
              <button key={chip.key} type="button" className="mkt-chip-active" onClick={chip.onRemove}>
                {chip.label}
                <AppIcon name="x" size={12} color="#a8842d" />
              </button>
            ))}
          </div>
          <div className="mkt-toolbar__meta-row">
            {resultCount !== undefined && (
              <span className="mkt-toolbar__count">
                {resultCount}{' '}
                {t(resultCount === 1 ? 'common.results' : 'common.results_plural', {
                  count: resultCount,
                })}
              </span>
            )}
            {hasFilters && (
              <button type="button" className="mkt-toolbar__clear" onClick={onClearAll}>
                {t('common.clearAll')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
