import { TransportClient } from '@/components/pages/TransportClient';
import { demoTransport } from '@/lib/demo-data';
import { fetchWithFallback } from '@/lib/api-server';
import type { AdminTransportRow, Paginated } from '@/lib/types';

export default async function TransportPage() {
  const res = await fetchWithFallback<Paginated<AdminTransportRow & { createdAt: string }>>('/admin/transport?limit=100', {
    data: demoTransport,
    meta: { total: demoTransport.length, page: 1, limit: 100, totalPages: 1 },
  });

  return <TransportClient initial={res.data} />;
}
