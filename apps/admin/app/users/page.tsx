import { UsersClient } from '@/components/pages/UsersClient';
import { demoUsers } from '@/lib/demo-data';
import { fetchWithFallback } from '@/lib/api-server';
import type { AdminUserRow, Paginated } from '@/lib/types';

export default async function UsersPage() {
  const res = await fetchWithFallback<Paginated<AdminUserRow>>('/admin/users?limit=100', {
    data: demoUsers.map((u) => ({
      id: u.id,
      displayName: u.displayName,
      email: null,
      phone: u.phone,
      camp: u.camp,
      campId: null,
      roles: ['citizen'],
      verificationLevel: u.verificationLevel,
      reputationScore: u.reputationScore,
      isActive: true,
      createdAt: new Date().toISOString(),
    })),
    meta: { total: demoUsers.length, page: 1, limit: 100, totalPages: 1 },
  });

  return <UsersClient initial={res.data} />;
}
