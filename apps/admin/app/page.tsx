import { AdminDashboard } from '@/components/AdminDashboard';
import { AdminApiBanner } from '@/components/AdminApiBanner';
import type { AdminOverview } from '@/lib/types';
import { demoDashboard } from '@/lib/demo-data';
import { fetchWithMeta } from '@/lib/api-server';

const demoOverview: AdminOverview = {
  metrics: { ...demoDashboard, pendingListings: 12, ordersLast7Days: 34 },
  campActivity: [
    { campId: '1', campName: 'Rabouni', users: 234 },
    { campId: '2', campName: 'Smara', users: 189 },
    { campId: '3', campName: 'Tindouf', users: 156 },
    { campId: '4', campName: 'Dakhla', users: 98 },
  ],
  listingsByStatus: [
    { status: 'active', count: 389 },
    { status: 'pending_review', count: 12 },
    { status: 'draft', count: 8 },
  ],
  weeklyTrend: [
    { label: 'L', count: 4 },
    { label: 'M', count: 7 },
    { label: 'X', count: 5 },
    { label: 'J', count: 9 },
    { label: 'V', count: 11 },
    { label: 'S', count: 6 },
    { label: 'D', count: 8 },
  ],
  recentActivity: [],
  recentUsers: [],
};

export default async function AdminDashboardPage() {
  const { data: overview, fromFallback } = await fetchWithMeta<AdminOverview>('/admin/overview', demoOverview);
  return (
    <>
      <AdminApiBanner usingDemo={fromFallback} />
      <AdminDashboard overview={overview} />
    </>
  );
}
