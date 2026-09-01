import type { Locale } from '../i18n/types.js';
import { LEGAL_DOCUMENTS, LEGAL_META, LEGAL_QUICK_LINKS } from './documents-es.js';
import { ARABIC_LEGAL_BY_ID } from './documents-ar.js';
import type { LegalDocument, LocalizedLegalDocument } from './types.js';

export type { LegalBlock, LegalDocument, LocalizedLegalDocument } from './types.js';
export { LEGAL_DOCUMENTS, LEGAL_META, LEGAL_QUICK_LINKS };

export function localizeLegalDocument(
  doc: LegalDocument,
  locale: Locale,
): LocalizedLegalDocument {
  if (locale === 'ar') {
    const ar = ARABIC_LEGAL_BY_ID[doc.id];
    if (ar) {
      return {
        id: doc.id,
        title: doc.titleAr ?? doc.title,
        summary: ar.summary,
        blocks: ar.blocks,
      };
    }
  }

  return {
    id: doc.id,
    title: doc.title,
    summary: doc.summary,
    blocks: doc.blocks,
  };
}

export function getLocalizedLegalDocuments(locale: Locale): LocalizedLegalDocument[] {
  return LEGAL_DOCUMENTS.map((doc) => localizeLegalDocument(doc, locale));
}

export function getLocalizedLegalQuickLinks(locale: Locale) {
  return LEGAL_DOCUMENTS.map((doc) => ({
    id: doc.id,
    title: localizeLegalDocument(doc, locale).title,
    href: `#${doc.id}`,
  }));
}

export function localizeLegalMeta(locale: Locale) {
  const isAr = locale === 'ar';
  return {
    ...LEGAL_META,
    lastUpdated: isAr ? LEGAL_META.lastUpdatedAr : LEGAL_META.lastUpdated,
    platformTagline: isAr ? LEGAL_META.platformTaglineAr : LEGAL_META.platformTagline,
  };
}

export function findLegalDocument(id: string): LegalDocument | undefined {
  return LEGAL_DOCUMENTS.find((doc) => doc.id === id);
}

export function findLocalizedLegalDocument(
  id: string,
  locale: Locale,
): LocalizedLegalDocument | undefined {
  const doc = findLegalDocument(id);
  return doc ? localizeLegalDocument(doc, locale) : undefined;
}
