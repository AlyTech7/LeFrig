/** Solo rutas internas de la app (evita open redirects). */
export function safeInternalPath(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  try {
    if (raw.startsWith('/') && !raw.startsWith('//')) {
      return raw;
    }
    const u = new URL(raw);
    if (typeof window !== 'undefined' && u.origin === window.location.origin) {
      return `${u.pathname}${u.search}${u.hash}` || fallback;
    }
    const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
    if (site && u.origin === site) {
      return `${u.pathname}${u.search}${u.hash}` || fallback;
    }
    if (site) {
      const www = site.includes('://www.') ? site : site.replace('://', '://www.');
      const apex = site.includes('://www.') ? site.replace('://www.', '://') : site;
      if (u.origin === www || u.origin === apex) {
        return `${u.pathname}${u.search}${u.hash}` || fallback;
      }
    }
  } catch {
    /* ignore */
  }
  return fallback;
}
