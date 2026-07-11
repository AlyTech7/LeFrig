import { DiasporaClient } from '@/components/pages/DiasporaClient';
import { fetchWithFallback } from '@/lib/api-server';
import type { AdminDiasporaRow, Paginated } from '@/lib/types';

const demo: AdminDiasporaRow[] = [
  {
    id: 'demo-dia-1',
    orderType: 'food_basket',
    description: 'Cesta básica para familia',
    budget: 5000,
    status: 'pending',
    beneficiary: 'Mamá Fatima',
    diasporaUser: 'Ahmed (España)',
    camp: 'Rabouni',
    createdAt: new Date().toISOString(),
  },
];

export default async function DiasporaPage() {
  const res = await fetchWithFallback<Paginated<AdminDiasporaRow>>('/admin/diaspora/orders?limit=100', {
    data: demo,
    meta: { total: demo.length, page: 1, limit: 100, totalPages: 1 },
  });

  return <DiasporaClient initial={res.data} />;
}
