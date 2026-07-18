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
            baseTheme: undefined,
            variables: {
              colorBackground: '#faf8f4',
              colorText: '#1a1612',
              colorTextSecondary: 'rgba(26, 22, 18, 0.62)',
              colorNeutral: '#1a1612',
              colorInputText: '#1a1612',
              borderRadius: '14px',
            },
            elements: {
              avatarBox: { width: 34, height: 34 },
              userButtonPopoverCard: {
                background: '#faf8f4',
                border: '1px solid rgba(26, 22, 18, 0.12)',
                boxShadow: '0 16px 48px rgba(26, 22, 18, 0.14)',
              },
              userButtonPopoverMain: {
                background: '#faf8f4',
                color: '#1a1612',
              },
              userButtonPopoverActionButton: {
                color: '#1a1612',
              },
              userButtonPopoverActionButtonText: {
                color: '#1a1612',
              },
              userButtonPopoverActionButtonIcon: {
                color: 'rgba(26, 22, 18, 0.55)',
              },
              userButtonPopoverCustomItemButton: {
                color: '#1a1612',
              },
              userButtonPopoverFooter: {
                background: '#f3efe8',
                borderTop: '1px solid rgba(26, 22, 18, 0.08)',
              },
              userPreviewMainIdentifier: { color: '#1a1612' },
              userPreviewSecondaryIdentifier: { color: 'rgba(26, 22, 18, 0.62)' },
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
