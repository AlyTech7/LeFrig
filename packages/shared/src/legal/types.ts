export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; caption?: string; headers: string[]; rows: string[][] }
  | { type: 'note'; title?: string; text: string };

export type LegalDocument = {
  id: string;
  title: string;
  titleAr?: string;
  summary: string;
  blocks: LegalBlock[];
};

export type LocalizedLegalDocument = {
  id: string;
  title: string;
  summary: string;
  blocks: LegalBlock[];
};

export type ArabicLegalContent = {
  summary: string;
  blocks: LegalBlock[];
};
