import { ShopsClient } from '@/components/pages/ShopsClient';
import { demoShops } from '@/lib/demo-data';
import { fetchWithFallback } from '@/lib/api-server';
import type { AdminShopRow, Paginated } from '@/lib/types';

export default async function ShopsPage() {
  const res = await fetchWithFallback<Paginated<AdminShopRow>>('/admin/shops?limit=100', {
    data: demoShops,
    meta: { total: demoShops.length, page: 1, limit: 100, totalPages: 1 },
  });

  return <ShopsClient initial={res.data} />;
}
