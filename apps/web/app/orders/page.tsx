'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@lefrig/ui/client';
import { AppIcon } from '@/components/AppIcon';
import { unwrapPaginated } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';
import type { PaginatedResponse } from '@lefrig/shared';

type OrderItem = { id: string; name: string; quantity: number; unitPrice: number | string; subtotal: number | string };
type Order = {
  id: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number | string;
  createdAt: string;
  notes?: string;
  shop?: { name: string; slug?: string; ownerId?: string };
  items?: OrderItem[];
};

const DISPUTE_REASONS = ['not_received', 'not_as_described', 'payment_issue', 'fraud', 'other'] as const;

const DATE_LOCALE = { es: 'es-ES', ar: 'ar-MA', en: 'en-GB', fr: 'fr-FR' } as const;

export default function OrdersPage() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const { authFetch, isSignedIn, isLoaded } = useAuthFetch();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState<string>('not_received');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [disputing, setDisputing] = useState(false);

  const statusLabel = (status: string) => {
    const key = `orders.status.${status}` as 'orders.status.pending';
    const label = t(key);
    return label === key ? status : label;
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      setOrders([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    authFetch<PaginatedResponse<Order>>('/orders')
      .then((res) => {
        if (!cancelled) setOrders(unwrapPaginated(res));
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authFetch, isLoaded, isSignedIn]);

  const openOrder = async (order: Order) => {
    try {
      const detail = await authFetch<Order>(`/orders/${order.id}`);
      setSelected(detail);
      setShowDispute(false);
      setDisputeDesc('');
    } catch {
      setSelected(order);
    }
  };

  const openDispute = async () => {
    if (!selected?.shop?.ownerId || disputeDesc.trim().length < 10) return;
    setDisputing(true);
    try {
      await authFetch('/disputes', {
        method: 'POST',
        body: JSON.stringify({
          reason: disputeReason,
          description: disputeDesc.trim(),
          respondentId: selected.shop.ownerId,
          orderId: selected.id,
        }),
      });
      router.push('/disputes');
    } finally {
      setDisputing(false);
    }
  };

  const cancelOrder = async () => {
    if (!selected || selected.status !== 'pending') return;
    setCancelling(true);
    try {
      await authFetch(`/orders/${selected.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const updated = await authFetch<Order>(`/orders/${selected.id}`);
      setSelected(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o)));
    } finally {
      setCancelling(false);
    }
  };

  const paymentLabel = (method: string) =>
    method === 'cash' ? t('common.cashOnReceive') : method;

  return (
    <>
      <section className="lf-page-hero">
        <div className="lf-page-hero-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <AppIcon name="package" size={36} color="var(--lf-gold)" />
            <div>
              <h1 className="lf-page-title" style={{ margin: 0 }}>{t('orders.title')}</h1>
              <p className="lf-page-sub" style={{ margin: '4px 0 0' }}>{t('orders.sub')}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="lf-page-body" style={{ maxWidth: 800 }}>
        {!isLoaded || loading ? (
          <p style={{ color: 'var(--lf-text-muted)' }}>{t('orders.loading')}</p>
        ) : !isSignedIn ? (
          <Card padding="lg">
            <p style={{ margin: 0, color: 'var(--lf-text-muted)' }}>
              <Link href="/sign-in?redirect_url=/orders" style={{ color: 'var(--lf-gold)', fontWeight: 600 }}>
                {t('nav.signIn')}
              </Link>
            </p>
          </Card>
        ) : orders.length === 0 ? (
          <Card padding="lg">
            <p style={{ margin: 0, color: 'var(--lf-text-muted)' }}>
              {t('orders.emptyPrefix')}{' '}
              <Link href="/shops" style={{ color: 'var(--lf-gold)', fontWeight: 600 }}>
                {t('orders.exploreShops')}
              </Link>
              .
            </p>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => openOrder(order)}
                style={{
                  textAlign: 'left',
                  padding: 18,
                  borderRadius: 16,
                  border: selected?.id === order.id ? '2px solid var(--lf-gold)' : '1px solid rgba(255,255,255,0.06)',
                  background: 'var(--lf-surface)',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{order.shop?.name ?? t('orders.defaultShopName')}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--lf-text-muted)', marginTop: 4 }}>
                      {new Date(order.createdAt).toLocaleDateString(DATE_LOCALE[locale], {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 8,
                      background: 'rgba(52,211,153,0.12)',
                      color: 'var(--lf-emerald)',
                    }}
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>
                <div style={{ color: 'var(--lf-emerald)', fontWeight: 800, marginTop: 10, fontSize: '1.1rem' }}>
                  {Number(order.totalAmount).toLocaleString()} {t('common.currency')}
                </div>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <Card padding="lg" style={{ marginTop: 32 }}>
            <h2 className="lf-page-title" style={{ fontSize: '1.25rem', marginTop: 0 }}>
              {selected.shop?.name ?? t('orders.detailTitle')}
            </h2>
            <p style={{ color: 'var(--lf-text-muted)', margin: '0 0 16px' }}>
              {t('orders.ref', {
                ref: selected.id.slice(0, 8).toUpperCase(),
                status: statusLabel(selected.status),
              })}
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--lf-emerald)', margin: '0 0 20px' }}>
              {Number(selected.totalAmount).toLocaleString()} {t('common.currency')}
            </p>
            <p style={{ margin: '0 0 20px', color: 'var(--lf-text-muted)' }}>
              {t('orders.payment', {
                method: paymentLabel(selected.paymentMethod),
                extra: selected.paymentStatus ? ` · ${selected.paymentStatus}` : '',
              })}
            </p>

            {(selected.items ?? []).length > 0 && (
              <>
                <h3 style={{ marginBottom: 12 }}>{t('orders.items')}</h3>
                <div style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
                  {selected.items!.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span style={{ fontWeight: 700 }}>
                        {Number(item.subtotal ?? item.unitPrice).toLocaleString()} {t('common.currency')}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selected.notes && (
              <p style={{ color: 'var(--lf-text-muted)', marginBottom: 20 }}>
                <strong>{t('orders.notes')}</strong> {selected.notes}
              </p>
            )}

            {selected.status === 'pending' && (
              <Button variant="secondary" onClick={cancelOrder} disabled={cancelling}>
                {cancelling ? t('orders.cancelling') : t('orders.cancel')}
              </Button>
            )}

            {['confirmed', 'in_transit', 'delivered', 'accepted'].includes(selected.status) && selected.shop?.ownerId && (
              <div style={{ marginTop: 20 }}>
                {!showDispute ? (
                  <Button variant="secondary" onClick={() => setShowDispute(true)}>
                    {t('orders.openDispute')}
                  </Button>
                ) : (
                  <div style={{ display: 'grid', gap: 12 }}>
                    <select
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'var(--lf-surface)',
                        color: 'inherit',
                      }}
                    >
                      {DISPUTE_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {t(`orders.disputeReasons.${r}`)}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={disputeDesc}
                      onChange={(e) => setDisputeDesc(e.target.value)}
                      placeholder={t('orders.disputeDescPlaceholder')}
                      rows={4}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'var(--lf-surface)',
                        color: 'inherit',
                        resize: 'vertical',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button onClick={openDispute} disabled={disputing || disputeDesc.trim().length < 10}>
                        {disputing ? t('orders.sendingDispute') : t('orders.sendDispute')}
                      </Button>
                      <Button variant="secondary" onClick={() => setShowDispute(false)}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        <p style={{ marginTop: 32, textAlign: 'center', display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/disputes" style={{ color: 'var(--lf-gold)', fontWeight: 600 }}>
            {t('orders.myDisputesLink')}
          </Link>
        </p>
      </div>
    </>
  );
}
