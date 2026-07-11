import React from 'react';
import { Card } from './Card';
import { colors } from '../tokens';
import type { LedgerSummary } from '@lefrig/shared';

export interface LedgerSummaryCardProps {
  ledger: LedgerSummary;
  locale?: 'ar' | 'es';
  onClick?: () => void;
}

export function LedgerSummaryCard({ ledger, locale = 'es', onClick }: LedgerSummaryCardProps) {
  const isDebt = ledger.balance > 0;
  return (
    <Card padding="md" hover onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: colors.gray[500] }}>
            {locale === 'ar' ? 'دفتر' : 'Mi libreta'} — {ledger.shopName}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 700,
              color: isDebt ? colors.accentRed[600] : colors.deepGreen[600],
            }}
          >
            {ledger.balance.toLocaleString()} {ledger.currency}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: colors.gray[400] }}>
            {isDebt
              ? locale === 'ar'
                ? 'مستحق'
                : 'Pendiente'
              : locale === 'ar'
                ? 'مسدد'
                : 'Al día'}
          </p>
        </div>
        <span style={{ fontSize: '2rem' }}>📒</span>
      </div>
      <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: colors.gray[400] }}>
        🔒 {locale === 'ar' ? 'خاص — مرئي لك وللمتجر فقط' : 'Privado — solo tú y la tienda'}
      </p>
    </Card>
  );
}
