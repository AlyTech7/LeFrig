import {
  CURRENCY_CODES,
  DEFAULT_CURRENCY,
  DURU_PER_DZD,
  type CurrencyCode,
} from './constants/locale.js';

/** Tope amplio: precios en duros son ~20× los equivalentes en DZD. */
const MONEY_MAX = 200_000_000;

export function isIntegerCurrency(currency: string): boolean {
  return currency === 'DURU' || currency === 'DZD' || currency === 'MRU';
}

export function isSupportedCurrency(code: string): code is CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(code);
}

/** Convierte dinares → duros (unidad de cuenta). */
export function duruFromDzd(dzd: number): number {
  return Math.round(assertFiniteMoney(dzd, 'DZD') * DURU_PER_DZD);
}

/** Convierte duros → dinares. */
export function dzdFromDuru(duru: number): number {
  return Math.round(assertFiniteMoney(duru, 'DURU') / DURU_PER_DZD);
}

function duroWord(amount: number, locale: string): string {
  const abs = Math.abs(Math.round(amount));
  if (locale.startsWith('ar')) return 'دورو';
  if (locale.startsWith('fr')) return abs === 1 ? 'douro' : 'douros';
  if (locale.startsWith('en')) return abs === 1 ? 'duro' : 'duros';
  return abs === 1 ? 'duro' : 'duros';
}

/** Formatea importe con Intl (DURU usa etiqueta cultural, no ISO). */
export function formatMoney(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale = 'es-DZ',
): string {
  if (!Number.isFinite(amount)) return `— ${currency}`;

  if (currency === 'DURU') {
    const n = Math.round(amount).toLocaleString(locale);
    return `${n} ${duroWord(amount, locale)}`;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: isIntegerCurrency(currency) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(locale)} ${currency}`;
  }
}

/** Rechaza NaN/Infinity y valores fuera de rango seguro para importes de producto. */
export function assertFiniteMoney(amount: number, label = 'importe'): number {
  if (!Number.isFinite(amount) || amount < 0 || amount > MONEY_MAX) {
    throw new Error(`${label} inválido`);
  }
  return amount;
}

/** Suma importes con redondeo a 2 decimales (0 para monedas enteras). */
export function addMoney(a: number, b: number, currency: string = DEFAULT_CURRENCY): number {
  const sum = assertFiniteMoney(a) + assertFiniteMoney(b);
  if (isIntegerCurrency(currency)) {
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
  const scale = isIntegerCurrency(currency) ? 1 : 100;
  return (Math.round(assertFiniteMoney(unit) * scale) * q) / scale;
}
