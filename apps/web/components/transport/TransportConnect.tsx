'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  TRANSPORT_HUBS,
  TRANSPORT_HUB_ZONES,
  assertRouteMatchesScope,
  corridorsForScope,
  getTransportHub,
  hubScope,
  hubsInScope,
  hubsInZone,
  zonesForScope,
  pickLocalized,
  type TransportHub,
  type TransportHubZone,
  type TransportRouteScope,
} from '@lefrig/shared';
import type { PaginatedResponse, TransportRequestSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { fetchApi, mapApiTransport, unwrapPaginated } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';
import {
  DEFAULT_TRANSPORT_PHONE_DIAL,
  TRANSPORT_PHONE_LOCAL_DIGITS,
  TRANSPORT_PHONE_PREFIXES,
  buildTransportContactPhone,
  sanitizeTransportLocalPhone,
  type TransportPhoneDial,
} from './transport-phone';

type DriverRow = {
  id: string;
  vehicleType: string | null;
  seatsCapacity: number;
  rating: number;
  preferredHubSlugs?: string[];
  user: { displayName: string; phone: string | null };
  frequentRoutes: { originCamp: { nameEs: string }; destinationCamp: { nameEs: string } }[];
};

type Field = 'origin' | 'dest' | null;

const TRIP_MODE_IDS = ['shared_ride', 'person', 'package'] as const;

const LOCAL_DEFAULT = {
  origin: 'rabouni',
  dest: 'tindouf',
  originZone: 'wilaya' as TransportHubZone,
  destZone: 'tindouf' as TransportHubZone,
};
const INTL_DEFAULT = {
  origin: 'madrid',
  dest: 'rabouni',
  originZone: 'espana' as TransportHubZone,
  destZone: 'wilaya' as TransportHubZone,
};

function HubField({
  label,
  sub,
  hub,
  active,
  onFocus,
  query,
  onQuery,
  zone,
  onZone,
  onPick,
  onClose,
  scope,
  locale,
  t,
}: {
  label: string;
  sub: string;
  hub: string;
  active: boolean;
  onFocus: () => void;
  query: string;
  onQuery: (q: string) => void;
  zone: TransportHubZone;
  onZone: (z: TransportHubZone) => void;
  onPick: (slug: string) => void;
  onClose: () => void;
  scope: TransportRouteScope;
  locale: ReturnType<typeof useLocale>['locale'];
  t: ReturnType<typeof useT>;
}) {
  // Local: solo wilaya+tindouf. Internacional: todas las zonas (un extremo puede ser local).
  const scopeZones = useMemo(
    () => (scope === 'local' ? zonesForScope('local') : TRANSPORT_HUB_ZONES),
    [scope],
  );
  const scopeHubs = useMemo(
    () => (scope === 'local' ? hubsInScope('local') : TRANSPORT_HUBS),
    [scope],
  );
  const h = TRANSPORT_HUBS.find((x) => x.slug === hub);
  const list = useMemo(() => {
    const base = hubsInZone(zone).filter((x) => scopeHubs.some((s) => s.slug === x.slug));
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return scopeHubs
      .filter(
        (x) => x.nameEs.toLowerCase().includes(q) || x.nameAr.includes(q) || x.slug.includes(q),
      )
      .slice(0, 24);
  }, [zone, query, scopeHubs]);

  const hubName = (item: TransportHub) => pickLocalized(item, locale);

  return (
    <div className={`lx-field ${active ? 'lx-field--open' : ''}`}>
      <button type="button" className="lx-field__trigger" onClick={onFocus}>
        <span className="lx-field__kicker">{label}</span>
        <span className="lx-field__value">
          <span className="lx-field__flag">{h?.flag ?? '🇪🇭'}</span>
          <strong>{h ? hubName(h) : t('transport.connect.pickHub')}</strong>
        </span>
        <span className="lx-field__sub">{sub}</span>
      </button>
      {active && (
        <div className="lx-field__panel">
          <input
            className="lx-field__search"
            placeholder={t('transport.connect.searchHub')}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            autoFocus
          />
          <div className="lx-field__zones">
            {scopeZones.map((z) => (
              <button
                key={z.id}
                type="button"
                className={zone === z.id ? 'lx-pill lx-pill--on' : 'lx-pill'}
                onClick={() => onZone(z.id)}
              >
                {z.icon} {t(`transport.zones.${z.id}`)}
              </button>
            ))}
          </div>
          <ul className="lx-field__list">
            {list.map((item: TransportHub) => (
              <li key={item.slug}>
                <button type="button" onClick={() => { onPick(item.slug); onClose(); }}>
                  <span>{item.flag}</span>
                  <strong>{hubName(item)}</strong>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function TransportConnect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authFetch, isSignedIn } = useAuthFetch();
  const t = useT();
  const { locale } = useLocale();

  const initialScope: TransportRouteScope =
    searchParams.get('scope') === 'international' ? 'international' : 'local';

  const [routeScope, setRouteScope] = useState<TransportRouteScope>(initialScope);
  const [originHub, setOriginHub] = useState(
    initialScope === 'international' ? INTL_DEFAULT.origin : LOCAL_DEFAULT.origin,
  );
  const [destHub, setDestHub] = useState(
    initialScope === 'international' ? INTL_DEFAULT.dest : LOCAL_DEFAULT.dest,
  );
  const [originZone, setOriginZone] = useState<TransportHubZone>(
    initialScope === 'international' ? INTL_DEFAULT.originZone : LOCAL_DEFAULT.originZone,
  );
  const [destZone, setDestZone] = useState<TransportHubZone>(
    initialScope === 'international' ? INTL_DEFAULT.destZone : LOCAL_DEFAULT.destZone,
  );
  const [activeField, setActiveField] = useState<Field>(null);
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');

  const [tripType, setTripType] = useState('shared_ride');
  const [seats, setSeats] = useState(1);
  const [departureDate, setDepartureDate] = useState('');
  const [phoneDial, setPhoneDial] = useState<TransportPhoneDial>(DEFAULT_TRANSPORT_PHONE_DIAL);
  const [phoneLocal, setPhoneLocal] = useState('');
  const [note, setNote] = useState('');
  const [priceEstimate, setPriceEstimate] = useState('');
  const [publishedTripId, setPublishedTripId] = useState<string | null>(null);

  const [trips, setTrips] = useState<TransportRequestSummary[]>([]);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = (searchParams.get('q') ?? '').trim();
    if (!raw) return;
    const norm = raw.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    const match = TRANSPORT_HUBS.find((h) => {
      const blob = `${h.slug} ${h.nameEs} ${h.nameAr}`.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
      return blob.includes(norm) || norm.includes(h.slug);
    });
    if (!match) {
      setOriginQuery(raw);
      setActiveField('origin');
      return;
    }
    const scope = hubScope(match.zone);
    setRouteScope(scope);
    setOriginHub(match.slug);
    setOriginZone(match.zone);
    setOriginQuery(pickLocalized(match, locale));
    const preferredDest =
      TRANSPORT_HUBS.find((h) => h.slug !== match.slug && hubsInScope(scope).some((x) => x.slug === h.slug) && h.popular) ??
      hubsInScope(scope).find((h) => h.slug !== match.slug);
    if (preferredDest) {
      setDestHub(preferredDest.slug);
      setDestZone(preferredDest.zone);
    }
  }, [searchParams, locale]);

  const hubName = (slug: string) => {
    const h = getTransportHub(slug);
    if (!h) return slug;
    return pickLocalized(h, locale);
  };
  const routeLabel = useMemo(
    () => `${hubName(originHub)} → ${hubName(destHub)}`,
    [originHub, destHub, locale],
  );
  const scopeCorridors = useMemo(() => corridorsForScope(routeScope), [routeScope]);

  const applyScope = (scope: TransportRouteScope) => {
    setRouteScope(scope);
    const d = scope === 'local' ? LOCAL_DEFAULT : INTL_DEFAULT;
    setOriginHub(d.origin);
    setDestHub(d.dest);
    setOriginZone(d.originZone);
    setDestZone(d.destZone);
    setOriginQuery('');
    setDestQuery('');
    setActiveField(null);
  };

  useEffect(() => {
    if (!activeField) return;
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [activeField]);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      const q = `originHubSlug=${originHub}&destinationHubSlug=${destHub}&limit=20`;
      const [tripRes, driverList] = await Promise.all([
        fetchApi<PaginatedResponse<Record<string, unknown>>>(`/transport?${q}`),
        fetchApi<DriverRow[]>(`/transport/drivers?${q}`).catch(() => [] as DriverRow[]),
      ]);
      setTrips(unwrapPaginated(tripRes).map((r) => mapApiTransport(r)));
      setDrivers(driverList);
    } catch {
      setTrips([]);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, [originHub, destHub]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const swap = () => {
    setOriginHub(destHub);
    setDestHub(originHub);
    setOriginZone(destZone);
    setDestZone(originZone);
  };

  const pickCorridor = (o: string, d: string) => {
    const ho = TRANSPORT_HUBS.find((h) => h.slug === o);
    const hd = TRANSPORT_HUBS.find((h) => h.slug === d);
    setOriginHub(o);
    setDestHub(d);
    if (ho) setOriginZone(ho.zone);
    if (hd) setDestZone(hd.zone);
  };

  const publish = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    if (originHub === destHub) {
      setToast(t('transport.connect.errors.sameHub'));
      return;
    }
    const origin = getTransportHub(originHub);
    const dest = getTransportHub(destHub);
    if (!origin || !dest) {
      setToast(t('transport.connect.errors.invalidHub'));
      return;
    }
    const scopeCheck = assertRouteMatchesScope(routeScope, originHub, destHub);
    if (!scopeCheck.ok) {
      setToast(
        routeScope === 'local'
          ? t('transport.connect.errors.localScope')
          : t('transport.connect.errors.intlScope'),
      );
      return;
    }
    setSubmitting(true);
    setToast('');
    try {
      await authFetch('/auth/sync', { method: 'POST' });
      const price = priceEstimate.trim() ? Number(priceEstimate) : undefined;
      let contactPhone: string | undefined;
      try {
        contactPhone = buildTransportContactPhone(phoneDial, phoneLocal);
      } catch {
        setToast(t('transport.connect.errors.phoneDigits', { count: TRANSPORT_PHONE_LOCAL_DIGITS }));
        setSubmitting(false);
        return;
      }
      const created = await authFetch<{ id: string }>('/transport', {
        method: 'POST',
        body: JSON.stringify({
          type: tripType,
          scope: routeScope,
          originHubSlug: originHub,
          destinationHubSlug: destHub,
          seatsRequested: seats,
          description: note.trim() || routeLabel,
          contactPhone,
          departureAt: departureDate ? new Date(departureDate).toISOString() : undefined,
          priceEstimate: price && Number.isFinite(price) && price > 0 ? price : undefined,
        }),
      });
      setPublishedTripId(created.id);
      setToast(t('transport.connect.errors.published'));
      setNote('');
      setPriceEstimate('');
      setPhoneLocal('');
      loadMatches();
    } catch (e) {
      const detail = e instanceof Error ? e.message : '';
      if (/401|403|sesión|session|Token|Inicia sesión/i.test(detail)) {
        setToast(t('transport.connect.errors.signIn'));
      } else if (detail) {
        setToast(detail.replace(/^API \d+:\s*/, ''));
      } else {
        setToast(t('transport.connect.errors.publishFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lx" ref={rootRef}>
      {activeField ? (
        <button type="button" className="lx-sheet-backdrop" tabIndex={-1} aria-hidden onClick={() => setActiveField(null)} />
      ) : null}

      <header className="lx-intro">
        <h1 className="lx-intro__ar">{t('transport.title')}</h1>
        <p className="lx-intro__es">{t('transport.connect.tagline')}</p>
        <div className="lx-route-pill" aria-live="polite">
          <span className="lx-route-pill__dot" aria-hidden />
          {routeLabel}
        </div>
        <div className="lx-scope" role="tablist" aria-label={t('transport.connect.scopeAria')}>
          <button
            type="button"
            role="tab"
            aria-selected={routeScope === 'local'}
            className={routeScope === 'local' ? 'lx-scope__btn lx-scope__btn--on' : 'lx-scope__btn'}
            onClick={() => applyScope('local')}
          >
            {t('transport.tabLocal')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={routeScope === 'international'}
            className={routeScope === 'international' ? 'lx-scope__btn lx-scope__btn--on' : 'lx-scope__btn'}
            onClick={() => applyScope('international')}
          >
            {t('transport.international')}
          </button>
        </div>
        <p className="lx-scope-hint">
          {routeScope === 'local' ? t('transport.connect.scopeLocalHint') : t('transport.connect.scopeIntlHint')}
        </p>
      </header>

      <div className="lx-layout">
        <section className="lx-booking" aria-label={t('transport.connect.bookingAria')}>
          <div className="lx-booking__head">
            <h2>{t('transport.connect.planTrip')}</h2>
            <Link href="/transport/register" className="lx-link-ghost">
              {t('transport.connect.imDriver')}
            </Link>
          </div>

          <div className="lx-route-box">
            <HubField
              label={t('transport.connect.origin')}
              sub={t('transport.pickOriginTitle')}
              hub={originHub}
              active={activeField === 'origin'}
              onFocus={() => setActiveField('origin')}
              query={originQuery}
              onQuery={setOriginQuery}
              zone={originZone}
              onZone={setOriginZone}
              onPick={setOriginHub}
              onClose={() => setActiveField(null)}
              scope={routeScope}
              locale={locale}
              t={t}
            />
            <button type="button" className="lx-swap" onClick={swap} aria-label={t('transport.connect.swapAria')}>
              <AppIcon name="repeat" size={18} color="var(--lx-gold)" />
            </button>
            <HubField
              label={t('transport.connect.dest')}
              sub={t('transport.pickDestTitle')}
              hub={destHub}
              active={activeField === 'dest'}
              onFocus={() => setActiveField('dest')}
              query={destQuery}
              onQuery={setDestQuery}
              zone={destZone}
              onZone={setDestZone}
              onPick={setDestHub}
              onClose={() => setActiveField(null)}
              scope={routeScope}
              locale={locale}
              t={t}
            />
          </div>

          <p className="lx-section-title">
            {routeScope === 'local' ? t('transport.connect.localCorridors') : t('transport.connect.intlCorridors')}
          </p>
          <div className="lx-corridors">
            {scopeCorridors.map((c) => (
              <button
                key={c.labelEs}
                type="button"
                className={
                  originHub === c.origin && destHub === c.destination ? 'lx-corridor lx-corridor--on' : 'lx-corridor'
                }
                onClick={() => pickCorridor(c.origin, c.destination)}
              >
                <span className="lx-corridor__line" />
                <span className="lx-corridor__text">
                  {hubName(c.origin)} → {hubName(c.destination)}
                </span>
              </button>
            ))}
          </div>

          <div className="lx-modes">
            {TRIP_MODE_IDS.map((id) => (
              <button
                key={id}
                type="button"
                className={tripType === id ? 'lx-mode lx-mode--on' : 'lx-mode'}
                onClick={() => setTripType(id)}
              >
                {t(`transport.connect.modes.${id}`)}
              </button>
            ))}
          </div>

          <div className="lx-inline-fields">
            <label>
              {t('transport.connect.seats')}
              <input type="number" min={1} max={20} value={seats} onChange={(e) => setSeats(+e.target.value)} />
            </label>
            <label>
              {t('transport.connect.date')}
              <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
            </label>
            <label className="lx-wide">
              {t('transport.connect.phone')}
              <div className="lx-phone">
                <select
                  className="lx-phone__dial"
                  value={phoneDial}
                  onChange={(e) => setPhoneDial(e.target.value as TransportPhoneDial)}
                  aria-label={t('transport.connect.phoneDialAria')}
                >
                  {TRANSPORT_PHONE_PREFIXES.map((p) => (
                    <option key={p.dial} value={p.dial}>
                      {p.flag} {p.dial}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  className="lx-phone__local"
                  placeholder={t('transport.connect.phonePlaceholder')}
                  value={phoneLocal}
                  maxLength={TRANSPORT_PHONE_LOCAL_DIGITS}
                  onChange={(e) => setPhoneLocal(sanitizeTransportLocalPhone(e.target.value))}
                  aria-describedby="lx-phone-hint"
                />
              </div>
              <span id="lx-phone-hint" className="lx-phone__hint">
                {t('transport.connect.phoneDigitsHint', { count: TRANSPORT_PHONE_LOCAL_DIGITS })}
              </span>
            </label>
            <label className="lx-wide">
              {t('transport.connect.note')}
              <input type="text" placeholder={t('transport.connect.notePlaceholder')} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <label>
              {t('transport.connect.priceOptional')}
              <input
                type="number"
                min={0}
                step={100}
                inputMode="decimal"
                placeholder="—"
                value={priceEstimate}
                onChange={(e) => setPriceEstimate(e.target.value)}
              />
            </label>
          </div>

          {toast && (
            <p className="lx-toast" role="status">
              {toast}
            </p>
          )}

          {publishedTripId ? (
            <Link href={`/transport/${publishedTripId}`} className="lx-cta lx-cta--link">
              <span>{t('transport.connect.openTrip')}</span>
              <AppIcon name="arrow-right" size={18} color="#1a1612" />
            </Link>
          ) : null}

          <button type="button" className="lx-cta" onClick={publish} disabled={submitting}>
            <span>{submitting ? t('transport.connect.publishing') : t('transport.connect.publishCta')}</span>
            <AppIcon name="arrow-right" size={18} color="#1a1612" />
          </button>
          <p className="lx-disclaimer">{t('transport.connect.disclaimer')}</p>
        </section>

        <aside className="lx-live-panel" aria-label={t('transport.connect.liveAria')}>
          <div className="lx-live-panel__top">
            <div>
              <h2>{t('transport.connect.liveTitle')}</h2>
              <p className="lx-route-live">{routeLabel}</p>
            </div>
            <button type="button" className="lx-refresh" onClick={() => loadMatches()} disabled={loading}>
              {loading ? '···' : '↻'}
            </button>
          </div>

          <div className="lx-live-counts">
            <div className="lx-count">
              <span className="lx-count__n">{drivers.length}</span>
              <span className="lx-count__l">{t('transport.connect.drivers')}</span>
            </div>
            <div className="lx-count">
              <span className="lx-count__n">{trips.length}</span>
              <span className="lx-count__l">{t('transport.connect.requests')}</span>
            </div>
          </div>

          {drivers.length > 0 && (
            <div className="lx-stack">
              <h3>{t('transport.connect.suggestedDrivers')}</h3>
              {drivers.slice(0, 6).map((d) => (
                <article key={d.id} className="lx-driver">
                  <div className="lx-driver__ring">🚐</div>
                  <div className="lx-driver__body">
                    <div className="lx-driver__row">
                      <strong>{d.user.displayName}</strong>
                      <span className="lx-verified">✓</span>
                    </div>
                    <p>
                      {d.vehicleType ?? t('transport.connect.vehicle')} ·{' '}
                      {t('transport.connect.seatsCount', { count: d.seatsCapacity })} · ★ {d.rating.toFixed(1)}
                    </p>
                    {d.frequentRoutes[0] && (
                      <p className="lx-driver__route">
                        {d.frequentRoutes[0].originCamp.nameEs} ↔ {d.frequentRoutes[0].destinationCamp.nameEs}
                      </p>
                    )}
                    {d.user.phone && (
                      <a href={`https://wa.me/${d.user.phone.replace(/\D/g, '')}`} className="lx-contact">
                        {t('transport.connect.contact')}
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="lx-stack">
            <h3>{t('transport.connect.openRequests')}</h3>
            {loading ? (
              <p className="lx-muted">{t('transport.connect.syncing')}</p>
            ) : trips.length === 0 ? (
              <div className="lx-empty">
                <p>{t('transport.connect.firstOnRoute')}</p>
                <small>{t('transport.connect.firstOnRouteSub')}</small>
              </div>
            ) : (
              trips.map((trip) => (
                <article key={trip.id} className="lx-trip">
                  <div className="lx-trip__route">
                    {trip.originCamp}
                    <span className="lx-trip__arrow">→</span>
                    {trip.destinationCamp}
                  </div>
                  <div className="lx-trip__foot">
                    <span className="lx-status">
                      {t(`transport.connect.status.${trip.status}` as 'transport.connect.status.requested') ??
                        trip.status}
                    </span>
                    {trip.seatsRequested ? (
                      <span>{t('transport.connect.seatOne', { count: trip.seatsRequested })}</span>
                    ) : null}
                    <Link href={`/transport/${trip.id}`}>{t('transport.connect.openTrip')}</Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
