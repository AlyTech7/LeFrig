import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Alert, I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type Locale,
  LOCALE_STORAGE_KEY,
  LOCALE_CHOSEN_KEY,
  resolveLocale,
  getDirection,
  t as translate,
  isLocale,
} from '@lefrig/shared';

type LocaleContextValue = {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  /** true cuando el usuario ya eligió idioma (onboarding o ajustes) */
  hasChosenLocale: boolean;
  /** Idioma detectado del dispositivo (sugerencia en onboarding) */
  suggestedLocale: Locale | null;
  setLocale: (locale: Locale) => Promise<void>;
  /** Persiste idioma + marca la elección como hecha */
  chooseLocale: (locale: Locale) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

async function detectDeviceLocale(): Promise<Locale | null> {
  try {
    const Localization = require('expo-localization') as {
      getLocales?: () => Array<{ languageCode?: string | null }>;
      locale?: string;
    };
    const code =
      Localization.getLocales?.()?.[0]?.languageCode?.slice(0, 2).toLowerCase() ??
      Localization.locale?.slice(0, 2).toLowerCase();
    return isLocale(code) ? code : null;
  } catch {
    return null;
  }
}

async function applyRtl(locale: Locale) {
  if (Platform.OS === 'web') return;

  const rtl = getDirection(locale) === 'rtl';
  if (I18nManager.isRTL === rtl) return;

  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);

  try {
    const Updates = require('expo-updates') as { reloadAsync?: () => Promise<void> };
    if (typeof Updates.reloadAsync === 'function') {
      await Updates.reloadAsync();
      return;
    }
  } catch {
    /* expo-updates unavailable */
  }

  Alert.alert(
    'Reinicio necesario',
    'Cambia la dirección de la interfaz. Reinicia la app para aplicar el cambio.',
  );
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ar');
  const [hasChosenLocale, setHasChosenLocale] = useState(false);
  const [suggestedLocale, setSuggestedLocale] = useState<Locale | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const [stored, chosenFlag, detected] = await Promise.all([
        AsyncStorage.getItem(LOCALE_STORAGE_KEY),
        AsyncStorage.getItem(LOCALE_CHOSEN_KEY),
        detectDeviceLocale(),
      ]);

      setSuggestedLocale(detected);

      const resolved = resolveLocale(stored ?? detected ?? 'ar', 'ar');
      setLocaleState(resolved);

      // Migración: si ya había idioma guardado, no forzar onboarding otra vez
      const chosen = chosenFlag === '1' || Boolean(stored);
      if (chosen && chosenFlag !== '1') {
        await AsyncStorage.setItem(LOCALE_CHOSEN_KEY, '1');
      }
      setHasChosenLocale(chosen);

      await applyRtl(resolved);
      setReady(true);
    })();
  }, []);

  const chooseLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    setHasChosenLocale(true);
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, next);
    await AsyncStorage.setItem(LOCALE_CHOSEN_KEY, '1');
    await applyRtl(next);
  }, []);

  const setLocale = useCallback(
    async (next: Locale) => {
      await chooseLocale(next);
    },
    [chooseLocale],
  );

  const tFn = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      dir: getDirection(locale),
      hasChosenLocale,
      suggestedLocale,
      setLocale,
      chooseLocale,
      t: tFn,
      ready,
    }),
    [locale, hasChosenLocale, suggestedLocale, setLocale, chooseLocale, tFn, ready],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

export function useT() {
  return useLocale().t;
}
