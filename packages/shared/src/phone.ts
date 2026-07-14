import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, type PhoneCountry } from './constants/locale.js';

/** Construye E.164: +213 + dígitos locales. */
export function normalizePhoneE164(dialCode: string, localInput: string): string {
  const dial = dialCode.startsWith('+') ? dialCode : `+${dialCode.replace(/\D/g, '')}`;
  const local = localInput.replace(/\D/g, '').replace(/^0+/, '');
  return `${dial}${local}`;
}

/** Normaliza input libre; default Argelia (+213) si no hay prefijo internacional. */
export function formatPhone(input: string, defaultCountry: PhoneCountry = DEFAULT_PHONE_COUNTRY): string {
  const trimmed = input.trim();
  if (!trimmed) return defaultCountry.dial;

  if (trimmed.startsWith('+')) {
    return `+${trimmed.replace(/\D/g, '')}`;
  }

  const digits = trimmed.replace(/\D/g, '');

  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const country of sorted) {
    const dialDigits = country.dial.slice(1);
    if (digits.startsWith(dialDigits)) return `+${digits}`;
  }

  return normalizePhoneE164(defaultCountry.dial, digits);
}

export function parsePhoneE164(e164: string): { country: PhoneCountry; local: string } | null {
  const normalized = formatPhone(e164);
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const country of sorted) {
    if (normalized.startsWith(country.dial)) {
      return { country, local: normalized.slice(country.dial.length) };
    }
  }
  return null;
}

/** E.164: + y 8–15 dígitos totales. */
export function isValidPhoneE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

export function findPhoneCountryByDial(dial: string): PhoneCountry {
  return PHONE_COUNTRIES.find((c) => c.dial === dial) ?? DEFAULT_PHONE_COUNTRY;
}

export function findPhoneCountryByIso(iso: string): PhoneCountry {
  return PHONE_COUNTRIES.find((c) => c.iso === iso) ?? DEFAULT_PHONE_COUNTRY;
}
