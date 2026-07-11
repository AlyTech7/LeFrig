import { CommunityClient } from '@/components/pages/CommunityClient';
import { demoCommunityAdmin } from '@/lib/demo-data';
import { fetchWithFallback } from '@/lib/api-server';
import type { AdminCommunityRow, Paginated } from '@/lib/types';

export default async function CommunityPage() {
  const res = await fetchWithFallback<Paginated<AdminCommunityRow>>('/admin/community?limit=100', {
    data: demoCommunityAdmin.map((p) => ({ ...p, createdAt: new Date().toISOString() })),
    meta: { total: demoCommunityAdmin.length, page: 1, limit: 100, totalPages: 1 },
  });

  return <CommunityClient initial={res.data} />;
}
