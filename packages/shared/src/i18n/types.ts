export const LOCALES = ['ar', 'es', 'fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export type LocaleMeta = {
  code: Locale;
  nativeName: string;
  label: string;
  dir: 'ltr' | 'rtl';
};

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  ar: { code: 'ar', nativeName: 'العربية', label: 'Arabic', dir: 'rtl' },
  es: { code: 'es', nativeName: 'Español', label: 'Spanish', dir: 'ltr' },
  fr: { code: 'fr', nativeName: 'Français', label: 'French', dir: 'ltr' },
  en: { code: 'en', nativeName: 'English', label: 'English', dir: 'ltr' },
};

export const LOCALE_STORAGE_KEY = 'lefrig_locale';
/** Marcado solo cuando el usuario elige idioma (onboarding o ajustes). */
export const LOCALE_CHOSEN_KEY = 'lefrig_locale_chosen';

export function isLocale(value: string | null | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function resolveLocale(value: string | null | undefined, fallback: Locale = 'es'): Locale {
  return isLocale(value) ? value : fallback;
}

export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return LOCALE_META[locale].dir;
}
