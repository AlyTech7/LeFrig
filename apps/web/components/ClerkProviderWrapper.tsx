'use client';

import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { esES, frFR, enUS } from '@clerk/localizations';
import { useEffect } from 'react';
import { CLERK_PUBLISHABLE_KEY, isClerkEnabled } from '@/lib/clerk';
import { clerkRedirectUrl } from '@/lib/site-url';
import { SyncPreferredLanguage } from '@/components/SyncPreferredLanguage';
import { useLocale } from '@/lib/locale';
import type { Locale } from '@lefrig/shared';

const clerkAppearance = {
  variables: {
    colorPrimary: '#0d9488',
    colorBackground: '#0f1419',
    colorText: '#f8faf9',
    colorInputBackground: '#161d27',
    colorInputText: '#f8faf9',
    borderRadius: '16px',
  },
  elements: {
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #0d9488 0%, #34d399 100%)',
      fontWeight: '700',
    },
    card: {
      background: '#161d27',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
    },
    headerTitle: { color: '#f8faf9', fontWeight: '800' },
    headerSubtitle: { color: 'rgba(248,250,249,0.65)' },
    socialButtonsBlockButton: {
      border: '1px solid rgba(255,255,255,0.15)',
      background: 'rgba(255,255,255,0.05)',
    },
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
