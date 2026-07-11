'use client';

import {
  getListingAttributeSchema,
  localizedAttributeLabel,
  type AttributeFieldDef,
} from '@lefrig/shared';
import { useLocale, useT } from '@/lib/locale';

type Props = {
  categorySlug: string;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
};

function shouldShowField(field: AttributeFieldDef, values: Record<string, unknown>): boolean {
  if (field.key === 'brandOther') return values.brand === 'other';
  return true;
}

function localizedOptionLabel(
  locale: ReturnType<typeof useLocale>['locale'],
  opt: { labelEs: string; labelAr: string },
): string {
  return locale === 'ar' ? opt.labelAr : opt.labelEs;
}

export function ListingAttributeFields({ categorySlug, values, onChange }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const schema = getListingAttributeSchema(categorySlug);
  if (!schema) return null;

  const set = (key: string, raw: string) => {
    const field = schema.fields.find((f) => f.key === key);
    if (!field) return;

    let value: unknown = raw;
    if (field.type === 'number') {
      value = raw === '' ? undefined : Number(raw);
    } else if (raw === '') {
      value = undefined;
    }

    const next = { ...values, [key]: value };
    if (key === 'brand' && raw !== 'other') delete next.brandOther;
    onChange(next);
  };

  return (
    <div className="pub-attrs">
      <p className="pub-subtitle">
        {t('publish.attributeData')}
        <small style={{ display: 'block', fontWeight: 400, marginTop: 4 }}>
          {t('publish.attributeHint')}
        </small>
      </p>
      {schema.fields.filter((f) => shouldShowField(f, values)).map((field) => (
        <label key={field.key} className="pub-field">
          <span>
            {localizedAttributeLabel(field.key, locale, field.labelEs, field.labelAr)}
            {field.required ? ' *' : ''}
          </span>
          {field.type === 'select' ? (
            <select
              value={String(values[field.key] ?? '')}
              onChange={(e) => set(field.key, e.target.value)}
            >
              <option value="">{t('attributes.choose')}</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {localizedOptionLabel(locale, opt)}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              value={values[field.key] != null ? String(values[field.key]) : ''}
              onChange={(e) => set(field.key, e.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
            />
          )}
        </label>
      ))}
    </div>
  );
}
