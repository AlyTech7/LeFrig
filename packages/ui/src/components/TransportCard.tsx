import React from 'react';
import { formatMoney } from '@lefrig/shared';
import { Card } from './Card';
import { Badge } from './Badge';
import { colors } from '../tokens';

export interface TransportCardProps {
  type: string;
  origin: string;
  destination: string;
  status: string;
  priceEstimate?: number;
  seatsAvailable?: number;
  onClick?: () => void;
}

const typeIcons: Record<string, string> = {
  collective_taxi: '🚐',
  delivery: '📦',
  tindouf_import: '🏜️',
  shared_ride: '👥',
  package: '📮',
  person: '🧑',
  errand: '🛵',
};

export function TransportCard({
  type,
  origin,
  destination,
  status,
  priceEstimate,
  seatsAvailable,
  onClick,
}: TransportCardProps) {
  return (
    <Card padding="md" hover onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <span style={{ fontSize: '2rem' }}>{typeIcons[type] ?? '🚐'}</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{origin} → {destination}</p>
          {type === 'tindouf_import' && (
            <Badge variant="gold" size="sm">Traer de Tindouf</Badge>
          )}
        </div>
        <Badge variant={status === 'completed' ? 'success' : 'info'} size="sm">{status}</Badge>
      </div>
      <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: colors.gray[600] }}>
        {priceEstimate != null && <span>{formatMoney(priceEstimate)}</span>}
        {seatsAvailable != null && <span>💺 {seatsAvailable} plazas</span>}
      </div>
    </Card>
  );
}
