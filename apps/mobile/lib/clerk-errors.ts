/** Extrae código/mensaje legible de errores Clerk. */
export function getClerkErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const e = err as { errors?: Array<{ code?: string; message?: string }>; message?: string };
  return e.errors?.[0]?.code;
}

export function getClerkErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') return fallback;
  const e = err as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string };
  const first = e.errors?.[0];
  const msg = first?.longMessage || first?.message || e.message;
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
}

export function isIdentifierNotFound(err: unknown): boolean {
  const code = getClerkErrorCode(err);
  return code === 'form_identifier_not_found' || code === 'form_identifier_not_found_email';
}

export function isIdentifierExists(err: unknown): boolean {
  const code = getClerkErrorCode(err);
  return (
    code === 'form_identifier_exists' ||
    code === 'form_identifier_exists_email' ||
    code === 'form_email_address_exists'
  );
}
