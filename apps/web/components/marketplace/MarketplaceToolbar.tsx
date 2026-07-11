'use client';

import type { FormEvent } from 'react';
import {
  getListingAttributeFilters,
  hasActiveAttributeFilters,
  type ListingAttributeFilterValues,
} from '@lefrig/shared';
import type { CampSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { ListingAttributeFilters } from '@/components/marketplace/ListingAttributeFilters';

type ActiveChip = { key: string; label: string; onRemove: () => void };

import { useT } from '@/lib/locale';

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
  const showAttrFilters = category && getListingAttributeFilters(category).length > 0;
  const hasFilters =
    !!query.trim() || !!campId || !!category || hasActiveAttributeFilters(attrFilters);

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

  return (
    <div className="mkt-toolbar">
      <form className="mkt-toolbar__search" onSubmit={handleSubmit}>
        <label className="mkt-search-box">
          <AppIcon name="search" size={18} color="var(--lf-gold)" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t('marketplace.searchPlaceholder')}
            aria-label="Buscar en el mercado"
          />
          {query ? (
            <button
              type="button"
              className="mkt-search-box__clear"
              aria-label="Borrar búsqueda"
              onClick={() => {
                onQueryChange('');
              }}
            >
              <AppIcon name="x" size={16} color="var(--lf-text-muted)" />
            </button>
          ) : null}
        </label>
        <button type="submit" className="mkt-toolbar__submit">
          {t('common.search')}
        </button>
      </form>

      <div className="mkt-toolbar__filters">
        <label className="mkt-toolbar__camp">
          <AppIcon name="map-pin" size={16} color="var(--lf-emerald)" />
          <select
            value={campId}
            onChange={(e) => onCampChange(e.target.value)}
            aria-label="Campamento"
          >
            <option value="">{t('marketplace.allCamps')}</option>
            {camps.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEs}
              </option>
            ))}
          </select>
        </label>

        {showAttrFilters ? (
          <>
            <span className="mkt-toolbar__divider" aria-hidden />
            <ListingAttributeFilters
              categorySlug={category}
              values={attrFilters}
              onChange={onAttrFiltersChange}
              variant="inline"
            />
          </>
        ) : null}
      </div>

      {(hasFilters || resultCount !== undefined) && (
        <div className="mkt-toolbar__foot">
          <div className="mkt-toolbar__chips">
            {chips.map((chip) => (
              <button key={chip.key} type="button" className="mkt-chip-active" onClick={chip.onRemove}>
                {chip.label}
                <AppIcon name="x" size={12} color="var(--lf-gold)" />
              </button>
            ))}
          </div>
          <div className="mkt-toolbar__meta-row">
            {resultCount !== undefined && (
              <span className="mkt-toolbar__count">
                {resultCount} {t(resultCount === 1 ? 'common.results' : 'common.results_plural', { count: resultCount })}
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
