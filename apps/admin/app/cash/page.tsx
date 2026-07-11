import { CashClient } from '@/components/pages/CashClient';
import { fetchWithFallback } from '@/lib/api-server';
import type { AdminCashRow, Paginated } from '@/lib/types';

const demo: AdminCashRow[] = [
  {
    id: 'demo-cash-1',
    operationCode: 'CASH-DEMO01',
    amount: 15000,
    status: 'agreed',
    method: 'cash',
    buyer: 'Comprador demo',
    seller: 'Vendedor demo',
    listing: 'Panel solar 200W',
    confirmations: 1,
    createdAt: new Date().toISOString(),
  },
];

export default async function CashAdminPage() {
  const res = await fetchWithFallback<Paginated<AdminCashRow>>('/admin/cash/agreements?limit=100', {
    data: demo,
    meta: { total: demo.length, page: 1, limit: 100, totalPages: 1 },
  });

  return <CashClient initial={res.data} />;
}
