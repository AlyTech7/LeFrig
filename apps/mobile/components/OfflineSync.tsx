import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { flushOfflineQueue, type OfflineAction } from '@/lib/offline';
import { useAuthApi } from '@/lib/useAuthApi';
import { getLegacyAccessToken } from '@/lib/legacySession';

export function OfflineSync() {
  const { isSignedIn, isLoaded } = useAuth();
  const { authFetch } = useAuthApi();
  const authFetchRef = useRef(authFetch);
  authFetchRef.current = authFetch;

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    async function sync() {
      const legacy = await getLegacyAccessToken();
      if (!isSignedIn && !legacy) return;

      const fetch = authFetchRef.current;

      const send = async (action: OfflineAction): Promise<boolean> => {
        if (action.type === 'create_listing') {
          const camps = await fetch<{ id: string }[]>('/camps').catch(() => []);
          const campId = camps[0]?.id;
          if (!campId) return false;

          const title = String(action.payload.title ?? 'Anuncio');
          const price = Number(action.payload.price) || 0;
          await fetch('/listings', {
            method: 'POST',
            body: JSON.stringify({
              title,
              description: String(action.payload.description ?? `${title}. Publicado desde la app móvil.`),
              price: price > 0 ? price : 100,
              currency: 'MRU',
              category: String(action.payload.category ?? 'other'),
              campId,
              paymentMethods: ['cash'],
            }),
          });
          return true;
        }
        return false;
      };

      if (!cancelled) await flushOfflineQueue(send).catch(() => undefined);
    }

    sync();
    const interval = setInterval(sync, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isLoaded, isSignedIn]);

  return null;
}
