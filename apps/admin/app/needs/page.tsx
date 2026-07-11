import { NeedsClient } from '@/components/pages/NeedsClient';
import { demoNeedsAdmin } from '@/lib/demo-data';
import { fetchWithFallback } from '@/lib/api-server';
import type { AdminNeedRow, Paginated } from '@/lib/types';

export default async function NeedsPage() {
  const res = await fetchWithFallback<Paginated<AdminNeedRow>>('/admin/needs?limit=100', {
    data: demoNeedsAdmin.map((n) => ({ ...n, createdAt: new Date().toISOString() })),
    meta: { total: demoNeedsAdmin.length, page: 1, limit: 100, totalPages: 1 },
  });

  return <NeedsClient initial={res.data} />;
}
