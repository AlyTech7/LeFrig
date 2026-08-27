import { useAuth, useSSO } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
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

/** Expo Go no registra el scheme `lefrig://`; OAuth social suele quedar “cancelado”. */
export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

function oauthRedirectUrl(): string {
  // En builds nativos → lefrig://sso-callback
  // En Expo Go → exp://IP:puerto/--/sso-callback (limitado; preferir development build)
  // En web → http(s)://host/sso-callback
  return AuthSession.makeRedirectUri({
    scheme: 'lefrig',
    path: 'sso-callback',
  });
}

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
        if (isExpoGo()) {
          return {
            ok: false,
            error:
              'Google no funciona dentro de Expo Go. Entra con email, o usa un build instalable (EAS preview / development).',
          };
        }

        const redirectUrl = oauthRedirectUrl();

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

        const status = signIn?.status || signUp?.status;
        if (!status || status === 'abandoned') {
          return {
            ok: false,
            error:
              'Inicio de sesión cancelado o el redirect no volvió a la app. En Clerk → Native applications añade: lefrig://sso-callback',
          };
        }

        return {
          ok: false,
          error: `No se pudo completar el acceso con ${provider.label}. Prueba email o revisa Google OAuth en Clerk.`,
        };
      } catch (err) {
        return {
          ok: false,
          error: getClerkErrorMessage(
            err,
            `No se pudo conectar con ${provider.label}. Prueba email o otro método.`,
          ),
        };
      } finally {
        setLoadingProvider(null);
      }
    },
    [startSSOFlow, getToken, router],
  );

  return { signInWith, loadingProvider, isExpoGoClient: isExpoGo() };
}
