import React, { useId } from 'react';
import { colors, radii } from '../tokens';
import type { CampSummary } from '@lefrig/shared';

export interface CampSelectorProps {
  camps: CampSummary[];
  value?: string;
  onChange: (campId: string) => void;
  locale?: 'ar' | 'es' | 'en';
  label?: string;
}

export function CampSelector({
  camps,
  value,
  onChange,
  locale = 'es',
  label = 'Campamento',
}: CampSelectorProps) {
  const id = useId();
  const campLabel = (camp: CampSummary) => {
    if (locale === 'ar') return camp.nameAr;
    if (locale === 'en') return camp.nameEn;
    return camp.nameEs;
  };

  return (
    <div>
      <label
        htmlFor={id}
        style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9375rem' }}
      >
        {label}
      </label>
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: radii.lg,
          border: `2px solid ${colors.sand[300]}`,
          background: colors.warmWhite,
          fontSize: '1rem',
          minHeight: '48px',
        }}
      >
        <option value="">Todos los campamentos</option>
        {camps.map((camp) => (
          <option key={camp.id} value={camp.id}>
            {campLabel(camp)}
          </option>
        ))}
      </select>
    </div>
  );
}
