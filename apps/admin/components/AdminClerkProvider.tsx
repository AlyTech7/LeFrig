'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { esES } from '@clerk/localizations';
import { CLERK_PUBLISHABLE_KEY, isClerkEnabled } from '@/lib/clerk';
import { adminRedirectUrl, readEnv } from '@/lib/site-url';

const clerkAppearance = {
  variables: {
    colorPrimary: '#0d9488',
    colorBackground: '#111827',
    colorText: '#f8faf9',
    colorInputBackground: '#1f2937',
    colorInputText: '#f8faf9',
    borderRadius: '12px',
  },
  elements: {
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #0d9488 0%, #34d399 100%)',
      fontWeight: '700',
    },
    card: {
      background: '#1f2937',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
    },
    headerTitle: { color: '#f8faf9', fontWeight: '800' },
    headerSubtitle: { color: 'rgba(248,250,249,0.65)' },
    rootBox: { width: '100%', maxWidth: 420 },
  },
};

export function AdminClerkProvider({ children }: { children: React.ReactNode }) {
  if (!isClerkEnabled || !CLERK_PUBLISHABLE_KEY) {
    return <>{children}</>;
  }
  return (
    <ClerkProvider
      localization={esES}
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={clerkAppearance}
      signInUrl={readEnv('NEXT_PUBLIC_CLERK_SIGN_IN_URL') ?? adminRedirectUrl('/sign-in')}
      afterSignInUrl={readEnv('NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL') ?? adminRedirectUrl('/')}
      afterSignOutUrl={adminRedirectUrl('/sign-in')}
    >
      {children}
    </ClerkProvider>
  );
}
