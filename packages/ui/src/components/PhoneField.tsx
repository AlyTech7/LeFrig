'use client';

import React, { useMemo } from 'react';
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  formatPhone,
  normalizePhoneE164,
  parsePhoneE164,
  phoneCountryLabel,
  type PhoneCountry,
} from '@lefrig/shared';
import { colors, radii, touchTarget } from '../tokens';

export interface PhoneFieldProps {
  value: string;
  onChange: (e164: string) => void;
  locale?: 'es' | 'en' | 'fr' | 'ar';
  label?: string;
  hint?: string;
  error?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
}

export function PhoneField({
  value,
  onChange,
  locale = 'es',
  label,
  hint,
  error,
  id = 'phone-field',
  disabled,
  required,
}: PhoneFieldProps) {
  const parsed = useMemo(() => parsePhoneE164(value || DEFAULT_PHONE_COUNTRY.dial), [value]);
  const country = parsed?.country ?? DEFAULT_PHONE_COUNTRY;
  const local = parsed?.local ?? '';

  const setCountry = (iso: string) => {
    const next = PHONE_COUNTRIES.find((c) => c.iso === iso) ?? DEFAULT_PHONE_COUNTRY;
    onChange(normalizePhoneE164(next.dial, local));
  };

  const setLocal = (raw: string) => {
    onChange(normalizePhoneE164(country.dial, raw));
  };

  const onBlurLocal = () => {
    if (value.trim()) onChange(formatPhone(value, country));
  };

  return (
    <div style={{ width: '100%' }}>
      {label ? (
        <label htmlFor={`${id}-local`} style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9375rem' }}>
          {label}
          {required ? ' *' : ''}
        </label>
      ) : null}
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <select
          id={`${id}-country`}
          aria-label="País"
          value={country.iso}
          disabled={disabled}
          onChange={(e) => setCountry(e.target.value)}
          style={{
            flex: '0 0 auto',
            minWidth: 132,
            minHeight: touchTarget.comfortable,
            padding: '12px 10px',
            borderRadius: radii.lg,
            border: `2px solid ${error ? colors.error : colors.sand[300]}`,
            background: colors.warmWhite,
            fontSize: '0.95rem',
          }}
        >
          {PHONE_COUNTRIES.map((c: PhoneCountry) => (
            <option key={c.iso} value={c.iso}>
              {c.flag} {c.dial} {phoneCountryLabel(c, locale)}
            </option>
          ))}
        </select>
        <input
          id={`${id}-local`}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          disabled={disabled}
          required={required}
          value={local}
          placeholder="555 123 456"
          onChange={(e) => setLocal(e.target.value)}
          onBlur={onBlurLocal}
          style={{
            flex: 1,
            minHeight: touchTarget.comfortable,
            padding: '12px 16px',
            borderRadius: radii.lg,
            border: `2px solid ${error ? colors.error : colors.sand[300]}`,
            background: colors.warmWhite,
            fontSize: '1rem',
            outline: 'none',
          }}
        />
      </div>
      {hint && !error ? (
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: colors.gray[500] }}>{hint}</p>
      ) : null}
      {error ? (
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: colors.error }}>{error}</p>
      ) : null}
    </div>
  );
}
