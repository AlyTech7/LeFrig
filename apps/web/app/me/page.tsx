'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppIcon, type AppIconName } from '@/components/AppIcon';
import { PageBody, PageHero } from '@/components/PageHero';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';
import './me.css';

export type MeHub = {
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    badges: string[];
    reputationScore: number;
    camp: { id: string; slug: string; nameEs: string; nameAr: string; nameEn: string } | null;
    userBadges: { badge: string; awardedAt: string; reason: string | null }[];
  };
  driver: {
    id: string;
    vehicleType: string | null;
    vehiclePlate: string | null;
    seatsCapacity: number;
    isVerified: boolean;
    rating: number;
    totalTrips: number;
    status: 'none' | 'pending' | 'verified';
    frequentRoutes: {
      id: string;
      frequency: string;
      origin: { id: string; nameEs: string; slug: string };
      destination: { id: string; nameEs: string; slug: string };
    }[];
  } | null;
  driverStatus: 'none' | 'pending' | 'verified';
  stats: {
    listingsActive: number;
    ordersAsBuyer: number;
    shops: number;
    transportOpen: number;
    unreadNotifications: number;
  };
  recent: {
    orders: { id: string; status: string; totalAmount: number | string; shop?: { name: string } | null }[];
    listings: { id: string; title: string; status: string; price: number | string }[];
    trips: { id: string; status: string; label: string }[];
  };
};

type Module = {
  href: string;
  icon: AppIconName;
  titleKey: string;
  sub: string;
  accent?: boolean;
};

export default function MeHubPage() {
  const t = useT();
  const { locale } = useLocale();
  const { authFetch, isSignedIn, isLoaded } = useAuthFetch();
  const [hub, setHub] = useState<MeHub | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      setHub(null);
      setLoadError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    authFetch<MeHub>('/users/me/hub')
      .then((data) => {
        if (!cancelled) setHub(data);
      })
      .catch(() => {
        if (!cancelled) {
          setHub(null);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authFetch, isLoaded, isSignedIn]);

  const campName = hub?.user.camp
    ? locale === 'ar'
      ? hub.user.camp.nameAr
      : hub.user.camp.nameEs
    : null;

  const driverSub =
    hub?.driverStatus === 'verified'
      ? t('me.modules.driverSubVerified')
      : hub?.driverStatus === 'pending'
        ? t('me.modules.driverSubPending')
        : t('me.modules.driverSubNone');

  const modules: Module[] = hub
    ? [
        {
          href: '/orders',
          icon: 'package',
          titleKey: 'me.modules.orders',
          sub: `${t('me.modules.ordersSub')} · ${hub.stats.ordersAsBuyer}`,
        },
        {
          href: '/marketplace/mine',
          icon: 'shopping-bag',
          titleKey: 'me.modules.sales',
          sub: `${t('me.modules.salesSub')} · ${hub.stats.listingsActive}`,
        },
        {
          href: '/transport',
          icon: 'truck',
          titleKey: 'me.modules.transport',
          sub: `${t('me.modules.transportSub')} · ${hub.stats.transportOpen}`,
        },
        {
          href: '/me/driver',
          icon: 'shield',
          titleKey: 'me.modules.driver',
          sub: driverSub,
          accent: true,
        },
        {
          href: '/messages',
          icon: 'message-circle',
          titleKey: 'me.modules.messages',
          sub: t('me.modules.messagesSub'),
        },
        {
          href: '/notifications',
          icon: 'bell',
          titleKey: 'me.modules.notifications',
          sub:
            hub.stats.unreadNotifications > 0
              ? t('me.modules.notificationsSub', { count: hub.stats.unreadNotifications })
              : t('me.modules.notificationsNone'),
        },
        {
          href: '/favorites',
          icon: 'heart',
          titleKey: 'me.modules.favorites',
          sub: t('me.modules.favoritesSub'),
        },
        {
          href: '/cash',
          icon: 'dollar-sign',
          titleKey: 'me.modules.cash',
          sub: t('me.modules.cashSub'),
        },
        {
          href: '/shops/mine',
          icon: 'store',
          titleKey: 'me.modules.shops',
          sub: `${t('me.modules.shopsSub')} · ${hub.stats.shops}`,
        },
      ]
    : [];

  return (
    <>
      <PageHero icon="shield" title={t('me.title')} subtitle={t('me.subtitle')} maxWidth={880} />
      <PageBody maxWidth={880}>
        {!isLoaded || loading ? (
          <p className="me-muted">{t('me.loading')}</p>
        ) : !isSignedIn ? (
          <p className="me-muted">
            {t('me.signInPrompt')}{' '}
            <Link href="/sign-in?redirect_url=/me" className="me-btn me-btn--ghost">
              {t('nav.signIn')}
            </Link>
          </p>
        ) : loadError ? (
          <p className="me-muted">{t('me.loadError')}</p>
        ) : !hub ? (
          <p className="me-muted">{t('errors.apiUnavailable')}</p>
        ) : (
          <div className="me-hub">
            <header className="me-identity">
              <div className="me-identity__avatar" aria-hidden>
                {hub.user.avatarUrl ? (
                  <img src={hub.user.avatarUrl} alt="" />
                ) : (
                  <span>{hub.user.displayName?.[0]?.toUpperCase() ?? 'ⵣ'}</span>
                )}
              </div>
              <div className="me-identity__copy">
                <h2>{hub.user.displayName}</h2>
                <p>
                  {campName ? (
                    <>
                      {t('me.camp')}: <strong>{campName}</strong>
                      {' · '}
                    </>
                  ) : null}
                  {t('me.reputation', { score: Math.round(hub.user.reputationScore) })}
                </p>
                {(hub.user.badges.length > 0 || hub.user.userBadges.length > 0) && (
                  <div className="me-badges">
                    {[...new Set([...hub.user.badges, ...hub.user.userBadges.map((b) => b.badge)])].map((b) => (
                      <span key={b} className="me-badge">
                        {b.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Link href="/me/driver" className={`me-driver-chip me-driver-chip--${hub.driverStatus}`}>
                {t(`profile.driverStatus.${hub.driverStatus}`)}
              </Link>
            </header>

            <div className="me-grid">
              {modules.map((m) => (
                <Link key={m.href} href={m.href} className={`me-card ${m.accent ? 'me-card--accent' : ''}`}>
                  <span className="me-card__icon">
                    <AppIcon name={m.icon} size={22} color="var(--lx-gold, #a8842d)" />
                  </span>
                  <strong>{t(m.titleKey)}</strong>
                  <small>{m.sub}</small>
                </Link>
              ))}
            </div>

            <section className="me-recent">
              <h3>{t('me.recent.title')}</h3>
              {!hub.recent.orders.length && !hub.recent.listings.length && !hub.recent.trips.length ? (
                <p className="me-muted">{t('me.recent.empty')}</p>
              ) : (
                <div className="me-recent__cols">
                  {hub.recent.orders.length > 0 && (
                    <div>
                      <h4>{t('me.recent.orders')}</h4>
                      <ul>
                        {hub.recent.orders.map((o) => (
                          <li key={o.id}>
                            <Link href="/orders">{o.shop?.name ?? o.id.slice(0, 8)}</Link>
                            <span>{o.status}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {hub.recent.listings.length > 0 && (
                    <div>
                      <h4>{t('me.recent.listings')}</h4>
                      <ul>
                        {hub.recent.listings.map((l) => (
                          <li key={l.id}>
                            <Link href={`/marketplace/${l.id}`}>{l.title}</Link>
                            <span>{l.status}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {hub.recent.trips.length > 0 && (
                    <div>
                      <h4>{t('me.recent.trips')}</h4>
                      <ul>
                        {hub.recent.trips.map((tr) => (
                          <li key={tr.id}>
                            <Link href="/transport">{tr.label}</Link>
                            <span>{tr.status}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </PageBody>
    </>
  );
}
