import React from 'react';
import type { Locale } from '@lefrig/shared';
import { Badge } from './Badge';

export interface CashPaymentBadgeProps {
  method: 'cash' | 'cash_on_delivery' | 'fiado' | 'voucher' | 'manual_transfer';
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
  manual_transfer: {
    ar: 'تحويل يدوي',
    es: 'Transferencia manual',
    fr: 'Virement manuel',
    en: 'Manual transfer',
  },
};

export function CashPaymentBadge({ method, locale = 'es' }: CashPaymentBadgeProps) {
  const variant = method === 'fiado' ? 'info' : method === 'voucher' ? 'warning' : 'success';
  return (
    <Badge variant={variant} size="sm">
      💵 {labels[method][locale]}
    </Badge>
  );
}
