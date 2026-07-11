import { DriversClient } from '@/components/pages/DriversClient';
import { fetchWithFallback } from '@/lib/api-server';
import type { Paginated } from '@/lib/types';
import type { AdminDriverRow } from '@/components/pages/DriversClient';

export default async function DriversPage() {
  const res = await fetchWithFallback<Paginated<AdminDriverRow>>('/admin/drivers?limit=100', {
    data: [],
    meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
  });

  return <DriversClient initial={res.data} />;
}
