import { OrdersClient } from '@/components/pages/OrdersClient';
import { demoOrders } from '@/lib/demo-data';
import { fetchWithFallback } from '@/lib/api-server';
import type { AdminOrderRow, Paginated } from '@/lib/types';

export default async function OrdersPage() {
  const res = await fetchWithFallback<Paginated<AdminOrderRow>>('/admin/orders?limit=100', {
    data: demoOrders.map((o) => ({
      id: o.id,
      shop: o.shop,
      camp: o.camp,
      buyer: '—',
      total: o.total,
      currency: 'DURU',
      status: o.status,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    })),
    meta: { total: demoOrders.length, page: 1, limit: 100, totalPages: 1 },
  });

  return <OrdersClient initial={res.data} />;
}
