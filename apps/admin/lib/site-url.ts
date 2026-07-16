/** Lee env evitando strings vacíos (común en Vercel si la var existe sin valor). */
export function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

const ADMIN_PRODUCTION_ORIGIN = 'https://admin.lefrig.com';

export function getAdminOrigin(): string | undefined {
  const explicit = readEnv('NEXT_PUBLIC_SITE_URL');
  if (explicit) return explicit.replace(/\/$/, '');

  // Solo disponible en build/servidor; en cliente hace falta NEXT_PUBLIC_SITE_URL.
  const vercel = readEnv('VERCEL_URL');
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`;

  if (process.env.NODE_ENV === 'production') return ADMIN_PRODUCTION_ORIGIN;

  return undefined;
}

/** URL absoluta para redirects de Clerk (evita crash con forceRedirectUrl vacío). */
export function adminRedirectUrl(path: string): string {
  const origin = getAdminOrigin();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return origin ? `${origin}${normalized}` : normalized;
}

/** Login alojado en Clerk (no requiere cargar clerk-js en admin.lefrig.com). */
export function getHostedClerkSignInUrl(returnTo?: string): string {
  const base = readEnv('NEXT_PUBLIC_CLERK_ACCOUNTS_URL') ?? 'https://accounts.lefrig.com/sign-in';
  const url = new URL(base);
  if (returnTo) url.searchParams.set('redirect_url', returnTo);
  return url.toString();
}
