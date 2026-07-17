'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { isClerkEnabled } from '@/lib/clerk';
import { useT } from '@/lib/locale';

/** Botones compactos para la corona del header */
export function CrownAuth() {
  const t = useT();

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
        <Link href="/me" className="sv-crown__btn sv-crown__btn--ghost sv-crown__btn--me" aria-label={t('nav.myAccount')}>
          {t('nav.myAccount')}
        </Link>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: { width: 34, height: 34 },
            },
          }}
        >
          <UserButton.MenuItems>
            <UserButton.Link label={t('nav.myAccount')} labelIcon={<span aria-hidden>ⵣ</span>} href="/me" />
            <UserButton.Link
              label={t('me.driver.title')}
              labelIcon={<span aria-hidden>🚚</span>}
              href="/me/driver"
            />
          </UserButton.MenuItems>
        </UserButton>
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
