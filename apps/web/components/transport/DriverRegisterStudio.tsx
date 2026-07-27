'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DEFAULT_PHONE_COUNTRY,
  TRANSPORT_HUBS,
  TRANSPORT_HUB_ZONES,
  type Locale,
  type TransportHub,
  type TransportHubZone,
  isValidPhoneE164,
  pickLocalized,
} from '@lefrig/shared';
import { PhoneField } from '@lefrig/ui/client';
import { AppIcon } from '@/components/AppIcon';
import { CountryFlag } from '@/components/CountryFlag';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';
import { GALLERY_ACCEPT, uploadListingImage, validateImageFile } from '@/lib/uploads';

type Step = 1 | 2 | 3 | 4;
type CoverageMode = 'zone' | 'corridors' | 'flexible';
type VehicleType = 'car' | 'pickup' | 'van' | 'truck' | 'motorcycle';
type CoverageScope = 'local' | 'international';
type CorridorPair = { originHubSlug: string; destinationHubSlug: string };

type ExistingProfile = {
  vehicleType: string | null;
  vehiclePlate: string | null;
  licenseNumber: string | null;
  seatsCapacity: number;
  coverageMode: CoverageMode | null;
  coverageOriginHubSlug: string | null;
  coverageZones: string[];
  corridorPairs: CorridorPair[] | null;
  coverageScope: CoverageScope | null;
  contactPhone: string | null;
  whatsapp: string | null;
  licenseDocUrl: string | null;
  vehiclePhotoUrl: string | null;
  verificationStatus: string;
};

const STEPS: { n: Step; labelKey: string }[] = [
  { n: 1, labelKey: 'transport.driver.stepVehicle' },
  { n: 2, labelKey: 'transport.driver.stepCoverage' },
  { n: 3, labelKey: 'transport.driver.stepContact' },
  { n: 4, labelKey: 'transport.driver.stepTrust' },
];

const TIP_KEYS: Record<Step, string> = {
  1: 'transport.driver.tip1',
  2: 'transport.driver.tip2',
  3: 'transport.driver.tip3',
  4: 'transport.driver.tip4',
};

const VEHICLE_TYPES: { id: VehicleType; icon: string }[] = [
  { id: 'car', icon: '🚗' },
  { id: 'pickup', icon: '🛻' },
  { id: 'van', icon: '🚐' },
  { id: 'truck', icon: '🚛' },
  { id: 'motorcycle', icon: '🏍️' },
];

const MODES: { id: CoverageMode; icon: string; labelKey: string; descKey: string }[] = [
  { id: 'zone', icon: '🗺️', labelKey: 'transport.driver.modeZone', descKey: 'transport.driver.modeZoneDesc' },
  {
    id: 'corridors',
    icon: '🛤️',
    labelKey: 'transport.driver.modeCorridors',
    descKey: 'transport.driver.modeCorridorsDesc',
  },
  {
    id: 'flexible',
    icon: '🌐',
    labelKey: 'transport.driver.modeFlexible',
    descKey: 'transport.driver.modeFlexibleDesc',
  },
];

const ZONE_OPTIONS = TRANSPORT_HUB_ZONES.map((z) => z.id);
const ORIGIN_PICKS = TRANSPORT_HUBS.filter((h) => h.popular).slice(0, 20);

function hubName(h: TransportHub, locale: Locale) {
  return pickLocalized(h, locale);
}

function DocSlot({
  label,
  url,
  uploading,
  error,
  onPick,
  onClear,
  inputRef,
}: {
  label: string;
  url: string | null;
  uploading: boolean;
  error: string;
  onPick: (file: File) => void;
  onClear: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="drv-doc">
      <span className="drv-doc__label">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept={GALLERY_ACCEPT}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onPick(file);
        }}
      />
      {url ? (
        <div className="drv-doc__preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" />
          <button type="button" className="pub-btn pub-btn--ghost" onClick={onClear}>
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="drv-doc__add"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? '…' : '+'}
        </button>
      )}
      {error ? <p className="pub-error" style={{ marginTop: 8 }}>{error}</p> : null}
    </div>
  );
}

function MiniHubPicker({
  value,
  onChange,
  placeholder,
  locale,
}: {
  value: string;
  onChange: (slug: string) => void;
  placeholder: string;
  locale: Locale;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const selected = TRANSPORT_HUBS.find((h) => h.slug === value);
  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = query
      ? TRANSPORT_HUBS.filter(
          (h) =>
            h.nameEs.toLowerCase().includes(query) ||
            h.nameAr.includes(query) ||
            h.slug.includes(query),
        )
      : ORIGIN_PICKS;
    return base.slice(0, 18);
  }, [q]);

  return (
    <div className={`drv-hub ${open ? 'drv-hub--open' : ''}`}>
      <button type="button" className="drv-hub__trigger" onClick={() => setOpen((o) => !o)}>
        <span>
          {selected ? (
            <>
              <CountryFlag country={selected.country} size={14} /> {hubName(selected, locale)}
            </>
          ) : (
            placeholder
          )}
        </span>
      </button>
      {open ? (
        <div className="drv-hub__panel">
          <input
            className="drv-hub__search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            autoFocus
          />
          <ul>
            {list.map((h) => (
              <li key={h.slug}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(h.slug);
                    setOpen(false);
                    setQ('');
                  }}
                >
                  <CountryFlag country={h.country} size={14} />
                  <strong>{hubName(h, locale)}</strong>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function DriverRegisterStudio() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const { authFetch, isSignedIn, getToken, syncUser } = useAuthFetch();

  const [step, setStep] = useState<Step>(1);
  const [editing, setEditing] = useState(false);
  const [successKind, setSuccessKind] = useState<'basic' | 'pending' | null>(null);

  const [vehicleType, setVehicleType] = useState<VehicleType>('pickup');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [seatsCapacity, setSeatsCapacity] = useState('4');

  const [coverageMode, setCoverageMode] = useState<CoverageMode>('zone');
  const [coverageOrigin, setCoverageOrigin] = useState('tindouf');
  const [coverageZones, setCoverageZones] = useState<TransportHubZone[]>(['wilaya']);
  const [corridors, setCorridors] = useState<CorridorPair[]>([
    { originHubSlug: 'tindouf', destinationHubSlug: 'rabouni' },
  ]);
  const [coverageScope, setCoverageScope] = useState<CoverageScope>('local');

  const [phone, setPhone] = useState<string>(DEFAULT_PHONE_COUNTRY.dial);
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [whatsappSame, setWhatsappSame] = useState(true);

  const [licenseDocUrl, setLicenseDocUrl] = useState<string | null>(null);
  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState<string | null>(null);
  const [licenseUploading, setLicenseUploading] = useState(false);
  const [vehicleUploading, setVehicleUploading] = useState(false);
  const [licenseErr, setLicenseErr] = useState('');
  const [vehicleErr, setVehicleErr] = useState('');
  const [submitForReview, setSubmitForReview] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const licenseRef = useRef<HTMLInputElement>(null);
  const vehicleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    authFetch<ExistingProfile>('/transport/drivers/me')
      .then((p) => {
        if (cancelled || !p) return;
        setEditing(true);
        if (p.vehicleType) setVehicleType(p.vehicleType as VehicleType);
        setVehiclePlate(p.vehiclePlate ?? '');
        setLicenseNumber(p.licenseNumber ?? '');
        setSeatsCapacity(String(p.seatsCapacity || 4));
        if (p.coverageMode) setCoverageMode(p.coverageMode);
        if (p.coverageOriginHubSlug) setCoverageOrigin(p.coverageOriginHubSlug);
        if (p.coverageZones?.length) setCoverageZones(p.coverageZones as TransportHubZone[]);
        if (Array.isArray(p.corridorPairs) && p.corridorPairs.length) {
          const pairs = p.corridorPairs.filter(
            (c): c is CorridorPair =>
              Boolean(c?.originHubSlug && c?.destinationHubSlug),
          );
          if (pairs.length) setCorridors(pairs);
        }
        if (p.coverageScope) setCoverageScope(p.coverageScope);
        if (p.contactPhone) setPhone(p.contactPhone);
        if (p.whatsapp) {
          setWhatsapp(p.whatsapp);
          setWhatsappSame(p.whatsapp === p.contactPhone);
        }
        setLicenseDocUrl(p.licenseDocUrl);
        setVehiclePhotoUrl(p.vehiclePhotoUrl);
        if (p.verificationStatus === 'pending_review' || p.licenseDocUrl) setSubmitForReview(true);
      })
      .catch(() => {
        /* no profile yet */
      });
    return () => {
      cancelled = true;
    };
  }, [authFetch, isSignedIn]);

  const phoneOk = isValidPhoneE164(phone.trim());
  const whatsappValue = whatsappSame ? phone.trim() : whatsapp.trim();
  const whatsappOk = !whatsappValue || isValidPhoneE164(whatsappValue);

  const coverageOk = useMemo(() => {
    if (coverageMode === 'zone') return Boolean(coverageOrigin) && coverageZones.length > 0;
    if (coverageMode === 'corridors') {
      return (
        corridors.length > 0 &&
        corridors.every((c) => c.originHubSlug && c.destinationHubSlug && c.originHubSlug !== c.destinationHubSlug)
      );
    }
    return Boolean(coverageScope);
  }, [coverageMode, coverageOrigin, coverageZones, corridors, coverageScope]);

  const canNext = useMemo(() => {
    if (step === 1) return Boolean(vehicleType) && Number(seatsCapacity) >= 1;
    if (step === 2) return coverageOk;
    if (step === 3) return phoneOk && whatsappOk;
    if (step === 4) {
      if (submitForReview && !licenseDocUrl) return false;
      return !licenseUploading && !vehicleUploading;
    }
    return true;
  }, [
    step,
    vehicleType,
    seatsCapacity,
    coverageOk,
    phoneOk,
    whatsappOk,
    submitForReview,
    licenseDocUrl,
    licenseUploading,
    vehicleUploading,
  ]);

  const progress = (step / 4) * 100;

  const uploadDoc = useCallback(
    async (file: File, kind: 'license' | 'vehicle') => {
      const setUploading = kind === 'license' ? setLicenseUploading : setVehicleUploading;
      const setErr = kind === 'license' ? setLicenseErr : setVehicleErr;
      const setUrl = kind === 'license' ? setLicenseDocUrl : setVehiclePhotoUrl;
      setErr('');
      const invalid = validateImageFile(file);
      if (invalid) {
        setErr(invalid);
        return;
      }
      if (!isSignedIn) {
        router.push('/sign-in');
        return;
      }
      setUploading(true);
      try {
        await syncUser();
        const token = await getToken();
        const result = await uploadListingImage(file, token);
        setUrl(result.url);
        if (kind === 'license') setSubmitForReview(true);
      } catch (e) {
        setErr(e instanceof Error ? e.message : t('uploader.uploadError'));
      } finally {
        setUploading(false);
      }
    },
    [getToken, isSignedIn, router, syncUser, t],
  );

  const toggleZone = (z: TransportHubZone) => {
    setCoverageZones((prev) => (prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z].slice(0, 6)));
  };

  const publish = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    if (!canNext) {
      setError(t('transport.driver.registerValidationError'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authFetch('/auth/sync', { method: 'POST' });
      const body = {
        vehicleType,
        vehiclePlate: vehiclePlate.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        seatsCapacity: Number(seatsCapacity) || 4,
        coverageMode,
        coverageOriginHubSlug: coverageMode === 'zone' ? coverageOrigin : undefined,
        coverageZones: coverageMode === 'zone' ? coverageZones : undefined,
        corridorPairs: coverageMode === 'corridors' ? corridors : undefined,
        coverageScope: coverageMode === 'flexible' ? coverageScope : undefined,
        contactPhone: phone.trim(),
        whatsapp: whatsappValue || undefined,
        licenseDocUrl: licenseDocUrl || undefined,
        vehiclePhotoUrl: vehiclePhotoUrl || undefined,
        submitForReview: Boolean(submitForReview && licenseDocUrl),
      };
      await authFetch('/transport/drivers/register', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setSuccessKind(submitForReview && licenseDocUrl ? 'pending' : 'basic');
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (/400|valid|phone|cobertura|zone|corredor/i.test(message)) {
        setError(t('transport.driver.registerValidationError'));
      } else {
        setError(t('transport.driver.registerError'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (successKind) {
    return (
      <div className="pub drv-success">
        <div className="drv-success__icon">
          <AppIcon name="shield" size={48} color="var(--pub-green, #2d8a62)" />
        </div>
        <h1>
          {successKind === 'pending'
            ? t('transport.driver.successPendingTitle')
            : t('transport.driver.successTitle')}
        </h1>
        <p>
          {successKind === 'pending'
            ? t('transport.driver.successPendingDesc')
            : t('transport.driver.successDesc')}
        </p>
        <div className="drv-success__actions">
          <Link href="/me/driver" className="pub-btn pub-btn--gold">
            {t('transport.driver.goToDriverArea')}
          </Link>
          <Link href="/transport" className="pub-btn pub-btn--ghost">
            {t('transport.driver.backToTransport')}
          </Link>
        </div>
      </div>
    );
  }

  const originHub = TRANSPORT_HUBS.find((h) => h.slug === coverageOrigin);

  return (
    <div className="pub">
      <header className="pub-hero">
        <div className="pub-hero__top">
          <Link href="/transport" className="pub-back">
            <AppIcon name="arrow-left" size={16} color="var(--pub-gold, #a8842d)" />
            {t('transport.driver.back')}
          </Link>
          <span className="pub-badge">{t('transport.driver.badge')}</span>
        </div>
        <p className="pub-hero__ar">{t('transport.driver.kicker')}</p>
        <h1>{t('transport.driver.pageTitle')}</h1>
        <p className="pub-lead">{t('transport.driver.lead')}</p>
        <div className="pub-progress">
          <div className="pub-progress__bar" style={{ width: `${progress}%` }} />
        </div>
        <nav className="pub-steps" aria-label={t('publish.stepsAria')}>
          {STEPS.map((s) => (
            <button
              key={s.n}
              type="button"
              className={step === s.n ? 'pub-step pub-step--on' : step > s.n ? 'pub-step pub-step--done' : 'pub-step'}
              onClick={() => s.n < step && setStep(s.n)}
              disabled={s.n > step}
            >
              <span className="pub-step__n">{step > s.n ? '✓' : s.n}</span>
              <span>
                <strong>{t(s.labelKey)}</strong>
              </span>
            </button>
          ))}
        </nav>
      </header>

      <div className="pub-layout">
        <section className="pub-panel">
          {step === 1 && (
            <>
              <h2>{t('transport.driver.vehicle')}</h2>
              <p className="pub-hint">{t('transport.driver.vehicleHint')}</p>
              <div className="pub-cats" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                {VEHICLE_TYPES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={vehicleType === v.id ? 'pub-cat pub-cat--on' : 'pub-cat'}
                    onClick={() => setVehicleType(v.id)}
                  >
                    <span className="pub-cat__icon">{v.icon}</span>
                    <strong>{t(`transport.driver.vehicleTypes.${v.id}`)}</strong>
                  </button>
                ))}
              </div>
              <label className="pub-field">
                <span>{t('transport.driver.plate')}</span>
                <input
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder={t('transport.driver.platePlaceholder')}
                  maxLength={20}
                />
              </label>
              <label className="pub-field">
                <span>
                  {t('transport.driver.license')}{' '}
                  <em style={{ fontWeight: 500, opacity: 0.65 }}>({t('transport.driver.licenseOptional')})</em>
                </span>
                <input
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  maxLength={40}
                />
              </label>
              <label className="pub-field">
                <span>{t('transport.driver.seatsAvailable')}</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={seatsCapacity}
                  onChange={(e) => setSeatsCapacity(e.target.value)}
                />
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <h2>{t('transport.driver.coverageTitle')}</h2>
              <p className="pub-hint">{t('transport.driver.coverageHint')}</p>
              <div className="pub-cats" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={coverageMode === m.id ? 'pub-cat pub-cat--on' : 'pub-cat'}
                    onClick={() => setCoverageMode(m.id)}
                  >
                    <span className="pub-cat__icon">{m.icon}</span>
                    <strong>{t(m.labelKey)}</strong>
                    <small>{t(m.descKey)}</small>
                  </button>
                ))}
              </div>

              {coverageMode === 'zone' && (
                <>
                  <h3 className="pub-subtitle">{t('transport.driver.coverageOrigin')}</h3>
                  <div className="pub-camps">
                    {ORIGIN_PICKS.map((h) => (
                      <button
                        key={h.slug}
                        type="button"
                        className={coverageOrigin === h.slug ? 'pub-camp pub-camp--on' : 'pub-camp'}
                        onClick={() => setCoverageOrigin(h.slug)}
                      >
                        <CountryFlag country={h.country} size={16} />
                        <span>
                          <strong>{hubName(h, locale)}</strong>
                        </span>
                      </button>
                    ))}
                  </div>
                  <MiniHubPicker
                    value={coverageOrigin}
                    onChange={setCoverageOrigin}
                    placeholder={t('transport.driver.searchHub')}
                    locale={locale}
                  />
                  <h3 className="pub-subtitle">{t('transport.driver.coverageZones')}</h3>
                  <div className="pub-cats" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                    {ZONE_OPTIONS.map((z) => (
                      <button
                        key={z}
                        type="button"
                        className={coverageZones.includes(z) ? 'pub-cat pub-cat--on' : 'pub-cat'}
                        onClick={() => toggleZone(z)}
                      >
                        <strong>{t(`transport.zones.${z}`)}</strong>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {coverageMode === 'corridors' && (
                <>
                  {corridors.map((c, i) => (
                    <div key={i} className="drv-corridor">
                      <div className="drv-corridor__row">
                        <label className="pub-field">
                          <span>{t('transport.driver.corridorOrigin')}</span>
                          <MiniHubPicker
                            value={c.originHubSlug}
                            onChange={(slug) =>
                              setCorridors((prev) => prev.map((x, j) => (j === i ? { ...x, originHubSlug: slug } : x)))
                            }
                            placeholder={t('transport.driver.searchHub')}
                            locale={locale}
                          />
                        </label>
                        <label className="pub-field">
                          <span>{t('transport.driver.corridorDest')}</span>
                          <MiniHubPicker
                            value={c.destinationHubSlug}
                            onChange={(slug) =>
                              setCorridors((prev) =>
                                prev.map((x, j) => (j === i ? { ...x, destinationHubSlug: slug } : x)),
                              )
                            }
                            placeholder={t('transport.driver.searchHub')}
                            locale={locale}
                          />
                        </label>
                      </div>
                      {corridors.length > 1 ? (
                        <button
                          type="button"
                          className="pub-btn pub-btn--ghost"
                          onClick={() => setCorridors((prev) => prev.filter((_, j) => j !== i))}
                        >
                          {t('transport.driver.removeCorridor')}
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {corridors.length < 12 ? (
                    <button
                      type="button"
                      className="pub-btn pub-btn--ghost"
                      onClick={() =>
                        setCorridors((prev) => [
                          ...prev,
                          { originHubSlug: 'tindouf', destinationHubSlug: 'rabouni' },
                        ])
                      }
                    >
                      + {t('transport.driver.addCorridor')}
                    </button>
                  ) : null}
                </>
              )}

              {coverageMode === 'flexible' && (
                <>
                  <h3 className="pub-subtitle">{t('transport.driver.coverageScope')}</h3>
                  <div className="pub-cats" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <button
                      type="button"
                      className={coverageScope === 'local' ? 'pub-cat pub-cat--on' : 'pub-cat'}
                      onClick={() => setCoverageScope('local')}
                    >
                      <strong>{t('transport.driver.scopeLocal')}</strong>
                    </button>
                    <button
                      type="button"
                      className={coverageScope === 'international' ? 'pub-cat pub-cat--on' : 'pub-cat'}
                      onClick={() => setCoverageScope('international')}
                    >
                      <strong>{t('transport.driver.scopeInternational')}</strong>
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h2>{t('transport.driver.contactTitle')}</h2>
              <p className="pub-hint">{t('transport.driver.contactHint')}</p>
              <PhoneField label={t('transport.driver.phone')} value={phone} onChange={setPhone} locale={locale} />
              <label className="drv-check">
                <input
                  type="checkbox"
                  checked={whatsappSame}
                  onChange={(e) => setWhatsappSame(e.target.checked)}
                />
                <span>{t('transport.driver.whatsappSame')}</span>
              </label>
              {!whatsappSame ? (
                <PhoneField
                  label={t('transport.driver.whatsapp')}
                  value={whatsapp || DEFAULT_PHONE_COUNTRY.dial}
                  onChange={setWhatsapp}
                  locale={locale}
                />
              ) : null}
            </>
          )}

          {step === 4 && (
            <>
              <h2>{t('transport.driver.trustTitle')}</h2>
              <p className="pub-hint">{t('transport.driver.trustHint')}</p>
              <div className="drv-docs">
                <DocSlot
                  label={t('transport.driver.licenseDoc')}
                  url={licenseDocUrl}
                  uploading={licenseUploading}
                  error={licenseErr}
                  inputRef={licenseRef}
                  onPick={(f) => void uploadDoc(f, 'license')}
                  onClear={() => {
                    setLicenseDocUrl(null);
                    setSubmitForReview(false);
                  }}
                />
                <DocSlot
                  label={t('transport.driver.vehiclePhoto')}
                  url={vehiclePhotoUrl}
                  uploading={vehicleUploading}
                  error={vehicleErr}
                  inputRef={vehicleRef}
                  onPick={(f) => void uploadDoc(f, 'vehicle')}
                  onClear={() => setVehiclePhotoUrl(null)}
                />
              </div>
              <label className={`drv-check ${!licenseDocUrl ? 'drv-check--disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={submitForReview && Boolean(licenseDocUrl)}
                  disabled={!licenseDocUrl}
                  onChange={(e) => setSubmitForReview(e.target.checked)}
                />
                <span>
                  <strong>{t('transport.driver.submitReview')}</strong>
                  <small>{t('transport.driver.submitReviewHint')}</small>
                </span>
              </label>
              {!licenseDocUrl ? (
                <p className="pub-hint pub-hint--tight">{t('transport.driver.skipDocs')}</p>
              ) : null}

              <h3 className="pub-subtitle">{t('transport.driver.reviewTitle')}</h3>
              <dl className="pub-review">
                <div>
                  <dt>{t('transport.driver.vehicle')}</dt>
                  <dd>
                    {t(`transport.driver.vehicleTypes.${vehicleType}`)}
                    {vehiclePlate ? ` · ${vehiclePlate}` : ''} · {seatsCapacity}{' '}
                    {t('transport.driver.seatsAvailable').toLowerCase()}
                  </dd>
                </div>
                <div>
                  <dt>{t('transport.driver.coverageTitle')}</dt>
                  <dd>
                    {coverageMode === 'zone' &&
                      `${originHub ? hubName(originHub, locale) : coverageOrigin} → ${coverageZones
                        .map((z) => t(`transport.zones.${z}`))
                        .join(', ')}`}
                    {coverageMode === 'corridors' &&
                      corridors
                        .map((c) => {
                          const o = TRANSPORT_HUBS.find((h) => h.slug === c.originHubSlug);
                          const d = TRANSPORT_HUBS.find((h) => h.slug === c.destinationHubSlug);
                          return `${o ? hubName(o, locale) : c.originHubSlug} → ${d ? hubName(d, locale) : c.destinationHubSlug}`;
                        })
                        .join(' · ')}
                    {coverageMode === 'flexible' &&
                      (coverageScope === 'local'
                        ? t('transport.driver.scopeLocal')
                        : t('transport.driver.scopeInternational'))}
                  </dd>
                </div>
                <div>
                  <dt>{t('transport.driver.phone')}</dt>
                  <dd>{phone}</dd>
                </div>
              </dl>
            </>
          )}

          {error ? <p className="pub-error">{error}</p> : null}

          <div className="pub-actions">
            {step > 1 ? (
              <button type="button" className="pub-btn pub-btn--ghost" onClick={() => setStep((s) => (s - 1) as Step)}>
                {t('transport.driver.prev')}
              </button>
            ) : (
              <span />
            )}
            {step < 4 ? (
              <button
                type="button"
                className="pub-btn pub-btn--gold"
                disabled={!canNext}
                onClick={() => setStep((s) => (s + 1) as Step)}
              >
                {t('transport.driver.next')}
              </button>
            ) : (
              <button
                type="button"
                className="pub-btn pub-btn--gold"
                disabled={!canNext || loading}
                onClick={() => void publish()}
              >
                {loading
                  ? t('transport.driver.publishing')
                  : editing
                    ? t('transport.driver.updateProfile')
                    : t('transport.driver.publish')}
              </button>
            )}
          </div>
        </section>

        <aside className="pub-aside">
          <article className="pub-card">
            <h3>{t('transport.driver.badge')}</h3>
            <p>{t(TIP_KEYS[step])}</p>
            <ul className="pub-checklist">
              <li className={vehicleType ? 'done' : ''}>{t('transport.driver.stepVehicle')}</li>
              <li className={coverageOk ? 'done' : ''}>{t('transport.driver.stepCoverage')}</li>
              <li className={phoneOk ? 'done' : ''}>{t('transport.driver.stepContact')}</li>
              <li className={step === 4 ? 'done' : ''}>{t('transport.driver.stepTrust')}</li>
            </ul>
            <p className="pub-hint pub-hint--tight">{t('transport.driver.trustLine')}</p>
          </article>
        </aside>
      </div>
    </div>
  );
}
