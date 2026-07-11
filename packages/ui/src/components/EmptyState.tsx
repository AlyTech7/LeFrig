import React from 'react';
import { colors } from '../tokens';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = '🏜️', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: '4rem', marginBottom: '16px' }}>{icon}</span>
      <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 600, color: colors.charcoal }}>
        {title}
      </h3>
      {description && (
        <p style={{ margin: '0 0 24px', fontSize: '0.9375rem', color: colors.gray[500], maxWidth: '320px' }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
