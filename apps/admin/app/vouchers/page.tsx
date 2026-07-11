import { VouchersClient } from '@/components/pages/VouchersClient';
import { demoVouchers } from '@/lib/demo-data';
import { fetchWithFallback } from '@/lib/api-server';
import type { Paginated } from '@/lib/types';

type VoucherRow = {
  id: string;
  code: string;
  balance: number;
  status: string;
  program: string;
  expiresAt: string;
};

export default async function VouchersPage() {
  const res = await fetchWithFallback<Paginated<VoucherRow>>('/admin/vouchers?limit=100', {
    data: demoVouchers.map((v) => ({
      id: v.id,
      code: v.code,
      balance: v.balance,
      status: v.status,
      program: v.program,
      expiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
    })),
    meta: { total: demoVouchers.length, page: 1, limit: 100, totalPages: 1 },
  });

  return <VouchersClient initial={res.data} />;
}
