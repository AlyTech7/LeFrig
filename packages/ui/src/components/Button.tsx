import React from 'react';
import { colors, radii, shadows, touchTarget } from '../tokens';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: `linear-gradient(135deg, ${colors.deepGreen[500]} 0%, ${colors.deepGreen[400]} 100%)`,
    color: colors.warmWhite,
    border: 'none',
    boxShadow: shadows.md,
  },
  secondary: {
    background: colors.amber[500],
    color: colors.softBlack,
    border: 'none',
  },
  outline: {
    background: 'transparent',
    color: colors.deepGreen[500],
    border: `2px solid ${colors.deepGreen[500]}`,
  },
  ghost: {
    background: colors.sand[100],
    color: colors.softBlack,
    border: 'none',
  },
  danger: {
    background: colors.accentRed[500],
    color: colors.warmWhite,
    border: 'none',
  },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: '8px 16px', fontSize: '0.875rem', minHeight: touchTarget.min },
  md: { padding: '12px 24px', fontSize: '1rem', minHeight: touchTarget.comfortable },
  lg: { padding: '16px 32px', fontSize: '1.125rem', minHeight: touchTarget.large },
  xl: { padding: '20px 40px', fontSize: '1.25rem', minHeight: '72px' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  icon,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: radii.xl,
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        width: fullWidth ? '100%' : undefined,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
    >
      {loading ? '...' : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
