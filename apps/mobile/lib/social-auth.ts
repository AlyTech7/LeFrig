import { useAuth, useClerk, useSignIn, useSignUp, useSSO } from '@clerk/clerk-expo';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
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

/** App Store 4.8: si hay Google/Facebook, Apple debe estar visible en iOS. */
export function defaultAuthProviders(): SocialProviderId[] {
  if (Platform.OS === 'ios') return ['apple', 'google'];
  return ['google'];
}

/** Expo Go no registra el scheme `lefrig://`; OAuth social suele quedar “cancelado”. */
export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

function oauthRedirectUrl(): string {
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
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const { getToken } = useAuth();
  const { setActive } = useClerk();
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

  const finishWithSession = async (createdSessionId: string) => {
    await setActive({ session: createdSessionId });
    const token = await getToken();
    if (token) await syncToApi(token);
    router.replace('/');
  };

  const signInWithNativeApple = async (): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (Platform.OS !== 'ios') {
      return { ok: false, error: 'Sign in with Apple solo está disponible en iOS.' };
    }
    if (!signInLoaded || !signUpLoaded || !signIn || !signUp) {
      return { ok: false, error: 'Clerk aún está cargando. Espera un momento.' };
    }

    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) {
      return { ok: false, error: 'Sign in with Apple no está disponible en este dispositivo.' };
    }

    const rawNonce = Crypto.randomUUID().replace(/-/g, '');
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    let credential: AppleAuthentication.AppleAuthenticationCredential;
    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err && 'code' in err ? String((err as { code: string }).code) : '';
      if (code === 'ERR_REQUEST_CANCELED') {
        return { ok: false, error: 'Inicio de sesión con Apple cancelado.' };
      }
      throw err;
    }

    if (!credential.identityToken) {
      return {
        ok: false,
        error: 'Apple no devolvió un token. Revisa Sign in with Apple en Apple Developer y Clerk.',
      };
    }

    const appleToken = { strategy: 'oauth_token_apple' as const, token: credential.identityToken };

    const signedIn = await signIn.create(appleToken);
    if (signedIn.status === 'complete' && signedIn.createdSessionId) {
      await finishWithSession(signedIn.createdSessionId);
      return { ok: true };
    }

    // Usuario nuevo: transferir a sign-up
    if (signIn.firstFactorVerification?.status === 'transferable') {
      await signUp.create({ transfer: true });
      if (signUp.status === 'complete' && signUp.createdSessionId) {
        await finishWithSession(signUp.createdSessionId);
        return { ok: true };
      }
    }

    const signedUp = await signUp.create(appleToken);
    if (signedUp.status === 'complete' && signedUp.createdSessionId) {
      await finishWithSession(signedUp.createdSessionId);
      return { ok: true };
    }

    return {
      ok: false,
      error:
        'No se pudo completar Sign in with Apple. Activa Apple en Clerk Dashboard y en Apple Developer.',
    };
  };

  const signInWith = useCallback(
    async (provider: SocialProvider): Promise<{ ok: true } | { ok: false; error: string }> => {
      setLoadingProvider(provider.id);
      try {
        if (isExpoGo()) {
          return {
            ok: false,
            error:
              'El acceso social no funciona dentro de Expo Go. Entra con email, o usa un build instalable (EAS preview / production).',
          };
        }

        if (provider.id === 'apple' && Platform.OS === 'ios') {
          try {
            const native = await signInWithNativeApple();
            if (native.ok || native.error.includes('cancelado')) return native;
            console.warn('[social-auth] native Apple:', native.error);
          } catch (nativeErr) {
            console.warn('[social-auth] native Apple failed, trying SSO', nativeErr);
          }
        }

        const redirectUrl = oauthRedirectUrl();

        const { createdSessionId, setActive: setActiveSso, signIn: ssoSignIn, signUp: ssoSignUp } =
          await startSSOFlow({
            strategy: provider.strategy,
            redirectUrl,
          });

        if (createdSessionId && setActiveSso) {
          await setActiveSso({ session: createdSessionId });
          const token = await getToken();
          if (token) await syncToApi(token);
          router.replace('/');
          return { ok: true };
        }

        const status = ssoSignIn?.status || ssoSignUp?.status;
        if (!status || status === 'abandoned') {
          return {
            ok: false,
            error:
              'Inicio de sesión cancelado o el redirect no volvió a la app. En Clerk → Native applications añade: lefrig://sso-callback',
          };
        }

        return {
          ok: false,
          error: `No se pudo completar el acceso con ${provider.label}. Prueba email o revisa OAuth en Clerk.`,
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
    [startSSOFlow, getToken, router, signIn, signUp, setActive, signInLoaded, signUpLoaded],
  );

  return { signInWith, loadingProvider, isExpoGoClient: isExpoGo() };
}
