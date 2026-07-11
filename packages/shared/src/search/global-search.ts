import { LISTING_CATEGORIES, MARKETPLACE_DEPARTMENTS, SERVICE_CATEGORIES } from '../constants/index.js';
import type { Locale } from '../i18n/index.js';

export type GlobalSearchScope = 'all' | 'market' | 'transport' | 'services';

export type ResolvedMarketplaceSearch = {
  category?: string;
  /** Texto libre para filtrar título/descripción (vacío si solo era una categoría) */
  q: string;
};

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function termsMatch(query: string, candidates: string[]): boolean {
  const q = normalize(query);
  if (!q) return false;
  return candidates.some((c) => {
    const n = normalize(c);
    return n.includes(q) || q.includes(n);
  });
}

/** Encuentra slug de categoría de anuncio (cars, mobiles…) a partir del texto */
export function resolveListingCategoryFromQuery(query: string): string | undefined {
  const trimmed = query.trim();
  if (!trimmed) return undefined;

  for (const dept of MARKETPLACE_DEPARTMENTS) {
    for (const item of dept.items) {
      if (item.kind !== 'listing') continue;
      if (termsMatch(trimmed, [item.slug, item.nameEs, item.nameAr])) {
        return item.slug;
      }
    }
  }

  for (const cat of LISTING_CATEGORIES) {
    if (termsMatch(trimmed, [cat.slug, cat.nameEs, cat.nameAr])) {
      return cat.slug;
    }
  }

  return undefined;
}

/** Encuentra slug de categoría de servicio */
export function resolveServiceCategoryFromQuery(query: string): string | undefined {
  const trimmed = query.trim();
  if (!trimmed) return undefined;

  for (const item of MARKETPLACE_DEPARTMENTS.flatMap((d) => d.items)) {
    if (item.kind !== 'service') continue;
    if (termsMatch(trimmed, [item.slug, item.nameEs, item.nameAr])) {
      return item.slug;
    }
  }

  for (const cat of SERVICE_CATEGORIES) {
    if (termsMatch(trimmed, [cat.slug, cat.nameEs, cat.nameAr])) {
      return cat.slug;
    }
  }

  return undefined;
}

function isCategoryOnlyQuery(query: string, categorySlug: string): boolean {
  const names: string[] = [categorySlug];
  for (const dept of MARKETPLACE_DEPARTMENTS) {
    for (const item of dept.items) {
      if (item.slug === categorySlug) {
        names.push(item.nameEs, item.nameAr);
      }
    }
  }
  for (const cat of LISTING_CATEGORIES) {
    if (cat.slug === categorySlug) {
      names.push(cat.nameEs, cat.nameAr);
    }
  }
  const q = normalize(query);
  return names.some((n) => normalize(n) === q);
}

/** Descompone búsqueda de mercado en categoría + texto */
export function resolveMarketplaceSearch(query: string): ResolvedMarketplaceSearch {
  const trimmed = query.trim();
  if (!trimmed) return { q: '' };

  const category = resolveListingCategoryFromQuery(trimmed);
  if (category && isCategoryOnlyQuery(trimmed, category)) {
    return { category, q: '' };
  }
  if (category) {
    return { category, q: trimmed };
  }
  return { q: trimmed };
}

/** URL destino del buscador global */
export function buildGlobalSearchHref(
  scope: GlobalSearchScope,
  rawQuery: string,
  _locale?: Locale,
): string {
  const trimmed = rawQuery.trim();

  if (!trimmed) {
    if (scope === 'transport') return '/transport';
    if (scope === 'services') return '/services';
    return '/marketplace';
  }

  const encoded = encodeURIComponent(trimmed);

  if (scope === 'transport') {
    return `/transport?q=${encoded}`;
  }

  if (scope === 'services') {
    const cat = resolveServiceCategoryFromQuery(trimmed);
    const params = new URLSearchParams();
    if (cat) params.set('category', cat);
    params.set('q', trimmed);
    return `/services?${params.toString()}`;
  }

  const { category, q } = resolveMarketplaceSearch(trimmed);
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (q) params.set('q', q);
  const qs = params.toString();
  return qs ? `/marketplace?${qs}` : '/marketplace';
}
