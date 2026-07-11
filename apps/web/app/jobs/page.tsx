'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PaginatedResponse } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { demoJobs, fetchWithMeta, mapApiJob, type JobItem, unwrapPaginated } from '@/lib/api';
import { useT } from '@/lib/locale';

export default function JobsPage() {
  const t = useT();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => {
    fetchWithMeta<PaginatedResponse<Record<string, unknown>> | JobItem[]>(
      '/jobs',
      { data: demoJobs, meta: { total: demoJobs.length, page: 1, limit: 20, totalPages: 1 } },
    ).then((res) => {
      const raw = unwrapPaginated(res.data);
      setJobs(
        res.fromFallback
          ? demoJobs
          : raw.map((item) =>
              'campName' in item && typeof item.campName === 'string'
                ? (item as JobItem)
                : mapApiJob(item as Record<string, unknown>),
            ),
      );
      setUsingDemo(res.fromFallback);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <section className="lf-page-hero">
        <div className="lf-page-hero-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <AppIcon name="briefcase" size={36} color="var(--lf-gold)" />
            <div>
              <h1 className="lf-page-title" style={{ margin: 0 }}>
                {t('jobs.boardTitle')}
              </h1>
              <p className="lf-page-sub" style={{ margin: '4px 0 0' }}>
                {t('jobs.boardSubtitle')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="lf-page-body" style={{ maxWidth: 900 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <p style={{ color: 'var(--lf-text-muted)', margin: 0 }}>{t('jobs.salaryHint')}</p>
          <Link href="/jobs/create" style={{ color: 'var(--lf-gold)', fontWeight: 700, textDecoration: 'none' }}>
            {t('jobs.publishOffer')}
          </Link>
        </div>

        {usingDemo && (
          <p style={{ color: 'var(--lf-gold)', marginBottom: 16, fontSize: '0.9rem' }}>{t('common.demo')}</p>
        )}

        {loading ? (
          <p style={{ color: 'var(--lf-text-muted)' }}>{t('jobs.loading')}</p>
        ) : jobs.length === 0 ? (
          <p style={{ color: 'var(--lf-text-muted)' }}>{t('jobs.empty')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  gap: 16,
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'var(--lf-surface)',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(13,148,136,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AppIcon name="briefcase" size={22} color="var(--lf-emerald)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{job.title}</div>
                  <div style={{ color: 'var(--lf-emerald)', fontWeight: 600, marginTop: 4 }}>{job.salary}</div>
                  <div style={{ color: 'var(--lf-text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
                    {job.type} · {job.campName}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
