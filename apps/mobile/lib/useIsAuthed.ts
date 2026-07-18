import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useState } from 'react';
import { getLegacyAccessToken, getLegacyUser } from '@/lib/legacySession';

/**
 * Auth dual: Clerk O sesión legacy (OTP/dev).
 * Usar esto en lugar de `isSignedIn` de Clerk solo.
 */
export function useIsAuthed() {
  const { isSignedIn, isLoaded: clerkLoaded } = useAuth();
  const [legacyAuthed, setLegacyAuthed] = useState(false);
  const [legacyLoaded, setLegacyLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const [token, user] = await Promise.all([getLegacyAccessToken(), getLegacyUser()]);
    setLegacyAuthed(Boolean(token || user));
    setLegacyLoaded(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, isSignedIn]);

  return {
    isAuthed: Boolean(isSignedIn) || legacyAuthed,
    isLoaded: clerkLoaded && legacyLoaded,
    isClerkSignedIn: Boolean(isSignedIn),
    legacyAuthed,
    refresh,
  };
}
