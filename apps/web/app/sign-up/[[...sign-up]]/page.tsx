'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { EliteAuthForm } from '@/components/auth/EliteAuthForm';
import { isClerkEnabled } from '@/lib/clerk';
import { safeInternalPath } from '@/lib/safe-redirect';
import { useT } from '@/lib/locale';

function SignUpRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || didRedirect.current) return;
    const next = safeInternalPath(
      searchParams.get('redirect_url') ?? searchParams.get('redirect'),
      '/me',
    );
    const dest = next.startsWith('/sign-up') || next.startsWith('/sign-in') ? '/me' : next;
    didRedirect.current = true;
    window.location.replace(dest);
  }, [isLoaded, isSignedIn, searchParams]);

  return null;
}

function SignUpBody() {
  const { isLoaded, isSignedIn } = useAuth();
  const t = useT();

  if (!isLoaded || isSignedIn) {
    return <div className="sv-auth__loading">{t('common.loading')}</div>;
  }

  return <EliteAuthForm intent="signup" />;
}

export default function SignUpPage() {
  const t = useT();

  if (!isClerkEnabled) {
    return (
      <div className="sv-auth sv-auth--slim">
        <div className="sv-auth__notice">
          <h1>Configura Clerk</h1>
          <p>
            Añade <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> y <code>CLERK_SECRET_KEY</code> en tu
            archivo <code>.env</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sv-auth sv-auth--slim">
      <Suspense fallback={<div className="sv-auth__loading">{t('common.loading')}</div>}>
        <SignUpRedirect />
        <SignUpBody />
      </Suspense>
    </div>
  );
}
