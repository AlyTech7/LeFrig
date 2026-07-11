import { ModerationClient } from '@/components/pages/ModerationClient';
import { demoReports } from '@/lib/demo-data';
import { fetchWithFallback } from '@/lib/api-server';
import type { AdminReportRow, Paginated } from '@/lib/types';

type ReportApiRow = {
  id: string;
  targetType: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter?: { displayName: string } | string;
};

export default async function ModerationPage() {
  const res = await fetchWithFallback<Paginated<ReportApiRow>>('/moderation/reports?status=pending&limit=100', {
    data: demoReports.map((r) => ({
      id: r.id,
      targetType: r.targetType,
      reason: r.reason,
      status: r.status,
      reporter: 'Usuario anónimo',
      createdAt: r.createdAt,
    })),
    meta: { total: demoReports.length, page: 1, limit: 100, totalPages: 1 },
  });

  const rows: AdminReportRow[] = res.data.map((r) => ({
    id: r.id,
    targetType: r.targetType,
    reason: r.reason,
    status: r.status,
    reporter: typeof r.reporter === 'object' && r.reporter?.displayName ? r.reporter.displayName : String(r.reporter ?? '—'),
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date(r.createdAt).toISOString(),
  }));

  return <ModerationClient initial={rows} />;
}
