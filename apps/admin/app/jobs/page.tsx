import { JobsClient } from '@/components/pages/JobsClient';
import { demoJobsAdmin } from '@/lib/demo-data';
import { fetchWithFallback } from '@/lib/api-server';
import type { AdminJobRow, Paginated } from '@/lib/types';

export default async function JobsPage() {
  const res = await fetchWithFallback<Paginated<AdminJobRow>>('/admin/jobs?limit=100', {
    data: demoJobsAdmin.map((j) => ({
      ...j,
      createdAt: new Date().toISOString(),
    })),
    meta: { total: demoJobsAdmin.length, page: 1, limit: 100, totalPages: 1 },
  });

  return <JobsClient initial={res.data} />;
}
