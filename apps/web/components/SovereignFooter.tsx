'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppIcon } from '@/components/AppIcon';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LefrigBrand } from '@/components/LefrigMark';
import { useT } from '@/lib/locale';

type FooterLink = { href: string; labelKey: string };

type FooterColumn = {
  id: string;
  titleKey: string;
  links: FooterLink[];
};

const EXPLORE: FooterLink[] = [
  { href: '/marketplace', labelKey: 'nav.marketplace' },
  { href: '/shops', labelKey: 'nav.shops' },
  { href: '/services', labelKey: 'nav.services' },
  { href: '/transport', labelKey: 'nav.transport' },
  { href: '/jobs', labelKey: 'nav.jobs' },
  { href: '/camps', labelKey: 'nav.camps' },
  { href: '/locations', labelKey: 'nav.map' },
];

const PUBLISH: FooterLink[] = [
  { href: '/marketplace/create', labelKey: 'marketplace.publishListing' },
  { href: '/shops/register', labelKey: 'shops.openShop' },
  { href: '/services/create', labelKey: 'services.offer' },
  { href: '/transport/register', labelKey: 'transport.register' },
  { href: '/jobs/create', labelKey: 'jobs.offer' },
];

const ACCOUNT: FooterLink[] = [
  { href: '/messages', labelKey: 'nav.messages' },
  { href: '/orders', labelKey: 'nav.orders' },
  { href: '/favorites', labelKey: 'nav.favorites' },
  { href: '/notifications', labelKey: 'nav.notifications' },
  { href: '/cash', labelKey: 'common.cash' },
  { href: '/disputes', labelKey: 'nav.disputes' },
];

const COMMUNITY: FooterLink[] = [
  { href: '/community', labelKey: 'nav.community' },
  { href: '/needs', labelKey: 'nav.needs' },
  { href: '/sign-in', labelKey: 'nav.signIn' },
  { href: '/sign-up', labelKey: 'nav.signUp' },
];

const COLUMNS: FooterColumn[] = [
  { id: 'explore', titleKey: 'footer.explore', links: EXPLORE },
  { id: 'publish', titleKey: 'footer.publish', links: PUBLISH },
  { id: 'account', titleKey: 'footer.account', links: ACCOUNT },
  { id: 'community', titleKey: 'footer.community', links: COMMUNITY },
];

const TRUST_PILLS = [
  { icon: 'dollar-sign' as const, labelKey: 'trust.cash' },
  { icon: 'shield' as const, labelKey: 'footer.trust' },
  { icon: 'wifi-off' as const, labelKey: 'footer.offlineFirst' },
];

const LEGAL: FooterLink[] = [
  { href: '/legal', labelKey: 'footer.legalCenter' },
  { href: '/legal#privacidad', labelKey: 'footer.privacy' },
  { href: '/legal#terminos', labelKey: 'footer.terms' },
  { href: '/legal#pagos', labelKey: 'footer.payments' },
  { href: '/legal#comunidad', labelKey: 'footer.legalCommunity' },
  { href: '/account-deletion', labelKey: 'footer.deleteAccount' },
  { href: 'mailto:hola@lefrig.com', labelKey: 'footer.contact' },
];

function useMinWidth(px: number) {
  const [match, setMatch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${px}px)`);
    const sync = () => setMatch(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [px]);

  return match;
}

function FooterColumnBlock({
  column,
  mobileOpen,
  t,
}: {
  column: FooterColumn;
  mobileOpen?: boolean;
  t: ReturnType<typeof useT>;
}) {
  const wide = useMinWidth(640);

  return (
    <details className="sv-foot-col sv-foot-col--collapsible" open={wide || mobileOpen}>
      <summary className="sv-foot-col__title">
        <span>{t(column.titleKey)}</span>
      </summary>
      <ul className="sv-foot-col__list">
        {column.links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="sv-foot-link">
              <span>{t(link.labelKey)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function SovereignFooter() {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="sv-footer" aria-labelledby="sv-footer-heading">
      <div className="sv-foot__glow" aria-hidden />

      <div className="sv-foot__inner">
        <section className="sv-foot-cta" aria-label={t('footer.ctaAria')}>
          <div className="sv-foot-cta__copy">
            <p className="sv-foot-cta__kicker">
              <span className="sv-live" aria-hidden />
              {t('footer.ctaKicker')}
            </p>
            <h2 id="sv-footer-heading" className="sv-foot-cta__title">
              {t('footer.ctaTitle')}
            </h2>
            <p className="sv-foot-cta__lead">{t('footer.ctaLead')}</p>
          </div>
          <div className="sv-foot-cta__actions">
            <Link href="/marketplace/create" className="sv-foot-btn sv-foot-btn--primary">
              <AppIcon name="megaphone" size={18} />
              {t('marketplace.publishListing')}
            </Link>
            <Link href="/shops/register" className="sv-foot-btn sv-foot-btn--ghost">
              <AppIcon name="store" size={18} />
              {t('shops.openShop')}
            </Link>
          </div>
        </section>

        <div className="sv-foot-grid">
          <div className="sv-foot-brand">
            <Link href="/" className="sv-foot-brand__logo" aria-label={t('common.homeAria')}>
              <LefrigBrand variant="footer" />
            </Link>
            <p className="sv-foot-brand__mission">{t('footer.mission')}</p>

            <ul className="sv-foot-trust" aria-label={t('footer.trustAria')}>
              {TRUST_PILLS.map((pill) => (
                <li key={pill.labelKey}>
                  <span className="sv-foot-trust__pill">
                    <AppIcon name={pill.icon} size={14} color="var(--sv-oasis)" />
                    <span>{t(pill.labelKey)}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="sv-foot-brand__stats" aria-label={t('footer.reachAria')}>
              <div>
                <strong>58+</strong>
                <span>{t('footer.statsWilayas')}</span>
              </div>
              <div>
                <strong>ES · FR</strong>
                <span>{t('footer.statsRoutes')}</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>{t('footer.statsChat')}</span>
              </div>
            </div>
          </div>

          {COLUMNS.map((col, index) => (
            <FooterColumnBlock key={col.id} column={col} mobileOpen={index === 0} t={t} />
          ))}
        </div>

        <div className="sv-foot-bar">
          <div className="sv-foot-bar__left">
            <p className="sv-foot-bar__copy">{t('footer.rightsDignity', { year })}</p>
            <nav className="sv-foot-legal" aria-label={t('footer.legalAria')}>
              {LEGAL.map((link) => (
                <Link key={link.href} href={link.href} className="sv-foot-legal__link">
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="sv-foot-bar__right">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
