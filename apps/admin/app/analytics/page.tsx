import { AnalyticsClient } from '@/components/pages/AnalyticsClient';
import { demoAnalytics } from '@/lib/demo-data';
import { fetchWithFallback } from '@/lib/api-server';
import type { AdminOverview, AnalyticsData } from '@/lib/types';

export default async function AnalyticsPage() {
  const [analytics, overview] = await Promise.all([
    fetchWithFallback<AnalyticsData>('/analytics/aggregates', demoAnalytics),
    fetchWithFallback<AdminOverview>('/admin/overview', {
      metrics: { usersCount: 1247, listingsCount: 389, ordersCount: 156, shopsCount: 42, transportCount: 18, pendingReports: 7, openDisputes: 3, pendingListings: 12, ordersLast7Days: 34 },
      campActivity: demoAnalytics.campActivity.map((c) => ({ campId: c.campId, campName: c.campName, users: c.count })),
      listingsByStatus: [{ status: 'active', count: 280 }, { status: 'pending_review', count: 45 }, { status: 'draft', count: 64 }],
      weeklyTrend: [{ label: 'Lun', count: 12 }, { label: 'Mar', count: 18 }, { label: 'Mié', count: 9 }, { label: 'Jue', count: 22 }, { label: 'Vie', count: 15 }, { label: 'Sáb', count: 28 }, { label: 'Dom', count: 11 }],
      recentActivity: [],
      recentUsers: [],
    }),
  ]);

  return <AnalyticsClient analytics={analytics} overview={overview} />;
}
