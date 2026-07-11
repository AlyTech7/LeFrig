import { CAMPS, MARKETPLACE_DEPARTMENTS, SERVICE_CATEGORIES, PAYMENT_LABELS } from '../constants/index.js';
import type { Locale } from './types.js';
import { t } from './translate.js';

type NamedItem = { slug: string; nameAr: string; nameEs: string; nameEn?: string };

export function localizedCampName(
  slug: string,
  locale: Locale,
  fallback?: string,
): string {
  const camp = CAMPS.find((c) => c.slug === slug);
  if (!camp) return fallback ?? slug;
  if (locale === 'ar') return camp.nameAr;
  if (locale === 'en') return camp.nameEn;
  return camp.nameEs;
}

export function localizedCampFromSummary(
  camp: { nameAr?: string; nameEs?: string; nameEn?: string; slug?: string },
  locale: Locale,
): string {
  if (locale === 'ar' && camp.nameAr) return camp.nameAr;
  if (locale === 'en' && camp.nameEn) return camp.nameEn;
  return camp.nameEs ?? camp.nameAr ?? camp.slug ?? '';
}

export function localizedMarketplaceItem(slug: string, locale: Locale): string {
  for (const dept of MARKETPLACE_DEPARTMENTS) {
    const item = dept.items.find((i) => i.slug === slug);
    if (item) return locale === 'ar' ? item.nameAr : item.nameEs;
  }
  for (const cat of SERVICE_CATEGORIES) {
    if (cat.slug === slug) return locale === 'ar' ? cat.nameAr : cat.nameEs;
  }
  return slug;
}

export function localizedDepartment(deptId: string, locale: Locale): { name: string; nameAr: string } {
  const dept = MARKETPLACE_DEPARTMENTS.find((d) => d.id === deptId);
  if (!dept) return { name: deptId, nameAr: deptId };
  return { name: locale === 'ar' ? dept.nameAr : dept.nameEs, nameAr: dept.nameAr };
}

export function localizedPayment(method: keyof typeof PAYMENT_LABELS, locale: Locale): string {
  const labels = PAYMENT_LABELS[method];
  if (!labels) return method;
  return locale === 'ar' ? labels.ar : labels.es;
}

/** Etiqueta de campo de atributos según locale */
export function localizedAttributeLabel(
  key: string,
  locale: Locale,
  fallbackEs: string,
  fallbackAr: string,
): string {
  const mapped = t(locale, `attributes.${key}` as 'attributes.brand');
  if (mapped !== `attributes.${key}`) return mapped;
  return locale === 'ar' ? fallbackAr : fallbackEs;
}

export function pickLocalized<T extends NamedItem>(item: T, locale: Locale): string {
  if (locale === 'ar') return item.nameAr;
  if (locale === 'en' && item.nameEn) return item.nameEn;
  return item.nameEs;
}

export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'es';
  const lang = navigator.language?.slice(0, 2).toLowerCase();
  if (lang === 'ar' || lang === 'es' || lang === 'fr' || lang === 'en') return lang;
  return 'es';
}
