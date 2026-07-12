/** Resuelve URLs de imagen relativas o legacy contra la base de la API/CDN. */
export function resolveImageUrl(
  url: string | null | undefined,
  apiBaseUrl = 'http://localhost:3001',
): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const base = apiBaseUrl.replace(/\/$/, '');
  if (trimmed.startsWith('/')) return `${base}${trimmed}`;
  return `${base}/uploads/${trimmed.replace(/^\//, '')}`;
}

export function resolveImageUrls(
  urls: string[] | null | undefined,
  apiBaseUrl?: string,
): string[] {
  if (!urls?.length) return [];
  return urls
    .map((u) => resolveImageUrl(u, apiBaseUrl))
    .filter((u): u is string => Boolean(u));
}
