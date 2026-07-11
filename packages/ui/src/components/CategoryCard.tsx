import React from 'react';
import { colors, radii } from '../tokens';

export interface CategoryCardProps {
  name: string;
  icon: string;
  onClick?: () => void;
  active?: boolean;
}

export function CategoryCard({ name, icon, onClick, active }: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '16px 12px',
        borderRadius: radii.xl,
        border: active ? `2px solid ${colors.deepGreen[500]}` : `1px solid ${colors.sand[200]}`,
        background: active ? colors.deepGreen[50] : colors.warmWhite,
        cursor: 'pointer',
        minWidth: '80px',
        transition: 'all 0.15s ease',
      }}
    >
      <span style={{ fontSize: '2rem' }}>{icon}</span>
      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.charcoal }}>{name}</span>
    </button>
  );
}
