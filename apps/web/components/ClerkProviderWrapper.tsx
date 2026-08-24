'use client';

import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { arSA, esES, frFR, enUS } from '@clerk/localizations';
import { useEffect } from 'react';
import { CLERK_PUBLISHABLE_KEY, isClerkEnabled } from '@/lib/clerk';
import { clerkRedirectUrl } from '@/lib/site-url';
import { SyncPreferredLanguage } from '@/components/SyncPreferredLanguage';
import { useLocale } from '@/lib/locale';
import type { Locale } from '@lefrig/shared';

const clerkAppearance = {
  variables: {
    colorPrimary: '#b48931',
    colorBackground: '#faf8f4',
    colorText: '#1a1612',
    colorTextSecondary: 'rgba(26, 22, 18, 0.64)',
    colorNeutral: '#1a1612',
    colorInputBackground: '#fffdf9',
    colorInputText: '#1a1612',
    colorAlphaShade: '#f3efe8',
    borderRadius: '16px',
  },
  elements: {
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #c7a34a 0%, #28c6b8 100%)',
      color: '#1a1612',
      fontWeight: '700',
      boxShadow: '0 14px 32px rgba(180, 137, 49, 0.24)',
    },
    card: {
      background: 'linear-gradient(180deg, #fffdf9 0%, #f7f1e7 100%)',
      border: '1px solid rgba(180, 137, 49, 0.18)',
      boxShadow: '0 24px 64px rgba(120, 95, 40, 0.14)',
    },
    headerTitle: { color: '#1a1612', fontWeight: '800' },
    headerSubtitle: { color: 'rgba(26, 22, 18, 0.64)' },
    formFieldLabel: { color: '#3a2f22', fontWeight: '700' },
    formFieldInput: {
      background: '#fffdf9',
      color: '#1a1612',
      border: '1px solid rgba(180, 137, 49, 0.22)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)',
    },
    formFieldInputShowPasswordButton: { color: 'rgba(26, 22, 18, 0.48)' },
    footerActionText: { color: 'rgba(26, 22, 18, 0.72)' },
    footerActionLink: { color: '#0c8f86', fontWeight: '700' },
    socialButtonsBlockButton: {
      border: '1px solid rgba(180, 137, 49, 0.18)',
      background: 'rgba(255,255,255,0.72)',
      color: '#1a1612',
      boxShadow: '0 10px 24px rgba(120, 95, 40, 0.08)',
    },
    socialButtonsBlockButtonText: { color: '#1a1612', fontWeight: '600' },
    dividerLine: { background: 'rgba(180, 137, 49, 0.18)' },
    dividerText: { color: 'rgba(26, 22, 18, 0.5)' },
    /* UserButton popover: contraste legible (el tema oscuro global lo dejaba ilegible) */
    userButtonPopoverCard: {
      background: '#faf8f4',
      color: '#1a1612',
      border: '1px solid rgba(26, 22, 18, 0.12)',
    },
    userButtonPopoverMain: {
      background: '#faf8f4',
      color: '#1a1612',
    },
    userButtonPopoverActionButton: { color: '#1a1612' },
    userButtonPopoverActionButtonText: { color: '#1a1612' },
    userButtonPopoverActionButtonIcon: { color: 'rgba(26, 22, 18, 0.55)' },
    userButtonPopoverCustomItemButton: { color: '#1a1612' },
    userPreviewMainIdentifier: { color: '#1a1612' },
    userPreviewSecondaryIdentifier: { color: 'rgba(26, 22, 18, 0.62)' },
  },
};

const CLERK_LOCALES: Partial<Record<Locale, typeof esES>> = {
  es: esES,
  fr: frFR,
  en: enUS,
  ar: arSA,
};

function ClerkSessionSync() {
  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/auth/sync`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        /* offline */
      }
    })();
  }, [isSignedIn, getToken]);

  return null;
}

function ClerkProviderInner({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  const localization = CLERK_LOCALES[locale] ?? esES;

  if (!isClerkEnabled) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      localization={localization}
      appearance={clerkAppearance}
      publishableKey={CLERK_PUBLISHABLE_KEY}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? clerkRedirectUrl('/sign-in')}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? clerkRedirectUrl('/sign-up')}
      afterSignInUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ?? clerkRedirectUrl('/marketplace')}
      afterSignUpUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL ?? clerkRedirectUrl('/marketplace')}
    >
      <ClerkSessionSync />
      <SyncPreferredLanguage />
      {children}
    </ClerkProvider>
  );
}

export function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  return <ClerkProviderInner>{children}</ClerkProviderInner>;
}
