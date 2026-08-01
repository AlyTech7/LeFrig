import { DEFAULT_CURRENCY, formatMoney } from '@lefrig/shared';

export { formatMoney };

export function formatAmount(amount: number, currency?: string | null): string {
  return formatMoney(amount, currency ?? DEFAULT_CURRENCY);
}
