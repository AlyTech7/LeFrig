'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { CrownAuth } from '@/components/AuthButtons';
import { CrownSearch } from '@/components/home/CrownSearch';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Plus } from 'lucide-react';
import { AppIcon, type AppIconName } from '@/components/AppIcon';
import { IconBell, LefrigBrand, LefrigMark } from '@/components/LefrigMark';
import { useT } from '@/lib/locale';
import { isClerkEnabled } from '@/lib/clerk';
import { useAuthFetch } from '@/lib/auth-fetch';

type NavIcon = AppIconName;

type NavItem = {
  href: string;
  label: string;
  match: (p: string) => boolean;
  icon: NavIcon;
};

function useNavItems(): NavItem[] {
  const t = useT();
  return [
    { href: '/', label: t('nav.home'), match: (p) => p === '/', icon: 'home' },
    {
      href: '/marketplace',
      label: t('nav.marketplace'),
      match: (p) => p.startsWith('/marketplace') && !p.includes('/create'),
      icon: 'shopping-bag',
    },
    {
      href: '/transport',
      label: t('nav.transport'),
      match: (p) => p.startsWith('/transport'),
      icon: 'truck',
    },
    {
      href: '/messages',
      label: t('nav.chat'),
      match: (p) => p.startsWith('/messages'),
      icon: 'message-circle',
    },
  ];
}

function DockIcon({ icon, active, size }: { icon: NavIcon; active: boolean; size: number }) {
  return <AppIcon name={icon} size={size} strokeWidth={active ? 2.4 : 1.85} />;
}

function DockLink({
  item,
  pathname,
  showLabel,
  iconSize,
}: {
  item: NavItem;
  pathname: string;
  showLabel: boolean;
  iconSize: number;
}) {
  const active = item.match(pathname);

  return (
    <Link
      href={item.href}
      className={`sv-dock__item ${active ? 'sv-dock__item--active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      <span className="sv-dock__icon-wrap">
        <DockIcon icon={item.icon} active={active} size={iconSize} />
      </span>
      {showLabel ? <small>{item.label}</small> : null}
    </Link>
  );
}

function DockSell({ showLabel }: { showLabel: boolean }) {
  const t = useT();

  return (
    <Link href="/marketplace/create" className="sv-dock__sell" aria-label={t('nav.sell')}>
      <span className="sv-dock__sell-btn">
        <Plus size={22} strokeWidth={2.5} aria-hidden />
      </span>
      {showLabel ? <small>{t('nav.sell')}</small> : null}
    </Link>
  );
}

function DockItems({ variant }: { variant: 'bottom' | 'rail' }) {
  const pathname = usePathname();
  const items = useNavItems();
  const iconSize = variant === 'rail' ? 22 : 20;

  return (
    <>
      {items.map((item) => (
        <DockLink
          key={item.href}
          item={item}
          pathname={pathname}
          showLabel={variant === 'bottom'}
          iconSize={iconSize}
        />
      ))}
      <DockSell showLabel={variant === 'bottom'} />
    </>
  );
}

export function WebDock() {
  const pathname = usePathname();
  const items = useNavItems();

  return (
    <>
      <nav className="sv-dock sv-dock--bottom" aria-label="Navegación principal">
        <div className="sv-dock__surface" aria-hidden />
        <div className="sv-dock__inner">
          {items.slice(0, 2).map((item) => (
            <DockLink key={item.href} item={item} pathname={pathname} showLabel iconSize={20} />
          ))}
          <DockSell showLabel />
          {items.slice(2).map((item) => (
            <DockLink key={item.href} item={item} pathname={pathname} showLabel iconSize={20} />
          ))}
        </div>
      </nav>
      <nav className="sv-dock sv-dock--rail" aria-label="Navegación lateral">
        <Link
          href="/"
          className="sv-mark"
          style={{ marginBottom: '1.25rem', textDecoration: 'none', width: 40, height: 40 }}
          aria-label="Lefrig inicio"
        >
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
  const [unread, setUnread] = useState(0);
  const t = useT();
  const { authFetch, isSignedIn, isLoaded } = useAuthFetch();
  const onMarketplace =
    pathname.startsWith('/marketplace') && !pathname.includes('/create');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setUnread(0);
      return;
    }
    let cancelled = false;
    authFetch<unknown[]>('/notifications?unreadOnly=true')
      .then((rows) => {
        if (!cancelled) setUnread(Array.isArray(rows) ? rows.length : 0);
      })
      .catch(() => {
        if (!cancelled) setUnread(0);
      });
    return () => {
      cancelled = true;
    };
  }, [authFetch, isLoaded, isSignedIn, pathname]);

  return (
    <header
      className={`sv-crown ${scrolled ? 'sv-crown--scrolled' : ''} ${onMarketplace ? 'sv-crown--mkt' : ''}`}
    >
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

        <CrownSearch defaultScope={onMarketplace ? 'market' : 'all'} />

        <div className="sv-crown__actions">
          <LanguageSwitcher compact />
          <CrownPublish />
          <Link href="/messages" className="sv-crown__icon sv-crown__icon--msg" aria-label={t('nav.messages')}>
            <IconMessage size={17} />
          </Link>
          <Link href="/notifications" className="sv-crown__icon sv-crown__icon--bell" aria-label={t('nav.notifications')}>
            <IconBell size={17} />
            {unread > 0 ? <i className="sv-crown__dot" aria-hidden /> : null}
          </Link>
          <CrownAuth />
        </div>
      </div>
    </header>
  );
}
