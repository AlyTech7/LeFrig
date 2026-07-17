'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageBody, PageHero } from '@/components/PageHero';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useT } from '@/lib/locale';
import type { MeHub } from '../page';
import '../me.css';

type OpenTrip = {
  id: string;
  status: string;
  originLabel?: string | null;
  destinationLabel?: string | null;
  originHubSlug?: string | null;
  destinationHubSlug?: string | null;
};

export default function MeDriverPage() {
  const t = useT();
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthFetch();
  const [hub, setHub] = useState<MeHub | null>(null);
  const [trips, setTrips] = useState<OpenTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=/me/driver');
      return;
    }
    Promise.all([
      authFetch<MeHub>('/users/me/hub'),
      authFetch<OpenTrip[] | { data: OpenTrip[] }>('/transport/my').catch(() => [] as OpenTrip[]),
    ])
      .then(([h, raw]) => {
        setHub(h);
        setTrips(Array.isArray(raw) ? raw : raw.data ?? []);
      })
      .catch(() => setHub(null))
      .finally(() => setLoading(false));
  }, [authFetch, isSignedIn, router]);

  const status = hub?.driverStatus ?? 'none';
  const driver = hub?.driver;

  return (
    <>
      <PageHero icon="truck" title={t('me.driver.title')} subtitle={t('me.driver.subtitle')} maxWidth={720} />
      <PageBody maxWidth={720}>
        <Link href="/me" className="me-btn me-btn--ghost" style={{ marginBottom: 16 }}>
          {t('me.driver.backToHub')}
        </Link>

        {loading ? (
          <p className="me-muted">{t('me.driver.loading')}</p>
        ) : (
          <>
            <div className={`me-driver-banner me-driver-banner--${status === 'none' ? '' : status}`.trim()}>
              <h2>
                {status === 'verified'
                  ? t('me.driver.statusVerified')
                  : status === 'pending'
                    ? t('me.driver.statusPending')
                    : t('me.driver.statusNone')}
              </h2>
              <p>
                {status === 'verified'
                  ? t('me.driver.statusVerifiedBody')
                  : status === 'pending'
                    ? t('me.driver.statusPendingBody')
                    : t('me.driver.statusNoneBody')}
              </p>
            </div>

            {driver ? (
              <div className="me-driver-panel">
                <h3>{t('me.driver.vehicle')}</h3>
                <dl className="me-driver-facts">
                  <div>
                    <dt>{t('me.driver.vehicle')}</dt>
                    <dd>{driver.vehicleType ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>{t('me.driver.plate')}</dt>
                    <dd>{driver.vehiclePlate ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>{t('me.driver.seats')}</dt>
                    <dd>{driver.seatsCapacity}</dd>
                  </div>
                  <div>
                    <dt>{t('me.driver.rating')}</dt>
                    <dd>{driver.rating?.toFixed?.(1) ?? driver.rating}</dd>
                  </div>
                  <div>
                    <dt>{t('me.driver.trips')}</dt>
                    <dd>{driver.totalTrips}</dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {driver ? (
              <div className="me-driver-panel">
                <h3>{t('me.driver.routes')}</h3>
                {driver.frequentRoutes.length === 0 ? (
                  <p className="me-muted">{t('me.driver.noRoutes')}</p>
                ) : (
                  <ul className="me-route-list">
                    {driver.frequentRoutes.map((r) => (
                      <li key={r.id}>
                        {r.origin.nameEs} → {r.destination.nameEs}
                        <span style={{ opacity: 0.55, fontWeight: 500 }}> · {r.frequency}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {trips.length > 0 ? (
              <div className="me-driver-panel">
                <h3>{t('me.driver.myTrips')}</h3>
                <ul className="me-route-list">
                  {trips.slice(0, 8).map((tr) => (
                    <li key={tr.id}>
                      {(tr.originLabel ?? tr.originHubSlug) ?? '?'} →{' '}
                      {(tr.destinationLabel ?? tr.destinationHubSlug) ?? '?'}
                      <span style={{ opacity: 0.55, fontWeight: 500 }}> · {tr.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="me-driver-actions">
              {status === 'none' ? (
                <Link href="/transport/register" className="me-btn me-btn--primary">
                  {t('me.driver.registerCta')}
                </Link>
              ) : (
                <Link href="/transport/register" className="me-btn me-btn--primary">
                  {t('me.driver.editProfile')}
                </Link>
              )}
              <Link href="/transport" className="me-btn me-btn--ghost">
                {t('me.driver.openTransport')}
              </Link>
            </div>
          </>
        )}
      </PageBody>
    </>
  );
}
