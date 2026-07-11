import type { Locale } from './types.js';
import type { Messages } from './messages/es.js';
import es from './messages/es.js';
import ar from './messages/ar.js';
import fr from './messages/fr.js';
import en from './messages/en.js';

export type MessageKey = string;

const bundles: Record<Locale, Messages> = { es, ar, fr, en };

function getNested(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as object)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export function t(
  locale: Locale,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  const raw = getNested(bundles[locale], key) ?? getNested(bundles.es, key);
  if (typeof raw !== 'string') return key;
  if (!params) return raw;
  return raw.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
    params[k] !== undefined ? String(params[k]) : '',
  );
}

export function getMessages(locale: Locale): Messages {
  return bundles[locale];
}

export { es, ar, fr, en };
