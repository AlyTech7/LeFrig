import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { colors } from '../tokens';

export interface ServiceCardProps {
  name: string;
  category: string;
  icon?: string;
  verified?: boolean;
  rating?: number;
  campName?: string;
  onClick?: () => void;
  tone?: 'light' | 'mirage';
}

export function ServiceCard({
  name,
  category,
  icon = '🔧',
  verified,
  rating,
  campName,
  onClick,
  tone = 'mirage',
}: ServiceCardProps) {
  const dark = tone === 'mirage';

  return (
    <Card padding="md" hover onClick={onClick} tone={tone}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: dark
              ? 'linear-gradient(135deg, rgba(61, 255, 168, 0.15), rgba(139, 124, 248, 0.12))'
              : colors.deepGreen[50],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            flexShrink: 0,
            border: dark ? '1px solid rgba(255,255,255,0.08)' : undefined,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: dark ? '#f4f1ea' : undefined }}>
              {name}
            </h3>
            {verified && <Badge variant="gold" size="sm">✓</Badge>}
          </div>
          <p
            style={{
              margin: '0 0 8px',
              fontSize: '0.875rem',
              color: dark ? 'rgba(244, 241, 234, 0.55)' : colors.gray[500],
            }}
          >
            {category}
          </p>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              fontSize: '0.8125rem',
              color: dark ? 'rgba(244, 241, 234, 0.65)' : colors.gray[600],
            }}
          >
            {rating !== undefined && <span>⭐ {rating.toFixed(1)}</span>}
            {campName && <span>📍 {campName}</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}
