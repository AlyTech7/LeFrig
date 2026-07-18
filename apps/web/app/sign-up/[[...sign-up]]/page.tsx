'use client';

import { Suspense, useEffect, useRef } from 'react';
import { SignUp, useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { isClerkEnabled } from '@/lib/clerk';
import { safeInternalPath } from '@/lib/safe-redirect';

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

function SignUpForm() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded || isSignedIn) {
    return (
      <div className="sv-auth__card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
        <p style={{ margin: 0, opacity: 0.7 }}>Redirigiendo…</p>
      </div>
    );
  }

  return (
    <div className="sv-auth__card">
      <SignUp
        appearance={{
          elements: {
            rootBox: { width: '100%', maxWidth: 420 },
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/me"
      />
    </div>
  );
}

export default function SignUpPage() {
  if (!isClerkEnabled) {
    return (
      <div className="sv-auth">
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
    <div className="sv-auth">
      <Suspense fallback={<div className="sv-auth__card" style={{ textAlign: 'center', padding: '2rem' }}>Cargando…</div>}>
        <SignUpRedirect />
        <SignUpForm />
      </Suspense>
    </div>
  );
}
