/** Enlaces públicos de tiendas de aplicaciones Lefrig. */
export const ANDROID_PACKAGE_ID = 'com.lefrig.app' as const;

export const PLAY_STORE_URL =
  `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_ID}` as const;

/** Badge oficial Google Play por idioma de la UI. */
export const PLAY_STORE_BADGE_SRC: Record<'es' | 'en' | 'fr' | 'ar', string> = {
  es: 'https://play.google.com/intl/es_es/badges/static/images/badges/es_badge_web_generic.png',
  en: 'https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png',
  fr: 'https://play.google.com/intl/fr_fr/badges/static/images/badges/fr_badge_web_generic.png',
  ar: 'https://play.google.com/intl/ar_xa/badges/static/images/badges/ar_badge_web_generic.png',
};

/** App Store: aún no publicada. No enlazar como disponible. */
export const APP_STORE_STATUS = 'coming_soon' as const;
