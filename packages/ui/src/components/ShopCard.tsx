import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { colors } from '../tokens';
import type { ShopSummary } from '@lefrig/shared';

export interface ShopCardProps {
  shop: ShopSummary;
  campName?: string;
  onClick?: () => void;
  tone?: 'light' | 'mirage';
}

export function ShopCard({ shop, campName, onClick, tone = 'mirage' }: ShopCardProps) {
  const dark = tone === 'mirage';

  return (
    <Card padding="md" hover onClick={onClick} tone={tone}>
      <div style={{ display: 'flex', gap: '16px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: shop.imageUrl
              ? `url(${shop.imageUrl}) center/cover`
              : dark
                ? 'linear-gradient(135deg, rgba(212, 168, 83, 0.25), rgba(61, 255, 168, 0.15))'
                : colors.amber[100],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            flexShrink: 0,
            border: dark ? '1px solid rgba(255,255,255,0.1)' : undefined,
          }}
        >
          {!shop.imageUrl && '🏪'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: dark ? '#f4f1ea' : undefined }}>
              {shop.name}
            </h3>
            {shop.verified && <Badge variant="gold" size="sm">Verificada</Badge>}
          </div>
          {campName && (
            <p
              style={{
                margin: '0 0 8px',
                fontSize: '0.875rem',
                color: dark ? 'rgba(244, 241, 234, 0.55)' : colors.gray[500],
              }}
            >
              📍 {campName}
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {shop.acceptsCash && <Badge variant="success" size="sm">Efectivo</Badge>}
            {shop.acceptsFiado && <Badge variant="info" size="sm">Fiado</Badge>}
            {shop.acceptsVouchers && <Badge variant="warning" size="sm">Vouchers</Badge>}
          </div>
        </div>
      </div>
    </Card>
  );
}
