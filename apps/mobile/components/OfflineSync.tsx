import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { flushOfflineQueue, type OfflineAction } from '@/lib/offline';
import { useAuthApi } from '@/lib/useAuthApi';
import { useIsAuthed } from '@/lib/useIsAuthed';

export function OfflineSync() {
  const { isAuthed, isLoaded } = useIsAuthed();
  const { authFetch } = useAuthApi();
  const authFetchRef = useRef(authFetch);
  authFetchRef.current = authFetch;
  const flushingRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    async function sync() {
      if (cancelled || !isAuthed || flushingRef.current) return;
      flushingRef.current = true;
      try {
        const fetch = authFetchRef.current;

        const send = async (action: OfflineAction): Promise<boolean> => {
          if (action.type === 'create_listing') {
            const p = action.payload;
            const title = String(p.title ?? 'Anuncio');
            const price = Number(p.price) || 0;
            const campId = typeof p.campId === 'string' ? p.campId : undefined;
            if (!campId) return false;

            await fetch('/listings', {
              method: 'POST',
              body: JSON.stringify({
                title,
                description: String(p.description ?? `${title}. Publicado desde la app móvil.`),
                price: price > 0 ? price : 100,
                currency: String(p.currency ?? 'DURU'),
                category: String(p.category ?? 'other'),
                campId,
                paymentMethods: Array.isArray(p.paymentMethods) ? p.paymentMethods : ['cash'],
                ...(Array.isArray(p.images) ? { images: p.images } : {}),
                ...(p.attributes && typeof p.attributes === 'object' ? { attributes: p.attributes } : {}),
              }),
            });
            return true;
          }
          return false;
        };

        if (!cancelled) await flushOfflineQueue(send).catch(() => undefined);
      } finally {
        flushingRef.current = false;
      }
    }

    sync();

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') void sync();
    };
    const sub = AppState.addEventListener('change', onAppState);
    const interval = setInterval(sync, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      sub.remove();
    };
  }, [isLoaded, isAuthed]);

  return null;
}
