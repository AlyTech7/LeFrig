'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, colors } from '@lefrig/ui/client';
import type { CampSummary } from '@lefrig/shared';
import { localizedCampFromSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { demoCamps, fetchWithMeta } from '@/lib/api';
import { PageBody, PageHero } from '@/components/PageHero';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';

const VEHICLE_TYPES = ['car', 'pickup', 'van', 'truck', 'motorcycle'] as const;

export default function DriverRegisterPage() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthFetch();
  const [camps, setCamps] = useState<CampSummary[]>(demoCamps);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    vehicleType: 'pickup',
    vehiclePlate: '',
    licenseNumber: '',
    seatsCapacity: '4',
    originCampId: '',
    destinationCampId: '',
  });

  useEffect(() => {
    fetchWithMeta<CampSummary[]>('/camps', demoCamps).then((res) => {
      const list = res.data.length ? res.data : demoCamps;
      setCamps(list);
      setForm((f) => ({
        ...f,
        originCampId: f.originCampId || list[0]?.id || '',
        destinationCampId: f.destinationCampId || list[1]?.id || list[0]?.id || '',
      }));
    });
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
      await authFetch('/transport/drivers/register', {
        method: 'POST',
        body: JSON.stringify({
          vehicleType: form.vehicleType,
          vehiclePlate: form.vehiclePlate.trim() || undefined,
          licenseNumber: form.licenseNumber.trim() || undefined,
          seatsCapacity: Number(form.seatsCapacity) || 4,
          routes:
            form.originCampId && form.destinationCampId
              ? [{ originCampId: form.originCampId, destinationCampId: form.destinationCampId, frequency: 'weekly' }]
              : undefined,
        }),
      });
      setSuccess(true);
    } catch {
      setError(t('transport.driver.registerError'));
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
        <Link href="/transport" style={{ display: 'inline-block', marginTop: 24 }}>
          <Button>{t('transport.driver.backToTransport')}</Button>
        </Link>
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
      <Link href="/transport" style={{ color: 'var(--lf-gold)', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>
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
                <option key={v} value={v}>{t(`transport.driver.vehicleTypes.${v}`)}</option>
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
                <option key={c.id} value={c.id}>{localizedCampFromSummary(c, locale)}</option>
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
                <option key={c.id} value={c.id}>{localizedCampFromSummary(c, locale)}</option>
              ))}
            </select>
          </label>
          {error && <p style={{ color: colors.accentRed[500], margin: 0 }}>{error}</p>}
          <Button size="lg" fullWidth onClick={submit} disabled={loading}>
            {loading ? t('transport.driver.sending') : t('transport.driver.submit')}
          </Button>
        </div>
      </Card>
      </PageBody>
    </>
  );
}
