'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PageBody, PageHero } from '@/components/PageHero';
import { API_URL } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useT } from '@/lib/locale';
import '../transport.css';
import '../../me/me.css';

type TripDetail = {
  id: string;
  status: string;
  scope?: string | null;
  type?: string;
  originLabel?: string;
  destinationLabel?: string;
  requesterName?: string;
  driverName?: string;
  contactPhone?: string | null;
  completionPin?: string;
  role?: 'requester' | 'driver' | 'other' | null;
  myConfirmed?: boolean;
  canConfirm?: boolean;
  canStart?: boolean;
  canCancel?: boolean;
  canClaim?: boolean;
  priceEstimate?: number | null;
};

const STEPS = ['requested', 'accepted', 'in_progress', 'completed'] as const;

function stepIndex(status: string): number {
  if (status === 'cancelled') return -1;
  const i = STEPS.indexOf(status as (typeof STEPS)[number]);
  return i >= 0 ? i : 0;
}

export default function TransportTripPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const t = useT();
  const router = useRouter();
  const { authFetch, getToken, isSignedIn, isLoaded } = useAuthFetch();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await authFetch<TripDetail>(`/transport/${id}`);
      setTrip(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errors.apiUnavailable'));
      setTrip(null);
    } finally {
      setLoading(false);
    }
  }, [authFetch, id, t]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/transport/${id}`);
      return;
    }
    void load();
  }, [isLoaded, isSignedIn, load, router, id]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMsg('');
    try {
      await fn();
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const downloadReceipt = async () => {
    setBusy(true);
    setMsg('');
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/transport/${id}/receipt/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lefrig-viaje-${id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg(t('transport.trip.downloadReceipt'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const active = trip ? stepIndex(trip.status) : 0;
  const statusHint =
    !trip
      ? ''
      : trip.status === 'cancelled'
        ? t('transport.trip.cancelled')
        : trip.status === 'completed'
          ? t('transport.trip.completed')
          : trip.status === 'in_progress'
            ? t('transport.trip.inProgress')
            : trip.status === 'accepted'
              ? t('transport.trip.waitingStart')
              : t('transport.trip.waitingDriver');

  return (
    <>
      <PageHero icon="truck" title={t('transport.trip.title')} subtitle={statusHint} maxWidth={720} />
      <PageBody maxWidth={720}>
        <Link href="/transport" className="me-btn me-btn--ghost" style={{ marginBottom: 16 }}>
          ← {t('nav.transport')}
        </Link>

        {!isLoaded || loading ? (
          <p className="me-muted">{t('common.loading')}</p>
        ) : error || !trip ? (
          <p className="me-muted">{error || t('errors.apiUnavailable')}</p>
        ) : (
          <div className="lx-trip-detail">
            <div className="lx-trip-detail__route">
              <strong>{trip.originLabel}</strong>
              <span>→</span>
              <strong>{trip.destinationLabel}</strong>
            </div>
            <p className="lx-trip-detail__meta">
              {trip.scope === 'international' ? t('transport.international') : t('transport.tabLocal')}
              {trip.requesterName ? ` · ${t('transport.trip.rolePassenger')}: ${trip.requesterName}` : ''}
              {trip.driverName ? ` · ${t('transport.trip.roleDriver')}: ${trip.driverName}` : ''}
              {trip.priceEstimate != null ? ` · ~${trip.priceEstimate}` : ''}
            </p>

            <div className="lx-timeline" aria-label={t('transport.trip.timeline')}>
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`lx-timeline__step${
                    i <= active && trip.status !== 'cancelled' ? ' lx-timeline__step--on' : ''
                  }`}
                >
                  <span className="lx-timeline__dot" />
                  <span className="lx-timeline__label">
                    {t(`transport.connect.status.${s}` as 'transport.connect.status.requested')}
                  </span>
                </div>
              ))}
            </div>

            {trip.role === 'driver' && trip.completionPin ? (
              <div className="lx-pin-box">
                <h3>{t('transport.trip.pinTitle')}</h3>
                <p className="lx-pin-box__code">{trip.completionPin}</p>
                <p className="me-muted">{t('transport.trip.pinHint')}</p>
                <button
                  type="button"
                  className="me-btn me-btn--ghost"
                  onClick={() => {
                    void navigator.clipboard.writeText(trip.completionPin!).then(() => {
                      setMsg(t('transport.trip.pinCopy'));
                    });
                  }}
                >
                  {t('transport.trip.pinCopy')}
                </button>
              </div>
            ) : null}

            {msg ? (
              <p className="me-muted" role="status">
                {msg}
              </p>
            ) : null}

            <div className="lx-trip-actions">
              {trip.canClaim ? (
                <button
                  type="button"
                  className="me-btn me-btn--primary"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await authFetch(`/transport/${id}/claim`, { method: 'PATCH' });
                    })
                  }
                >
                  {t('transport.trip.claimTrip')}
                </button>
              ) : null}
              {trip.canStart ? (
                <button
                  type="button"
                  className="me-btn me-btn--primary"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await authFetch(`/transport/${id}/start`, { method: 'PATCH' });
                    })
                  }
                >
                  {t('transport.trip.startTrip')}
                </button>
              ) : null}
              {trip.canConfirm ? (
                <div className="lx-confirm-row">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder={t('transport.trip.confirmPinPlaceholder')}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  />
                  <button
                    type="button"
                    className="me-btn me-btn--primary"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        if (!/^\d{4}$/.test(pin.trim())) {
                          throw new Error(t('transport.trip.confirmPinPlaceholder'));
                        }
                        await authFetch(`/transport/${id}/complete`, {
                          method: 'PATCH',
                          body: JSON.stringify({ pin: pin.trim() }),
                        });
                        setPin('');
                      })
                    }
                  >
                    {t('transport.trip.confirmPin')}
                  </button>
                </div>
              ) : null}
              {trip.status === 'completed' ? (
                <button
                  type="button"
                  className="me-btn me-btn--primary"
                  disabled={busy}
                  onClick={() => void downloadReceipt()}
                >
                  {t('transport.trip.downloadReceipt')}
                </button>
              ) : null}
              {trip.canCancel ? (
                <button
                  type="button"
                  className="me-btn me-btn--ghost"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await authFetch(`/transport/${id}/cancel`, { method: 'PATCH' });
                    })
                  }
                >
                  {t('transport.trip.cancelTrip')}
                </button>
              ) : null}
              {trip.contactPhone ? (
                <a
                  className="me-btn me-btn--ghost"
                  href={`https://wa.me/${trip.contactPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              ) : null}
              <Link href="/messages" className="me-btn me-btn--ghost">
                {t('transport.connect.message')}
              </Link>
            </div>
          </div>
        )}
      </PageBody>
    </>
  );
}
