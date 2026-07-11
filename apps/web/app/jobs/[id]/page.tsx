'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Badge, Card } from '@lefrig/ui/client';
import { AppIcon } from '@/components/AppIcon';
import { demoJobs, fetchWithFallback, mapApiJob, type JobItem } from '@/lib/api';
import { useT } from '@/lib/locale';

export default function JobDetailPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const fallback = demoJobs.find((j) => j.id === id) ?? demoJobs[0]!;

  const [job, setJob] = useState<JobItem>(fallback);

  const categoryLabel = (category?: string) => {
    if (!category) return null;
    const key = `jobs.create.categories.${category}` as 'jobs.create.categories.other';
    const label = t(key);
    return label === key ? category : label;
  };

  useEffect(() => {
    fetchWithFallback<Record<string, unknown>>(`/jobs/${id}`, fallback as unknown as Record<string, unknown>).then(
      (raw) => {
        setJob('campName' in raw && typeof raw.campName === 'string' ? (raw as unknown as JobItem) : mapApiJob(raw));
      },
    );
  }, [id]);

  return (
    <>
      <section className="lf-page-hero">
        <div className="lf-page-hero-inner">
          <Link href="/jobs" style={{ color: 'var(--lf-gold)', textDecoration: 'none', fontSize: '0.9rem' }}>
            {t('jobs.detail.back')}
          </Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginTop: 16 }}>
            <AppIcon name="briefcase" size={36} color="var(--lf-gold)" />
            <div>
              <h1 className="lf-page-title" style={{ margin: 0 }}>{job.title}</h1>
              <p className="lf-page-sub" style={{ margin: '8px 0 0', color: 'var(--lf-emerald)', fontWeight: 700 }}>
                {job.salary}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="lf-page-body" style={{ maxWidth: 720 }}>
        <Card padding="lg">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <Badge variant="success">{job.type}</Badge>
            <Badge>{job.campName}</Badge>
            {job.category && <Badge variant="info">{categoryLabel(job.category)}</Badge>}
          </div>

          <p style={{ lineHeight: 1.7, color: 'var(--lf-text-muted)', margin: '0 0 24px' }}>
            {job.description ?? t('jobs.noDescription')}
          </p>

          {job.posterName && (
            <p style={{ margin: '0 0 8px', color: 'var(--lf-text-muted)' }}>
              {t('jobs.postedBy')} <strong style={{ color: 'inherit' }}>{job.posterName}</strong>
            </p>
          )}

          {job.contactPhone && (
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--lf-gold)' }}>
              {t('jobs.detail.contact')} {job.contactPhone}
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
