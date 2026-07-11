import type { Locale } from '@lefrig/shared';

/** Pick label from shared constants that expose labelEs / labelAr */
export function pickLabel(
  locale: Locale,
  item: { labelEs: string; labelAr: string },
): string {
  return locale === 'ar' ? item.labelAr : item.labelEs;
}

/** Pick name from shared items with nameEs / nameAr */
export function pickName(
  locale: Locale,
  item: { nameEs: string; nameAr: string; nameEn?: string },
): string {
  if (locale === 'ar') return item.nameAr;
  if (locale === 'en' && item.nameEn) return item.nameEn;
  return item.nameEs;
}

/** Legal document title for current locale */
export function legalDocTitle(
  doc: { title: string; titleAr?: string },
  locale: Locale,
): string {
  return locale === 'ar' && doc.titleAr ? doc.titleAr : doc.title;
}
