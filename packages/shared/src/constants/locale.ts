/**
 * Moneda principal: duro (دورو) — unidad de cuenta saharaui en campamentos.
 * Relación histórica con el dinar: 20 duros = 1 DZD.
 * Otras divisas quedan como opción (diáspora, comercio regional).
 */
export const DEFAULT_CURRENCY = 'DURU' as const;

/** @deprecated Usar DEFAULT_CURRENCY */
export const CURRENCY = DEFAULT_CURRENCY;

/** Duros por cada dinar argelino (unidad de cuenta oral). */
export const DURU_PER_DZD = 20 as const;

export const SUPPORTED_CURRENCIES = [
  { code: 'DURU', labelEs: 'Duro (دورو)', labelEn: 'Duro', labelFr: 'Douro', labelAr: 'دورو' },
  { code: 'DZD', labelEs: 'Dinar argelino (DA)', labelEn: 'Algerian dinar', labelFr: 'Dinar algérien', labelAr: 'دينار جزائري' },
  { code: 'EUR', labelEs: 'Euro (€)', labelEn: 'Euro', labelFr: 'Euro', labelAr: 'يورو' },
  { code: 'USD', labelEs: 'Dólar ($)', labelEn: 'US dollar', labelFr: 'Dollar US', labelAr: 'دولار' },
  { code: 'MRU', labelEs: 'Ouguiya (UM)', labelEn: 'Ouguiya', labelFr: 'Ouguiya', labelAr: 'أوقية' },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]['code'];

export const CURRENCY_CODES = SUPPORTED_CURRENCIES.map((c) => c.code) as [CurrencyCode, ...CurrencyCode[]];

/** Prefijo telefónico principal: Argelia (+213). */
export const PHONE_COUNTRIES = [
  { iso: 'DZ', dial: '+213', labelEs: 'Argelia', labelEn: 'Algeria', labelFr: 'Algérie', labelAr: 'الجزائر', flag: '🇩🇿' },
  { iso: 'MR', dial: '+222', labelEs: 'Mauritania', labelEn: 'Mauritania', labelFr: 'Mauritanie', labelAr: 'موريتانيا', flag: '🇲🇷' },
  { iso: 'ES', dial: '+34', labelEs: 'España', labelEn: 'Spain', labelFr: 'Espagne', labelAr: 'إسبانيا', flag: '🇪🇸' },
  { iso: 'FR', dial: '+33', labelEs: 'Francia', labelEn: 'France', labelFr: 'France', labelAr: 'فرنسا', flag: '🇫🇷' },
  { iso: 'US', dial: '+1', labelEs: 'EE.UU.', labelEn: 'USA', labelFr: 'États-Unis', labelAr: 'أمريكا', flag: '🇺🇸' },
] as const;

export type PhoneCountry = (typeof PHONE_COUNTRIES)[number];

export const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES[0];

export function currencyLabel(code: CurrencyCode | string, locale: 'es' | 'en' | 'fr' | 'ar' = 'es'): string {
  const row = SUPPORTED_CURRENCIES.find((c) => c.code === code);
  if (!row) return code;
  if (locale === 'en') return row.labelEn;
  if (locale === 'fr') return row.labelFr;
  if (locale === 'ar') return row.labelAr;
  return row.labelEs;
}

export function phoneCountryLabel(country: PhoneCountry, locale: 'es' | 'en' | 'fr' | 'ar' = 'es'): string {
  if (locale === 'en') return country.labelEn;
  if (locale === 'fr') return country.labelFr;
  if (locale === 'ar') return country.labelAr;
  return country.labelEs;
}
