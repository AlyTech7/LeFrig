'use client';

import { getListingAttributeFilters, type ListingAttributeFilterValues } from '@lefrig/shared';
import { useT } from '@/lib/locale';

type Props = {
  categorySlug: string;
  values: ListingAttributeFilterValues;
  onChange: (values: ListingAttributeFilterValues) => void;
  variant?: 'panel' | 'inline';
};

export function ListingAttributeFilters({
  categorySlug,
  values,
  onChange,
  variant = 'panel',
}: Props) {
  const t = useT();
  const defs = getListingAttributeFilters(categorySlug);
  if (!defs.length) return null;

  const set = (param: keyof ListingAttributeFilterValues, raw: string) => {
    const next: ListingAttributeFilterValues = { ...values };
    if (raw === '') {
      delete next[param];
    } else {
      const def = defs.find((d) => d.param === param);
      (next as Record<string, string | number>)[param] =
        def?.type === 'number' ? Number(raw) : raw;
    }
    onChange(next);
  };

  const rootClass = variant === 'inline' ? 'mkt-attr-inline' : 'mkt-attr-filters';

  return (
    <div className={rootClass}>
      {variant === 'panel' && (
        <div className="mkt-attr-filters__head">
          <span>{t('marketplace.quickFilters')}</span>
        </div>
      )}
      <div className={variant === 'inline' ? 'mkt-attr-inline__row' : 'mkt-attr-filters__row'}>
        {defs.map((def) => (
          <label
            key={def.param}
            className={variant === 'inline' ? 'mkt-attr-inline__field' : 'mkt-attr-filters__field'}
          >
            {variant === 'panel' && <span>{t(`attributes.${def.param}` as 'attributes.brand')}</span>}
            {def.type === 'select' && def.options ? (
              <select
                aria-label={def.labelEs}
                value={String(values[def.param as keyof ListingAttributeFilterValues] ?? '')}
                onChange={(e) => set(def.param as keyof ListingAttributeFilterValues, e.target.value)}
              >
                <option value="">{variant === 'inline' ? t(`attributes.${def.param}` as 'attributes.brand') : t('attributes.choose')}</option>
                {def.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.labelEs}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                aria-label={def.labelEs}
                placeholder={def.placeholder ?? def.labelEs}
                value={
                  values[def.param as keyof ListingAttributeFilterValues] != null
                    ? String(values[def.param as keyof ListingAttributeFilterValues])
                    : ''
                }
                onChange={(e) => set(def.param as keyof ListingAttributeFilterValues, e.target.value)}
              />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
