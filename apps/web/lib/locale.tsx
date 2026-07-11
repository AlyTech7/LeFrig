'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  type Locale,
  LOCALE_STORAGE_KEY,
  resolveLocale,
  getDirection,
  t as translate,
  detectBrowserLocale,
} from '@lefrig/shared';

type LocaleContextValue = {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    setLocaleState(resolveLocale(stored ?? detectBrowserLocale(), 'es'));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const dir = getDirection(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.body.classList.toggle('lf-rtl', dir === 'rtl');
  }, [locale, ready]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
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
