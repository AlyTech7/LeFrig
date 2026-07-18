import { DEFAULT_CURRENCY, type CurrencyCode } from './constants/locale.js';

const MONEY_MAX = 10_000_000;

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

/** Rechaza NaN/Infinity y valores fuera de rango seguro para importes de producto. */
export function assertFiniteMoney(amount: number, label = 'importe'): number {
  if (!Number.isFinite(amount) || amount < 0 || amount > MONEY_MAX) {
    throw new Error(`${label} inválido`);
  }
  return amount;
}

/** Suma importes con redondeo a 2 decimales (0 para DZD/MRU enteros). */
export function addMoney(a: number, b: number, currency: string = DEFAULT_CURRENCY): number {
  const sum = assertFiniteMoney(a) + assertFiniteMoney(b);
  if (currency === 'DZD' || currency === 'MRU') {
    return Math.round(sum);
  }
  return Math.round(sum * 100) / 100;
}

export function multiplyMoney(
  unit: number,
  quantity: number,
  currency: string = DEFAULT_CURRENCY,
): number {
  const q = Math.trunc(quantity);
  if (!Number.isFinite(q) || q < 0 || q > 999) {
    throw new Error('cantidad inválida');
  }
  const scale = currency === 'DZD' || currency === 'MRU' ? 1 : 100;
  return (Math.round(assertFiniteMoney(unit) * scale) * q) / scale;
}
