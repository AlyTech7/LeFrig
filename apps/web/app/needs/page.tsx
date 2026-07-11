'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, colors } from '@lefrig/ui/client';
import type { CampSummary, PaginatedResponse } from '@lefrig/shared';
import { localizedCampFromSummary } from '@lefrig/shared';
import { PageBody, PageHero } from '@/components/PageHero';
import { demoCamps, fetchWithMeta, mapApiNeed, type NeedItem, unwrapPaginated } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';

const NEED_TYPES = ['product', 'service', 'transport', 'tindouf'] as const;

export default function NeedsPage() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthFetch();
  const [needs, setNeeds] = useState<NeedItem[]>([]);
  const [camps, setCamps] = useState<CampSummary[]>(demoCamps);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', campId: '', type: 'product' });

  const typeLabel = (type: string) => {
    const key = `needs.types.${type}` as 'needs.types.product';
    const label = t(key);
    return label === key ? type : label;
  };

  useEffect(() => {
    Promise.all([
      fetchWithMeta<CampSummary[]>('/camps', demoCamps),
      fetchWithMeta<PaginatedResponse<Record<string, unknown>>>('/needs', {
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      }),
    ]).then(([campsRes, needsRes]) => {
      setCamps(campsRes.data.length ? campsRes.data : demoCamps);
      setForm((f) => ({ ...f, campId: f.campId || campsRes.data[0]?.id || '' }));
      const raw = unwrapPaginated(needsRes.data);
      setNeeds(raw.map((n) => mapApiNeed(n as Record<string, unknown>)));
      setLoading(false);
    });
  }, []);

  const publishNeed = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    setSubmitting(true);
    try {
      await authFetch('/auth/sync', { method: 'POST' });
      await authFetch('/needs', {
        method: 'POST',
        body: JSON.stringify({
          type: form.type,
          title: form.title.trim(),
          description: form.description.trim(),
          campId: form.campId,
        }),
      });
      setShowForm(false);
      const res = await authFetch<PaginatedResponse<Record<string, unknown>>>('/needs');
      setNeeds(unwrapPaginated(res).map((n) => mapApiNeed(n as Record<string, unknown>)));
    } catch {
      alert(t('needs.publishError'));
    } finally {
      setSubmitting(false);
    }
  };

  const offerHelp = async (needId: string) => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    try {
      await authFetch(`/needs/${needId}/offers`, {
        method: 'POST',
        body: JSON.stringify({ message: t('needs.offerMessage') }),
      });
      alert(t('needs.offerSent'));
    } catch {
      alert(t('needs.offerError'));
    }
  };

  return (
    <>
      <PageHero
        icon="help-circle"
        title={t('needs.title')}
        subtitle={t('needs.subtitle')}
        maxWidth={900}
        action={
          <Button onClick={() => (isSignedIn ? setShowForm(true) : router.push('/sign-in'))}>
            {t('needs.create')}
          </Button>
        }
      />
      <PageBody maxWidth={900}>
      {showForm && (
        <Card padding="lg" style={{ marginBottom: 32 }}>
          <h2 style={{ marginTop: 0 }}>{t('needs.newNeed')}</h2>
          <div style={{ display: 'grid', gap: 16 }}>
            <Input label={t('needs.titleLabel')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <label>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>{t('needs.description')}</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: 12, borderRadius: 12, border: `2px solid ${colors.sand[300]}` }}
              />
            </label>
            <label>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>{t('needs.typeLabel')}</span>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={{ width: '100%', padding: 12, borderRadius: 12, border: `2px solid ${colors.sand[300]}` }}
              >
                {NEED_TYPES.map((type) => (
                  <option key={type} value={type}>{typeLabel(type)}</option>
                ))}
              </select>
            </label>
            <label>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>{t('needs.camp')}</span>
              <select
                value={form.campId}
                onChange={(e) => setForm({ ...form, campId: e.target.value })}
                style={{ width: '100%', padding: 12, borderRadius: 12, border: `2px solid ${colors.sand[300]}` }}
              >
                {camps.map((c) => (
                  <option key={c.id} value={c.id}>{localizedCampFromSummary(c, locale)}</option>
                ))}
              </select>
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button onClick={publishNeed} disabled={submitting}>
                {submitting ? t('needs.publishing') : t('community.publish')}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <p style={{ color: colors.gray[500] }}>{t('needs.loading')}</p>
      ) : needs.length === 0 ? (
        <Card padding="lg">
          <p style={{ margin: 0, color: colors.gray[600] }}>{t('needs.empty')}</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {needs.map((need) => (
            <Card key={need.id} padding="lg">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 700, color: colors.deepGreen[500], textTransform: 'uppercase' }}>
                    {typeLabel(need.type)} · {need.campName}
                  </p>
                  <Link href={`/needs/${need.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem' }}>{need.title}</h3>
                  </Link>
                  <p style={{ margin: 0, color: colors.gray[600], lineHeight: 1.6 }}>{need.description}</p>
                  <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: colors.gray[500] }}>
                    {t('needs.offersCount', { count: need.offersCount })}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => offerHelp(need.id)}>{t('needs.offer')}</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p style={{ marginTop: 32, fontSize: '0.9rem', color: 'var(--lf-text-muted)' }}>
        {t('needs.footer')}
      </p>
      </PageBody>
    </>
  );
}
