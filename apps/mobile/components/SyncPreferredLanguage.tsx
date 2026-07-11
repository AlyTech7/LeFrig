import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isLocale, LOCALE_STORAGE_KEY, resolveLocale, type Locale } from '@lefrig/shared';
import { useAuthApi } from '@/lib/useAuthApi';
import { useLocale } from '@/lib/locale';

/** Sincroniza idioma local ↔ preferredLanguage en la API */
export function SyncPreferredLanguage() {
  const { locale, setLocale, ready } = useLocale();
  const { authFetch, syncUser, isSignedIn } = useAuthApi();
  const hydratedFromServer = useRef(false);
  const lastPushed = useRef<Locale | null>(null);

  useEffect(() => {
    if (!ready || !isSignedIn || hydratedFromServer.current) return;

    (async () => {
      try {
        const res = await syncUser();
        const pref = (res?.user as { preferredLanguage?: string } | undefined)?.preferredLanguage;
        const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
        if (!stored && pref && isLocale(pref)) {
          setLocale(resolveLocale(pref));
        }
      } catch {
        /* offline */
      } finally {
        hydratedFromServer.current = true;
      }
    })();
  }, [ready, isSignedIn, syncUser, setLocale]);

  useEffect(() => {
    if (!ready || !isSignedIn) return;
    if (lastPushed.current === locale) return;

    (async () => {
      try {
        await authFetch('/users/me', {
          method: 'PATCH',
          body: JSON.stringify({ preferredLanguage: locale }),
        });
        lastPushed.current = locale;
      } catch {
        /* offline */
      }
    })();
  }, [locale, ready, isSignedIn, authFetch]);

  return null;
}
