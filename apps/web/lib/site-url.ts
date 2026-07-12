/** URL canónica de la web en producción (siempre preferir www si ambos existen). */
export function getSiteOrigin(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/$/, '');
}

/** Ruta absoluta para redirects de Clerk OAuth (evita bucles www/apex). */
export function clerkRedirectUrl(path: string): string {
  const origin = getSiteOrigin();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return origin ? `${origin}${normalized}` : normalized;
}

/** Orígenes permitidos para validación JWT en middleware (www + apex). */
export function getClerkAuthorizedParties(): string[] | undefined {
  const origin = getSiteOrigin();
  if (!origin) return undefined;

  const parties = new Set<string>([origin]);
  try {
    const url = new URL(origin);
    if (url.hostname.startsWith('www.')) {
      parties.add(`${url.protocol}//${url.hostname.slice(4)}`);
    } else {
      parties.add(`${url.protocol}//www.${url.hostname}`);
    }
  } catch {
    /* ignore malformed NEXT_PUBLIC_SITE_URL */
  }

  return [...parties];
}
