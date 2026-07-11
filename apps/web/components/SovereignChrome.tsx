'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { CrownAuth } from '@/components/AuthButtons';
import { CrownSearch } from '@/components/home/CrownSearch';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { IconBell, LefrigBrand, LefrigMark } from '@/components/LefrigMark';
import { useT } from '@/lib/locale';
import { isClerkEnabled } from '@/lib/clerk';

function useNavItems() {
  const t = useT();
  return [
    { href: '/', label: t('nav.home'), match: (p: string) => p === '/', icon: 'mark' as const },
    {
      href: '/marketplace',
      label: t('nav.marketplace'),
      match: (p: string) => p.startsWith('/marketplace') && !p.includes('/create'),
      icon: '🛒',
    },
    {
      href: '/transport',
      label: t('nav.transport'),
      match: (p: string) => p.startsWith('/transport'),
      icon: '🚐',
    },
    {
      href: '/messages',
      label: t('nav.chat'),
      match: (p: string) => p.startsWith('/messages'),
      icon: '💬',
    },
  ];
}

function DockItems({ variant }: { variant: 'bottom' | 'rail' }) {
  const pathname = usePathname();
  const ITEMS = useNavItems();
  const t = useT();

  return (
    <>
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`sv-dock__item ${item.match(pathname) ? 'sv-dock__item--active' : ''}`}
          aria-current={item.match(pathname) ? 'page' : undefined}
        >
          <span>
            {item.icon === 'mark' ? (
              <LefrigMark size={variant === 'rail' ? 26 : 24} showOrbit={false} />
            ) : (
              item.icon
            )}
          </span>
          {variant === 'bottom' && <small>{item.label}</small>}
        </Link>
      ))}
      <Link href="/marketplace/create" className="sv-dock__sell" aria-label={t('nav.sell')}>
        <span className="sv-dock__sell-btn">+</span>
        {variant === 'bottom' && <small>{t('nav.sell')}</small>}
      </Link>
    </>
  );
}

export function WebDock() {
  return (
    <>
      <nav className="sv-dock sv-dock--bottom" aria-label="Navegación principal">
        <DockItems variant="bottom" />
      </nav>
      <nav className="sv-dock sv-dock--rail" aria-label="Navegación lateral">
        <Link href="/" className="sv-mark" style={{ marginBottom: '1.25rem', textDecoration: 'none', width: 40, height: 40 }} aria-label="Lefrig inicio">
          <LefrigMark size={36} showOrbit={false} />
        </Link>
        <DockItems variant="rail" />
      </nav>
    </>
  );
}

export function SovereignBackdrop() {
  return (
    <div className="sv-backdrop" aria-hidden>
      <div className="sv-backdrop__sky" />
      <div className="sv-backdrop__aurora" />
      <div className="sv-backdrop__horizon" />
      <div className="sv-backdrop__lattice" />
      <div className="sv-backdrop__grain" />
    </div>
  );
}

function IconMessage({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H9l-4 3v-11.5A1.5 1.5 0 0 1 5 6.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrownPublish() {
  const t = useT();
  const label = t('nav.publish');

  if (!isClerkEnabled) {
    return (
      <Link href="/marketplace/create" className="sv-crown__btn sv-crown__btn--gold sv-crown__btn--publish">
        <span className="sv-crown__btn-icon" aria-hidden>
          +
        </span>
        <span className="sv-crown__btn-label">{label}</span>
      </Link>
    );
  }

  return (
    <>
      <SignedOut>
        <Link href="/sign-up" className="sv-crown__btn sv-crown__btn--gold sv-crown__btn--publish">
          <span className="sv-crown__btn-icon" aria-hidden>
            +
          </span>
          <span className="sv-crown__btn-label">{label}</span>
        </Link>
      </SignedOut>
      <SignedIn>
        <Link href="/marketplace/create" className="sv-crown__btn sv-crown__btn--gold sv-crown__btn--publish">
          <span className="sv-crown__btn-icon" aria-hidden>
            +
          </span>
          <span className="sv-crown__btn-label">{label}</span>
        </Link>
      </SignedIn>
    </>
  );
}

export function SovereignHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const t = useT();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sv-crown ${scrolled ? 'sv-crown--scrolled' : ''}`}>
      <div className="sv-crown__gold-rim" aria-hidden />
      <div className="sv-crown__deck">
        <div className="sv-crown__brand-row">
          <Link
            href="/"
            className={`sv-crown__home ${pathname === '/' ? 'sv-crown__home--active' : ''}`}
            aria-label="Lefrig — Inicio"
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            <LefrigBrand variant="header" />
          </Link>
          <span className="sv-crown__live" title={t('common.live')}>
            <i className="sv-crown__live-dot" aria-hidden />
            <em>{t('common.live')}</em>
          </span>
        </div>

        <CrownSearch />

        <div className="sv-crown__actions">
          <LanguageSwitcher compact />
          <CrownPublish />
          <Link href="/messages" className="sv-crown__icon sv-crown__icon--msg" aria-label={t('nav.messages')}>
            <IconMessage size={17} />
          </Link>
          <Link href="/notifications" className="sv-crown__icon sv-crown__icon--bell" aria-label={t('nav.notifications')}>
            <IconBell size={17} />
            <i className="sv-crown__dot" aria-hidden />
          </Link>
          <CrownAuth />
        </div>
      </div>
    </header>
  );
}
