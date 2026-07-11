'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ClerkAuthButtons, FallbackAuthButtons } from '@/components/AuthButtons';
import { AppIcon } from '@/components/AppIcon';
import { isClerkEnabled } from '@/lib/clerk';
import { useT } from '@/lib/locale';

function useNavItems() {
  const t = useT();
  return [
    { href: '/marketplace', label: t('nav.marketplace') },
    { href: '/shops', label: t('nav.shops') },
    { href: '/services', label: t('nav.services') },
    { href: '/jobs', label: t('nav.jobs') },
    { href: '/transport', label: t('nav.transport') },
    { href: '/camps', label: t('nav.camps') },
    { href: '/locations', label: t('nav.map') },
    { href: '/needs', label: t('nav.needs') },
    { href: '/vouchers', label: t('nav.vouchers') },
    { href: '/community', label: t('nav.community') },
    { href: '/diaspora', label: t('nav.diaspora') },
  ];
}

export function WebHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const t = useT();
  const nav = useNavItems();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const syncHeight = () => {
      document.documentElement.style.setProperty('--lf-nav-h', `${el.offsetHeight}px`);
    };

    syncHeight();
    const ro = new ResizeObserver(syncHeight);
    ro.observe(el);
    window.addEventListener('resize', syncHeight);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncHeight);
      document.documentElement.style.removeProperty('--lf-nav-h');
    };
  }, []);

  return (
    <header ref={headerRef} className={`lf-nav ${scrolled ? 'lf-nav--scrolled' : ''}`}>
      <div className="lf-nav-inner">
        <div className="lf-nav-top">
          <Link href="/" className="lf-logo">
            <div className="lf-logo-mark">ⵣ</div>
            <span className="lf-logo-text">LEFRIG</span>
          </Link>
          <div className="lf-nav-actions">
            <Link href="/favorites" className="lf-nav-icon" aria-label={t('chrome.favoritesAria')}>
              <AppIcon name="heart" size={20} color="var(--lf-text-muted)" />
            </Link>
            <Link href="/notifications" className="lf-nav-icon" aria-label={t('chrome.notificationsAria')}>
              <AppIcon name="bell" size={20} color="var(--lf-text-muted)" />
            </Link>
            <Link href="/messages" className="lf-nav-icon" aria-label={t('chrome.messagesAria')}>
              <AppIcon name="message-circle" size={20} color="var(--lf-text-muted)" />
            </Link>
            {isClerkEnabled ? <ClerkAuthButtons /> : <FallbackAuthButtons />}
          </div>
        </div>
        <nav className="lf-nav-links" aria-label={t('chrome.sectionsAria')}>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="lf-nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function WebFooter() {
  const t = useT();

  return (
    <footer className="lf-footer">
      <div className="lf-footer-inner">
        <div>
          <div className="lf-footer-brand">{t('common.appName')}</div>
          <p style={{ margin: '8px 0 0', maxWidth: 320, lineHeight: 1.6 }}>
            {t('chrome.brandTagline')}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', flexWrap: 'wrap', marginBottom: 8 }}>
            <Link href="/cash" style={{ color: 'var(--lf-gold)', textDecoration: 'none', fontWeight: 600 }}>{t('nav.cash')}</Link>
            <Link href="/orders" style={{ color: 'var(--lf-gold)', textDecoration: 'none', fontWeight: 600 }}>{t('nav.orders')}</Link>
            <Link href="/disputes" style={{ color: 'var(--lf-gold)', textDecoration: 'none', fontWeight: 600 }}>{t('nav.disputes')}</Link>
            <Link href="/ledger" style={{ color: 'var(--lf-gold)', textDecoration: 'none', fontWeight: 600 }}>{t('nav.ledger')}</Link>
            <Link href="/messages" style={{ color: 'var(--lf-gold)', textDecoration: 'none', fontWeight: 600 }}>{t('nav.messages')}</Link>
          </div>
          <div>{t('chrome.trustLine')}</div>
          <div style={{ marginTop: 8, opacity: 0.6 }}>© 2026 {t('common.appName')}</div>
        </div>
      </div>
    </footer>
  );
}
