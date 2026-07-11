import { DisputesClient } from '@/components/pages/DisputesClient';
import { demoDisputes } from '@/lib/demo-data';
import { fetchWithFallback } from '@/lib/api-server';
import type { AdminDisputeRow, Paginated } from '@/lib/types';

export default async function DisputesPage() {
  const res = await fetchWithFallback<Paginated<AdminDisputeRow>>('/admin/disputes?limit=100', {
    data: demoDisputes.map((d) => ({
      id: d.id,
      reason: d.type,
      status: d.status,
      type: d.type,
      opener: '',
      respondent: '',
      parties: d.parties,
      amount: d.amount,
      createdAt: new Date().toISOString(),
    })),
    meta: { total: demoDisputes.length, page: 1, limit: 100, totalPages: 1 },
  });

  return <DisputesClient initial={res.data} />;
}
