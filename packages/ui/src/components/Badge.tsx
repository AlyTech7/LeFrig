import React from 'react';
import { colors, radii } from '../tokens';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'gold';
  size?: 'sm' | 'md';
}

const variants: Record<string, { bg: string; color: string }> = {
  default: { bg: colors.sand[200], color: colors.charcoal },
  success: { bg: colors.deepGreen[50], color: colors.deepGreen[600] },
  warning: { bg: colors.amber[100], color: colors.amber[800] },
  error: { bg: colors.accentRed[50], color: colors.accentRed[600] },
  info: { bg: '#E8F4FC', color: colors.info },
  gold: { bg: colors.amber[100], color: colors.amber[700] },
};

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  const v = variants[variant];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '4px 10px' : '6px 14px',
        borderRadius: radii.full,
        fontSize: size === 'sm' ? '0.75rem' : '0.875rem',
        fontWeight: 600,
        background: v.bg,
        color: v.color,
      }}
    >
      {children}
    </span>
  );
}
