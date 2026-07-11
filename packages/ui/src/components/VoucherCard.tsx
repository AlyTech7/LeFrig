import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { colors } from '../tokens';
import type { VoucherSummary } from '@lefrig/shared';

export interface VoucherCardProps {
  voucher: VoucherSummary;
  programName?: string;
  onClick?: () => void;
}

export function VoucherCard({ voucher, programName, onClick }: VoucherCardProps) {
  const isActive = voucher.status === 'active';
  return (
    <Card
      padding="md"
      hover={!!onClick}
      onClick={onClick}
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${colors.amber[50]} 0%, ${colors.warmWhite} 100%)`
          : colors.gray[50],
        borderLeft: `4px solid ${isActive ? colors.amber[500] : colors.gray[300]}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {programName && (
            <p style={{ margin: '0 0 4px', fontSize: '0.8125rem', color: colors.gray[500] }}>{programName}</p>
          )}
          <p style={{ margin: '0 0 4px', fontSize: '1.375rem', fontWeight: 700, color: colors.amber[700] }}>
            {voucher.balance.toLocaleString()} {voucher.currency}
          </p>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: colors.gray[500], fontFamily: 'monospace' }}>
            {voucher.code}
          </p>
        </div>
        <Badge variant={isActive ? 'gold' : 'default'} size="sm">
          {voucher.status}
        </Badge>
      </div>
      <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: colors.gray[400] }}>
        Válido hasta {new Date(voucher.expiresAt).toLocaleDateString()}
      </p>
    </Card>
  );
}
