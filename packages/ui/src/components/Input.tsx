import React, { useId } from 'react';
import { colors, radii, touchTarget } from '../tokens';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, style, id: idProp, ...props }: InputProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label
          htmlFor={id}
          style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.9375rem' }}
        >
          {label}
        </label>
      )}
      <input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        style={{
          width: '100%',
          minHeight: touchTarget.comfortable,
          padding: '12px 16px',
          fontSize: '1rem',
          borderRadius: radii.lg,
          border: `2px solid ${error ? colors.error : colors.sand[300]}`,
          background: colors.warmWhite,
          outline: 'none',
          ...style,
        }}
      />
      {hint && !error && (
        <p id={hintId} style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: colors.gray[500] }}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: colors.error }}>
          {error}
        </p>
      )}
    </div>
  );
}
