import React, { useId } from 'react';
import { colors, radii, touchTarget } from '../tokens';

export interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  large?: boolean;
  label?: string;
}

export function SearchBar({
  value = '',
  onChange,
  placeholder = '¿Qué necesitas hoy?',
  onSubmit,
  large,
  label = 'Buscar',
}: SearchBarProps) {
  const id = useId();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: colors.warmWhite,
        borderRadius: radii['2xl'],
        border: `2px solid ${colors.sand[200]}`,
        padding: large ? '4px 4px 4px 20px' : '4px 4px 4px 16px',
        boxShadow: '0 2px 8px rgba(26,26,26,0.06)',
        minHeight: large ? touchTarget.large : touchTarget.comfortable,
      }}
    >
      <span style={{ fontSize: '1.25rem', marginRight: '12px' }} aria-hidden>
        🔍
      </span>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          fontSize: large ? '1.125rem' : '1rem',
          background: 'transparent',
          minHeight: touchTarget.min,
        }}
      />
      {onSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          aria-label={label}
          style={{
            background: colors.deepGreen[500],
            color: colors.warmWhite,
            border: 'none',
            borderRadius: radii.xl,
            padding: '10px 20px',
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: touchTarget.min,
          }}
        >
          Buscar
        </button>
      )}
    </div>
  );
}
