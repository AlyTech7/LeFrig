import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { isPushSupported, registerForPushNotifications } from '@/lib/pushNotifications';
import { hasLegacySession } from '@/lib/legacySession';

/** Push real requiere EAS + FCM. Off por defecto en piloto (FCM mock). */
const PUSH_ENABLED = process.env.EXPO_PUBLIC_ENABLE_PUSH === '1';

export function PushRegister() {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!PUSH_ENABLED || !isLoaded || !isPushSupported()) return;
    let cancelled = false;
    hasLegacySession().then((legacy) => {
      if (cancelled || (!isSignedIn && !legacy)) return;
      registerForPushNotifications(() => getToken(), isSignedIn).catch(() => undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [getToken, isSignedIn, isLoaded]);

  return null;
}
