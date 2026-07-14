'use client';

import React from 'react';
import {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  currencyLabel,
  type CurrencyCode,
} from '@lefrig/shared';
import { colors, radii, touchTarget } from '../tokens';

export interface CurrencySelectProps {
  value?: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
  locale?: 'es' | 'en' | 'fr' | 'ar';
  label?: string;
  id?: string;
  disabled?: boolean;
}

export function CurrencySelect({
  value = DEFAULT_CURRENCY,
  onChange,
  locale = 'es',
  label,
  id = 'currency-select',
  disabled,
}: CurrencySelectProps) {
  return (
    <div style={{ width: '100%' }}>
      {label ? (
        <label htmlFor={id} style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9375rem' }}>
          {label}
        </label>
      ) : null}
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as CurrencyCode)}
        style={{
          width: '100%',
          minHeight: touchTarget.comfortable,
          padding: '12px 16px',
          borderRadius: radii.lg,
          border: `2px solid ${colors.sand[300]}`,
          background: colors.warmWhite,
          fontSize: '1rem',
        }}
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {currencyLabel(c.code, locale)}
          </option>
        ))}
      </select>
    </div>
  );
}
