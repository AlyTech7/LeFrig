import { ServicesClient } from '@/components/pages/ServicesClient';
import { demoServicesAdmin } from '@/lib/demo-data';
import { fetchWithFallback } from '@/lib/api-server';
import type { AdminServiceRow, Paginated } from '@/lib/types';

export default async function ServicesPage() {
  const res = await fetchWithFallback<Paginated<AdminServiceRow>>('/admin/services?limit=100', {
    data: demoServicesAdmin,
    meta: { total: demoServicesAdmin.length, page: 1, limit: 100, totalPages: 1 },
  });

  return <ServicesClient initial={res.data} />;
}
