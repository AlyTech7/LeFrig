/** Prefijos fijos del formulario de transporte — sin ambigüedad. */
export const TRANSPORT_PHONE_PREFIXES = [
  { dial: '+213', flag: '🇩🇿', iso: 'DZ' },
  { dial: '+34', flag: '🇪🇸', iso: 'ES' },
  { dial: '+222', flag: '🇲🇷', iso: 'MR' },
  { dial: '+33', flag: '🇫🇷', iso: 'FR' },
] as const;

export const TRANSPORT_PHONE_LOCAL_DIGITS = 9;
export const DEFAULT_TRANSPORT_PHONE_DIAL = '+213' as const;

export type TransportPhoneDial = (typeof TRANSPORT_PHONE_PREFIXES)[number]['dial'];

/** Solo dígitos, máximo 9. */
export function sanitizeTransportLocalPhone(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, TRANSPORT_PHONE_LOCAL_DIGITS);
}

/**
 * Devuelve E.164 o undefined si el local está vacío.
 * Si hay dígitos pero no exactamente 9 → lanza Error.
 */
export function buildTransportContactPhone(
  dial: string,
  localRaw: string,
): string | undefined {
  const local = sanitizeTransportLocalPhone(localRaw);
  if (!local) return undefined;
  if (local.length !== TRANSPORT_PHONE_LOCAL_DIGITS) {
    throw new Error(`PHONE_DIGITS_${TRANSPORT_PHONE_LOCAL_DIGITS}`);
  }
  return `${dial}${local}`;
}
