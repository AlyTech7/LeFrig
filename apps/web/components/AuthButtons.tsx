'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { isClerkEnabled } from '@/lib/clerk';

/** Botones compactos para la corona del header */
export function CrownAuth() {
  if (!isClerkEnabled) {
    return <FallbackCrownAuth />;
  }

  return (
    <>
      <SignedOut>
        <Link href="/sign-in" className="sv-crown__btn sv-crown__btn--ghost">
          Entrar
        </Link>
        <Link href="/sign-up" className="sv-crown__btn sv-crown__btn--gold">
          Unirse
        </Link>
      </SignedOut>
      <SignedIn>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: { width: 34, height: 34 },
            },
          }}
        />
      </SignedIn>
    </>
  );
}

function FallbackCrownAuth() {
  return (
    <>
      <Link href="/sign-in" className="sv-crown__btn sv-crown__btn--ghost">
        Entrar
      </Link>
      <Link href="/sign-up" className="sv-crown__btn sv-crown__btn--gold">
        Unirse
      </Link>
    </>
  );
}

/** @deprecated Usar CrownAuth en el header Sovereign */
export function ClerkAuthButtons() {
  return <CrownAuth />;
}

/** @deprecated Usar CrownAuth */
export function FallbackAuthButtons() {
  return <FallbackCrownAuth />;
}
