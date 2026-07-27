'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
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
  requesterName?: string | null;
  type?: string;
};

type PaginatedTrips = { data: OpenTrip[] };

type DriverStatus = MeHub['driverStatus'];

function statusTitleKey(status: DriverStatus) {
  if (status === 'verified') return 'me.driver.statusVerified';
  if (status === 'pending') return 'me.driver.statusPending';
  if (status === 'basic') return 'me.driver.statusBasic';
  if (status === 'rejected') return 'me.driver.statusRejected';
  return 'me.driver.statusNone';
}

function statusBodyKey(status: DriverStatus) {
  if (status === 'verified') return 'me.driver.statusVerifiedBody';
  if (status === 'pending') return 'me.driver.statusPendingBody';
  if (status === 'basic') return 'me.driver.statusBasicBody';
  if (status === 'rejected') return 'me.driver.statusRejectedBody';
  return 'me.driver.statusNoneBody';
}

export default function MeDriverPage() {
  const t = useT();
  const { authFetch, isSignedIn, isLoaded } = useAuthFetch();
  const [hub, setHub] = useState<MeHub | null>(null);
  const [trips, setTrips] = useState<OpenTrip[]>([]);
  const [openBoard, setOpenBoard] = useState<OpenTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimMsg, setClaimMsg] = useState('');

  const load = useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      setHub(null);
      return;
    }
    setLoading(true);
    setLoadError(false);
    try {
      const [h, rawMine, rawOpen] = await Promise.all([
        authFetch<MeHub>('/users/me/hub'),
        authFetch<OpenTrip[] | PaginatedTrips>('/transport/my').catch(() => [] as OpenTrip[]),
        authFetch<PaginatedTrips>('/transport?status=requested&limit=20').catch(() => ({ data: [] as OpenTrip[] })),
      ]);
      setHub(h);
      setTrips(Array.isArray(rawMine) ? rawMine : rawMine.data ?? []);
      setOpenBoard(Array.isArray(rawOpen) ? rawOpen : rawOpen.data ?? []);
    } catch {
      setHub(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [authFetch, isLoaded, isSignedIn]);

  useEffect(() => {
    void load();
  }, [load]);

  const claimTrip = async (tripId: string) => {
    setClaimingId(tripId);
    setClaimMsg('');
    try {
      await authFetch(`/transport/${tripId}/claim`, { method: 'PATCH' });
      setClaimMsg(t('me.driver.claimSuccess'));
      await load();
    } catch (e) {
      setClaimMsg(e instanceof Error ? e.message : t('me.driver.claimError'));
    } finally {
      setClaimingId(null);
    }
  };

  const status: DriverStatus = hub?.driverStatus ?? 'none';
  const driver = hub?.driver;
  const canClaim = status === 'verified' || status === 'basic' || status === 'pending';
  const claimable = canClaim ? openBoard.filter((tr) => tr.status === 'requested' || tr.status === 'open') : [];

  const coverageLabel = (() => {
    if (!driver?.coverageMode) return null;
    if (driver.coverageMode === 'zone') {
      const zones = (driver.coverageZones ?? []).map((z) => t(`transport.zones.${z}`)).join(', ');
      return `${driver.coverageOriginHubSlug ?? '—'} → ${zones || '—'}`;
    }
    if (driver.coverageMode === 'flexible') {
      return driver.coverageScope === 'international'
        ? t('transport.driver.scopeInternational')
        : t('transport.driver.scopeLocal');
    }
    return t('transport.driver.modeCorridors');
  })();

  return (
    <>
      <PageHero icon="truck" title={t('me.driver.title')} subtitle={t('me.driver.subtitle')} maxWidth={720} />
      <PageBody maxWidth={720}>
        <Link href="/me" className="me-btn me-btn--ghost" style={{ marginBottom: 16 }}>
          {t('me.driver.backToHub')}
        </Link>

        {!isLoaded || loading ? (
          <p className="me-muted">{t('me.driver.loading')}</p>
        ) : !isSignedIn ? (
          <p className="me-muted">
            {t('me.signInPrompt')}{' '}
            <Link href="/sign-in?redirect_url=/me/driver" className="me-btn me-btn--ghost">
              {t('nav.signIn')}
            </Link>
          </p>
        ) : loadError ? (
          <p className="me-muted">{t('errors.apiUnavailable')}</p>
        ) : (
          <>
            <div className={`me-driver-banner me-driver-banner--${status === 'none' ? '' : status}`.trim()}>
              <h2>{t(statusTitleKey(status))}</h2>
              <p>{t(statusBodyKey(status))}</p>
              {status === 'rejected' && driver?.rejectionReason ? (
                <p className="me-driver-banner__reason">
                  {t('me.driver.rejectionReason')}: {driver.rejectionReason}
                </p>
              ) : null}
            </div>

            {driver ? (
              <div className="me-driver-panel">
                <h3>{t('me.driver.vehicle')}</h3>
                <dl className="me-driver-facts">
                  <div>
                    <dt>{t('me.driver.vehicle')}</dt>
                    <dd>
                      {driver.vehicleType
                        ? t(`transport.driver.vehicleTypes.${driver.vehicleType}`)
                        : '—'}
                    </dd>
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
                    <dt>{t('me.driver.phone')}</dt>
                    <dd>{driver.contactPhone ?? '—'}</dd>
                  </div>
                  {coverageLabel ? (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <dt>{t('me.driver.coverage')}</dt>
                      <dd>{coverageLabel}</dd>
                    </div>
                  ) : null}
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

            {canClaim ? (
              <div className="me-driver-panel">
                <h3>{t('me.driver.openBoard')}</h3>
                {claimMsg ? <p className="me-muted">{claimMsg}</p> : null}
                {claimable.length === 0 ? (
                  <p className="me-muted">{t('me.driver.noOpenTrips')}</p>
                ) : (
                  <ul className="me-route-list">
                    {claimable.map((tr) => (
                      <li key={tr.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        <span style={{ flex: 1 }}>
                          {(tr.originLabel ?? tr.originHubSlug) ?? '?'} →{' '}
                          {(tr.destinationLabel ?? tr.destinationHubSlug) ?? '?'}
                          {tr.requesterName ? (
                            <span style={{ opacity: 0.55, fontWeight: 500 }}> · {tr.requesterName}</span>
                          ) : null}
                        </span>
                        <Link href={`/transport/${tr.id}`} className="me-btn me-btn--ghost">
                          {t('transport.connect.openTrip')}
                        </Link>
                        <button
                          type="button"
                          className="me-btn me-btn--primary"
                          disabled={claimingId === tr.id}
                          onClick={() => void claimTrip(tr.id)}
                        >
                          {claimingId === tr.id ? t('me.driver.claiming') : t('me.driver.claimCta')}
                        </button>
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
                  {trips
                    .filter((tr) => tr.status !== 'completed' && tr.status !== 'cancelled')
                    .slice(0, 8)
                    .map((tr) => (
                      <li key={tr.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        <span style={{ flex: 1 }}>
                          {(tr.originLabel ?? tr.originHubSlug) ?? '?'} →{' '}
                          {(tr.destinationLabel ?? tr.destinationHubSlug) ?? '?'}
                          <span style={{ opacity: 0.55, fontWeight: 500 }}> · {tr.status}</span>
                        </span>
                        <Link href={`/transport/${tr.id}`} className="me-btn me-btn--primary">
                          {t('transport.connect.openTrip')}
                        </Link>
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
                  {status === 'basic' || status === 'rejected'
                    ? t('me.driver.verifyCta')
                    : t('me.driver.editProfile')}
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
