import { useAuth, useSSO } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { API_URL } from '@/lib/api';
import { getClerkErrorMessage } from '@/lib/clerk-errors';

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

function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

export function useSocialAuth() {
  useWarmUpBrowser();
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
        const redirectUrl = AuthSession.makeRedirectUri({
          scheme: 'lefrig',
          path: 'sso-callback',
        });

        const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
          strategy: provider.strategy,
          redirectUrl,
        });

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          const token = await getToken();
          if (token) await syncToApi(token);
          router.replace('/');
          return { ok: true };
        }

        // OAuth incompleto: faltan campos o el usuario cerró el navegador
        const status = signIn?.status || signUp?.status;
        if (!status || status === 'abandoned') {
          return { ok: false, error: 'Inicio de sesión cancelado.' };
        }

        return {
          ok: false,
          error: `No se pudo completar el acceso con ${provider.label}. Prueba email o revisa la config de Clerk.`,
        };
      } catch (err) {
        return {
          ok: false,
          error: getClerkErrorMessage(
            err,
            `No se pudo conectar con ${provider.label}. Prueba otro método.`,
          ),
        };
      } finally {
        setLoadingProvider(null);
      }
    },
    [startSSOFlow, getToken, router],
  );

  return { signInWith, loadingProvider };
}
