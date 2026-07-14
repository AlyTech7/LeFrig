import { formatMoney } from '@lefrig/shared';

export { formatMoney };

export function formatAmount(amount: number, currency?: string | null): string {
  return formatMoney(amount, currency ?? 'DZD');
}
