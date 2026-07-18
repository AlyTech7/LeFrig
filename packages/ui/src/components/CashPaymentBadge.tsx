import React from 'react';
import type { Locale } from '@lefrig/shared';
import { Badge } from './Badge';

export interface CashPaymentBadgeProps {
  method: 'cash' | 'cash_on_delivery' | 'manual_transfer' | 'fiado' | 'voucher';
  locale?: Locale;
}

const labels: Record<CashPaymentBadgeProps['method'], Record<Locale, string>> = {
  cash: {
    ar: 'نقداً عند الاستلام',
    es: 'Efectivo al recibir',
    fr: 'Espèces à la réception',
    en: 'Cash on delivery',
  },
  cash_on_delivery: {
    ar: 'نقداً عند التسليم',
    es: 'Efectivo contra entrega',
    fr: 'Espèces à la livraison',
    en: 'Cash on delivery',
  },
  manual_transfer: {
    ar: 'تحويل يدوي',
    es: 'Transferencia manual',
    fr: 'Virement manuel',
    en: 'Manual transfer',
  },
  /** Histórico — no se ofrece en UI nueva */
  fiado: {
    ar: 'fiado / libreta',
    es: 'Fiado / libreta',
    fr: 'Fiado / carnet',
    en: 'Fiado / ledger',
  },
  voucher: {
    ar: 'قسيمة',
    es: 'Voucher',
    fr: 'Bon',
    en: 'Voucher',
  },
};

export function CashPaymentBadge({ method, locale = 'es' }: CashPaymentBadgeProps) {
  const variant = method === 'manual_transfer' ? 'info' : 'success';
  return (
    <Badge variant={variant} size="sm">
      💵 {labels[method][locale]}
    </Badge>
  );
}
