'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@lefrig/ui/client';
import type { CampSummary } from '@lefrig/shared';
import { localizedCampFromSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { demoCamps, fetchWithMeta } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';

const JOB_TYPES = ['offer', 'seeking'] as const;
const CATEGORIES = ['skilled', 'daily', 'professional', 'other'] as const;

export default function CreateJobPage() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthFetch();
  const [camps, setCamps] = useState<CampSummary[]>(demoCamps);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    jobType: 'offer',
    category: 'skilled',
    title: '',
    description: '',
    salary: '',
    contactPhone: '',
    campId: '',
  });

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    fetchWithMeta<CampSummary[]>('/camps', demoCamps).then((res) => {
      setCamps(res.data.length ? res.data : demoCamps);
      setForm((f) => ({ ...f, campId: f.campId || res.data[0]?.id || demoCamps[0]?.id || '' }));
    });
  }, [isSignedIn, router]);

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.campId) return;
    setSubmitting(true);
    setError('');
    try {
      await authFetch('/auth/sync', { method: 'POST' });
      await authFetch('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          campId: form.campId,
          jobType: form.jobType,
          category: form.category,
          title: form.title.trim(),
          description: form.description.trim(),
          salary: form.salary ? Number(form.salary) : undefined,
          contactPhone: form.contactPhone.trim() || undefined,
        }),
      });
      router.push('/jobs');
    } catch {
      setError(t('jobs.create.publishError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="lf-page-hero">
        <div className="lf-page-hero-inner">
          <Link href="/jobs" style={{ color: 'var(--lf-gold)', textDecoration: 'none', fontSize: '0.9rem' }}>
            {t('jobs.create.back')}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
            <AppIcon name="briefcase" size={36} color="var(--lf-gold)" />
            <div>
              <h1 className="lf-page-title" style={{ margin: 0 }}>{t('jobs.create.title')}</h1>
              <p className="lf-page-sub" style={{ margin: '4px 0 0' }}>{t('jobs.create.heroSub')}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="lf-page-body" style={{ maxWidth: 640 }}>
        <Card padding="lg">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ fontWeight: 600 }}>{t('jobs.create.type')}</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {JOB_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, jobType: type })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 999,
                    border: form.jobType === type ? '2px solid var(--lf-gold)' : '1px solid rgba(255,255,255,0.1)',
                    background: form.jobType === type ? 'rgba(212,175,55,0.12)' : 'transparent',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {t(`jobs.create.jobTypes.${type}`)}
                </button>
              ))}
            </div>

            <label style={{ fontWeight: 600 }}>{t('jobs.create.category')}</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'var(--lf-surface)', color: 'inherit' }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`jobs.create.categories.${c}`)}</option>
              ))}
            </select>

            <Input label={t('jobs.create.jobTitle')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <label style={{ fontWeight: 600 }}>{t('jobs.create.description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'var(--lf-surface)', color: 'inherit', resize: 'vertical' }}
            />
            <Input
              label={t('jobs.create.salary')}
              type="number"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
            />
            <Input
              label={t('jobs.create.contactPhone')}
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            />
            <label style={{ fontWeight: 600 }}>{t('jobs.create.camp')}</label>
            <select
              value={form.campId}
              onChange={(e) => setForm({ ...form, campId: e.target.value })}
              style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'var(--lf-surface)', color: 'inherit' }}
            >
              {camps.map((c) => (
                <option key={c.id} value={c.id}>{localizedCampFromSummary(c, locale)}</option>
              ))}
            </select>

            {error && <p style={{ color: '#f87171', margin: 0 }}>{error}</p>}

            <Button onClick={submit} disabled={submitting} fullWidth>
              {submitting ? t('jobs.create.publishing') : t('jobs.create.submit')}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
