import { ListingsClient } from '@/components/pages/ListingsClient';
import { demoListingsAdmin } from '@/lib/demo-data';
import { fetchWithFallback } from '@/lib/api-server';
import type { AdminListingRow, Paginated } from '@/lib/types';

export default async function ListingsPage() {
  const res = await fetchWithFallback<Paginated<AdminListingRow>>('/admin/listings?limit=100&status=all', {
    data: demoListingsAdmin.map((l) => ({
      ...l,
      category: 'general',
      viewCount: 0,
      currency: 'MRU',
      createdAt: new Date().toISOString(),
    })),
    meta: { total: demoListingsAdmin.length, page: 1, limit: 100, totalPages: 1 },
  });

  return <ListingsClient initial={res.data} />;
}
