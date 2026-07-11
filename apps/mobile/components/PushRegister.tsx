import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { isPushSupported, registerForPushNotifications } from '@/lib/pushNotifications';
import { hasLegacySession } from '@/lib/legacySession';

export function PushRegister() {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isPushSupported()) return;
    hasLegacySession().then((legacy) => {
      if (!isSignedIn && !legacy) return;
      registerForPushNotifications(() => getToken(), isSignedIn).catch(() => undefined);
    });
  }, [getToken, isSignedIn, isLoaded]);

  return null;
}
