import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Alert, I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type Locale,
  LOCALE_STORAGE_KEY,
  resolveLocale,
  getDirection,
  t as translate,
  isLocale,
} from '@lefrig/shared';

type LocaleContextValue = {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Prefer expo-localization when available; otherwise null (caller uses arabic-first default). */
async function detectDeviceLocale(): Promise<Locale | null> {
  try {
    // Optional peer — do not hard-depend
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
  const rtl = getDirection(locale) === 'rtl';
  if (I18nManager.isRTL === rtl) return;

  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);

  try {
    // Optional — reload so layout direction takes effect
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Updates = require('expo-updates') as { reloadAsync?: () => Promise<void> };
    if (typeof Updates.reloadAsync === 'function') {
      await Updates.reloadAsync();
      return;
    }
  } catch {
    // expo-updates unavailable
  }

  Alert.alert(
    'Reinicio necesario',
    'Cambia la dirección de la interfaz. Reinicia la app para aplicar el cambio.',
  );
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ar');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
      const detected = stored ? null : await detectDeviceLocale();
      const resolved = resolveLocale(stored ?? detected ?? 'ar', 'ar');
      setLocaleState(resolved);
      await applyRtl(resolved);
      setReady(true);
    })();
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, next);
    await applyRtl(next);
  }, []);

  const tFn = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, dir: getDirection(locale), setLocale, t: tFn, ready }),
    [locale, setLocale, tFn, ready],
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
