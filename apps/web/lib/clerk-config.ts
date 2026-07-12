/** Valida keys de Clerk reales (rechaza placeholders de CI). */
export function isUsableClerkPublishableKey(key: string | undefined): boolean {
  const pk = key?.trim() ?? '';
  if (!pk.startsWith('pk_test_') && !pk.startsWith('pk_live_')) return false;
  if (/placeholder|_ci_/i.test(pk)) return false;
  const payload = pk.replace(/^pk_(test|live)_/, '');
  return payload.length >= 20;
}

export function isClerkConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? '';
  const sk = process.env.CLERK_SECRET_KEY?.trim() ?? '';
  return isUsableClerkPublishableKey(pk) && sk.length > 0 && !/placeholder|_ci_/i.test(sk);
}
