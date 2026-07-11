'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';
import { isLocale, LOCALE_STORAGE_KEY, resolveLocale, type Locale } from '@lefrig/shared';
import { API_URL } from '@/lib/api';
import { isClerkEnabled } from '@/lib/clerk';
import { useLocale } from '@/lib/locale';

/** Sincroniza idioma local ↔ preferredLanguage en la API */
export function SyncPreferredLanguage() {
  const { locale, setLocale, ready } = useLocale();
  const { isSignedIn, getToken } = useAuth();
  const hydratedFromServer = useRef(false);
  const lastPushed = useRef<Locale | null>(null);

  useEffect(() => {
    if (!ready || !isClerkEnabled || !isSignedIn || hydratedFromServer.current) return;

    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${API_URL}/auth/sync`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { user?: { preferredLanguage?: string } };
        const pref = data.user?.preferredLanguage;
        const hasLocal = typeof localStorage !== 'undefined' && localStorage.getItem(LOCALE_STORAGE_KEY);
        if (!hasLocal && pref && isLocale(pref)) {
          setLocale(resolveLocale(pref));
        }
      } catch {
        /* offline */
      } finally {
        hydratedFromServer.current = true;
      }
    })();
  }, [ready, isSignedIn, getToken, setLocale]);

  useEffect(() => {
    if (!ready || !isClerkEnabled || !isSignedIn) return;
    if (lastPushed.current === locale) return;

    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        await fetch(`${API_URL}/users/me`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ preferredLanguage: locale }),
        });
        lastPushed.current = locale;
      } catch {
        /* offline */
      }
    })();
  }, [locale, ready, isSignedIn, getToken]);

  return null;
}
