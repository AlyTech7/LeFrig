import { useAuth, useSSO } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { API_URL } from '@/lib/api';

export type SocialProviderId = 'google' | 'facebook' | 'apple';

export type SocialProvider = {
  id: SocialProviderId;
  strategy: 'oauth_google' | 'oauth_facebook' | 'oauth_apple';
  label: string;
};

export const SOCIAL_PROVIDERS: SocialProvider[] = [
  { id: 'google', strategy: 'oauth_google', label: 'Google' },
  { id: 'facebook', strategy: 'oauth_facebook', label: 'Facebook' },
  { id: 'apple', strategy: 'oauth_apple', label: 'Apple' },
];

export function useSocialAuth() {
  const { startSSOFlow } = useSSO();
  const { getToken } = useAuth();
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<SocialProviderId | null>(null);

  const syncToApi = async (token: string) => {
    try {
      await fetch(`${API_URL}/auth/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* offline */
    }
  };

  const signInWith = useCallback(
    async (provider: SocialProvider): Promise<{ ok: true } | { ok: false; error: string }> => {
      setLoadingProvider(provider.id);
      try {
        const { createdSessionId, setActive } = await startSSOFlow({ strategy: provider.strategy });
        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          const token = await getToken();
          if (token) await syncToApi(token);
          router.replace('/');
          return { ok: true };
        }
        return { ok: false, error: 'Inicio de sesión cancelado.' };
      } catch {
        return { ok: false, error: `No se pudo conectar con ${provider.label}. Prueba otro método.` };
      } finally {
        setLoadingProvider(null);
      }
    },
    [startSSOFlow, getToken, router],
  );

  return { signInWith, loadingProvider };
}
