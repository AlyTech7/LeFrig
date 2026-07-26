'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, colors } from '@lefrig/ui/client';
import type { CampSummary } from '@lefrig/shared';
import { TRANSPORT_HUBS, localizedCampFromSummary, pickLocalized } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { fetchApi } from '@/lib/api';
import { PageBody, PageHero } from '@/components/PageHero';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';

const VEHICLE_TYPES = ['car', 'pickup', 'van', 'truck', 'motorcycle'] as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const POPULAR_HUBS = TRANSPORT_HUBS.filter((h) => h.popular).slice(0, 16);

function isUuid(value: string) {
  return UUID_RE.test(value);
}

export default function DriverRegisterPage() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthFetch();
  const [camps, setCamps] = useState<CampSummary[]>([]);
  const [campsLoading, setCampsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [preferredHubs, setPreferredHubs] = useState<string[]>([]);
  const [form, setForm] = useState({
    vehicleType: 'pickup',
    vehiclePlate: '',
    licenseNumber: '',
    seatsCapacity: '4',
    originCampId: '',
    destinationCampId: '',
  });

  useEffect(() => {
    let cancelled = false;
    setCampsLoading(true);
    fetchApi<CampSummary[]>('/camps')
      .then((res) => {
        if (cancelled) return;
        const list = (Array.isArray(res) ? res : []).filter((c) => isUuid(c.id));
        setCamps(list);
        setForm((f) => ({
          ...f,
          originCampId: f.originCampId || list[0]?.id || '',
          destinationCampId: f.destinationCampId || list[1]?.id || list[0]?.id || '',
        }));
      })
      .catch(() => {
        if (!cancelled) setCamps([]);
      })
      .finally(() => {
        if (!cancelled) setCampsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authFetch('/auth/sync', { method: 'POST' });

      const originOk = isUuid(form.originCampId);
      const destOk = isUuid(form.destinationCampId);
      const routes =
        originOk && destOk && form.originCampId !== form.destinationCampId
          ? [
              {
                originCampId: form.originCampId,
                destinationCampId: form.destinationCampId,
                frequency: 'weekly' as const,
              },
            ]
          : undefined;

      await authFetch('/transport/drivers/register', {
        method: 'POST',
        body: JSON.stringify({
          vehicleType: form.vehicleType,
          vehiclePlate: form.vehiclePlate.trim() || undefined,
          licenseNumber: form.licenseNumber.trim() || undefined,
          seatsCapacity: Number(form.seatsCapacity) || 4,
          preferredHubSlugs: preferredHubs.length ? preferredHubs : undefined,
          routes,
        }),
      });
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (/401|403|sesión|session|Token/i.test(message)) {
        setError(t('transport.driver.registerError'));
      } else if (/400|valid|uuid|camp/i.test(message)) {
        setError(t('transport.driver.registerValidationError'));
      } else {
        setError(t('transport.driver.registerError'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px', textAlign: 'center' }}>
        <AppIcon name="shield" size={48} color={colors.deepGreen[600]} />
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: colors.deepGreen[700], marginTop: 16 }}>
          {t('transport.driver.successTitle')}
        </h1>
        <p style={{ color: colors.gray[600], lineHeight: 1.6 }}>{t('transport.driver.successDesc')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <Link href="/me/driver">
            <Button>{t('transport.driver.goToDriverArea')}</Button>
          </Link>
          <Link href="/transport">
            <Button variant="outline">{t('transport.driver.backToTransport')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHero
        icon="truck"
        title={t('transport.driver.pageTitle')}
        subtitle={t('transport.driver.pageSubtitle')}
        maxWidth={640}
      />
      <PageBody maxWidth={640}>
        <Link
          href="/transport"
          style={{ color: 'var(--lf-gold)', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}
        >
          {t('transport.driver.back')}
        </Link>
        <Card padding="lg">
          <div style={{ display: 'grid', gap: 16 }}>
            <label>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                {t('transport.driver.vehicleTypeLabel')}
              </span>
              <select
                value={form.vehicleType}
                onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                style={{ width: '100%', padding: 12, borderRadius: 12, border: `2px solid ${colors.sand[300]}` }}
              >
                {VEHICLE_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {t(`transport.driver.vehicleTypes.${v}`)}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label={t('transport.driver.plate')}
              value={form.vehiclePlate}
              onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })}
              placeholder={t('transport.driver.platePlaceholder')}
            />
            <Input
              label={t('transport.driver.license')}
              value={form.licenseNumber}
              onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
              placeholder={t('transport.driver.licenseOptional')}
            />
            <Input
              label={t('transport.driver.seatsAvailable')}
              value={form.seatsCapacity}
              onChange={(e) => setForm({ ...form, seatsCapacity: e.target.value })}
              type="number"
            />
            {campsLoading ? (
              <p style={{ margin: 0, color: colors.gray[500], fontSize: '0.875rem' }}>{t('common.loading')}</p>
            ) : camps.length === 0 ? (
              <p style={{ margin: 0, color: colors.gray[600], fontSize: '0.875rem', lineHeight: 1.5 }}>
                {t('transport.driver.campsUnavailable')}
              </p>
            ) : (
              <>
                <div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                    {t('transport.connect.preferredHubs')}
                  </span>
                  <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: colors.gray[600] }}>
                    {t('transport.connect.preferredHubsHint')}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {POPULAR_HUBS.map((h) => {
                      const on = preferredHubs.includes(h.slug);
                      return (
                        <button
                          key={h.slug}
                          type="button"
                          onClick={() =>
                            setPreferredHubs((prev) =>
                              on
                                ? prev.filter((s) => s !== h.slug)
                                : prev.length >= 12
                                  ? prev
                                  : [...prev, h.slug],
                            )
                          }
                          style={{
                            padding: '6px 10px',
                            borderRadius: 999,
                            border: `1.5px solid ${on ? colors.deepGreen[600] : colors.sand[300]}`,
                            background: on ? colors.deepGreen[50] : '#fff',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {h.flag} {pickLocalized(h, locale)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                    {t('transport.driver.routeOrigin')}
                  </span>
                  <select
                    value={form.originCampId}
                    onChange={(e) => setForm({ ...form, originCampId: e.target.value })}
                    style={{ width: '100%', padding: 12, borderRadius: 12, border: `2px solid ${colors.sand[300]}` }}
                  >
                    {camps.map((c) => (
                      <option key={c.id} value={c.id}>
                        {localizedCampFromSummary(c, locale)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                    {t('transport.driver.routeDest')}
                  </span>
                  <select
                    value={form.destinationCampId}
                    onChange={(e) => setForm({ ...form, destinationCampId: e.target.value })}
                    style={{ width: '100%', padding: 12, borderRadius: 12, border: `2px solid ${colors.sand[300]}` }}
                  >
                    {camps.map((c) => (
                      <option key={c.id} value={c.id}>
                        {localizedCampFromSummary(c, locale)}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {error && <p style={{ color: colors.accentRed[500], margin: 0 }}>{error}</p>}
            <Button size="lg" fullWidth onClick={submit} disabled={loading || campsLoading}>
              {loading ? t('transport.driver.sending') : t('transport.driver.submit')}
            </Button>
          </div>
        </Card>
      </PageBody>
    </>
  );
}
