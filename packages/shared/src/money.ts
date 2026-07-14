import { DEFAULT_CURRENCY, type CurrencyCode } from './constants/locale.js';

/** Formatea importe con Intl (fallback a código ISO si la moneda no está soportada). */
export function formatMoney(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale = 'es-DZ',
): string {
  if (!Number.isFinite(amount)) return `— ${currency}`;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'DZD' || currency === 'MRU' ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(locale)} ${currency}`;
  }
}

export function isSupportedCurrency(code: string): code is CurrencyCode {
  return ['DZD', 'EUR', 'USD', 'MRU', 'MAD'].includes(code);
}
