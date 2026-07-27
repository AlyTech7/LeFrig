'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppIcon } from '@/components/AppIcon';
import { unwrapPaginated } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';
import type { PaginatedResponse } from '@lefrig/shared';
import '../hub-studio.css';

type OrderItem = { id: string; name: string; quantity: number; unitPrice: number | string; subtotal: number | string };
type Order = {
  id: string;
  buyerId?: string;
  beneficiaryId?: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number | string;
  createdAt: string;
  notes?: string;
  shop?: { id?: string; name: string; slug?: string; ownerId?: string };
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
  const [userId, setUserId] = useState('');
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('not_received');
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
    (async () => {
      try {
        const sync = await authFetch<{ user?: { id?: string } }>('/auth/sync', { method: 'POST' });
        if (!cancelled) setUserId(sync.user?.id ?? '');
        const res = await authFetch<PaginatedResponse<Order>>('/orders?limit=50');
        if (!cancelled) setOrders(unwrapPaginated(res));
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authFetch, isLoaded, isSignedIn]);

  const buyOrders = useMemo(
    () =>
      orders.filter(
        (o) => !userId || o.buyerId === userId || o.beneficiaryId === userId,
      ),
    [orders, userId],
  );

  const sellOrders = useMemo(
    () => orders.filter((o) => userId && o.shop?.ownerId === userId),
    [orders, userId],
  );

  const visible = tab === 'buy' ? buyOrders : sellOrders;

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

  const patchStatus = async (status: string) => {
    if (!selected) return;
    setUpdating(true);
    try {
      await authFetch(`/orders/${selected.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const updated = await authFetch<Order>(`/orders/${selected.id}`);
      setSelected(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o)));
    } finally {
      setUpdating(false);
      setCancelling(false);
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

  const isSellerView = Boolean(userId && selected?.shop?.ownerId === userId);
  const paymentLabel = (method: string) => (method === 'cash' ? t('common.cashOnReceive') : method);

  return (
    <div className="hub-page">
      <header className="hub-hero">
        <div className="hub-hero__top">
          <Link href="/me" className="hub-back">
            <AppIcon name="arrow-left" size={16} color="var(--hub-gold)" />
            {t('orders.back')}
          </Link>
          <div className="hub-hero__actions">
            <Link href="/shops" className="hub-btn hub-btn--ghost">
              {t('orders.exploreShops')}
            </Link>
          </div>
        </div>
        <h1>{t('orders.title')}</h1>
        <p className="hub-lead">{t('orders.sub')}</p>
      </header>

      {!isLoaded || loading ? (
        <div className="hub-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="hub-skel" />
          ))}
        </div>
      ) : !isSignedIn ? (
        <div className="hub-empty">
          <p>
            <Link href="/sign-in?redirect_url=/orders" className="hub-back">
              {t('nav.signIn')}
            </Link>
          </p>
        </div>
      ) : (
        <>
          <div className="hub-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className={tab === 'buy' ? 'hub-tab hub-tab--on' : 'hub-tab'}
              onClick={() => {
                setTab('buy');
                setSelected(null);
              }}
            >
              {t('orders.tabBuy')}
            </button>
            <button
              type="button"
              role="tab"
              className={tab === 'sell' ? 'hub-tab hub-tab--on' : 'hub-tab'}
              onClick={() => {
                setTab('sell');
                setSelected(null);
              }}
            >
              {t('orders.tabSell')}
            </button>
          </div>

          {visible.length === 0 ? (
            <div className="hub-empty">
              <span className="hub-empty__icon" aria-hidden>
                📦
              </span>
              <h2>{t('orders.empty')}</h2>
              <p>{tab === 'buy' ? t('orders.emptyBuy') : t('orders.emptySell')}</p>
              <Link href={tab === 'buy' ? '/shops' : '/shops/mine'} className="hub-btn">
                {tab === 'buy' ? t('orders.exploreShops') : t('shops.mine.title')}
              </Link>
            </div>
          ) : (
            <>
              <p className="hub-count">{t('orders.countLabel', { count: visible.length })}</p>
              <div className="hub-grid">
                {visible.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    className={`hub-row-card ${selected?.id === order.id ? 'hub-row-card--on' : ''}`}
                    onClick={() => void openOrder(order)}
                  >
                    <div className="hub-row-card__top">
                      <div>
                        <strong>{order.shop?.name ?? t('orders.defaultShopName')}</strong>
                        <p className="hub-card__meta">
                          {new Date(order.createdAt).toLocaleDateString(DATE_LOCALE[locale], {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className="hub-pill">{statusLabel(order.status)}</span>
                    </div>
                    <p className="hub-card__price">
                      {Number(order.totalAmount).toLocaleString(locale === 'ar' ? 'ar' : 'es-ES')}{' '}
                      {t('orders.currency')}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}

          {selected && (
            <section className="hub-detail">
              <h2>{selected.shop?.name ?? t('orders.detailTitle')}</h2>
              <p className="hub-card__meta">
                {t('orders.ref', {
                  ref: selected.id.slice(0, 8).toUpperCase(),
                  status: statusLabel(selected.status),
                })}
              </p>
              <p className="hub-detail__price">
                {Number(selected.totalAmount).toLocaleString(locale === 'ar' ? 'ar' : 'es-ES')}{' '}
                {t('orders.currency')}
              </p>
              <p className="hub-card__meta">
                {t('orders.payment', {
                  method: paymentLabel(selected.paymentMethod),
                  extra: selected.paymentStatus ? ` · ${selected.paymentStatus}` : '',
                })}
              </p>

              {(selected.items ?? []).length > 0 && (
                <>
                  <h3 style={{ margin: '1rem 0 0.5rem', fontSize: '1rem' }}>{t('orders.items')}</h3>
                  <ul className="hub-grid" style={{ gap: '0.35rem' }}>
                    {selected.items!.map((item) => (
                      <li
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '0.55rem 0',
                          borderBottom: '1px solid var(--hub-line)',
                        }}
                      >
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <strong>
                          {Number(item.subtotal ?? item.unitPrice).toLocaleString()} {t('orders.currency')}
                        </strong>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {selected.notes ? (
                <p className="hub-card__meta" style={{ marginTop: '0.85rem' }}>
                  <strong>{t('orders.notes')}</strong> {selected.notes}
                </p>
              ) : null}

              <div className="hub-card__actions" style={{ marginTop: '1rem' }}>
                {selected.shop?.id ? (
                  <Link href={`/shops/${selected.shop.id}`} className="hub-btn hub-btn--ghost">
                    {t('orders.viewShop')}
                  </Link>
                ) : null}

                {!isSellerView && selected.status === 'pending' ? (
                  <button
                    type="button"
                    className="hub-btn hub-btn--danger"
                    disabled={cancelling || updating}
                    onClick={() => {
                      setCancelling(true);
                      void patchStatus('cancelled');
                    }}
                  >
                    {cancelling ? t('orders.cancelling') : t('orders.cancel')}
                  </button>
                ) : null}

                {isSellerView && selected.status === 'pending' ? (
                  <button
                    type="button"
                    className="hub-btn"
                    disabled={updating}
                    onClick={() => void patchStatus('confirmed')}
                  >
                    {t('orders.confirmOrder')}
                  </button>
                ) : null}

                {isSellerView && selected.status === 'confirmed' ? (
                  <button
                    type="button"
                    className="hub-btn"
                    disabled={updating}
                    onClick={() => void patchStatus('delivered')}
                  >
                    {t('orders.markDelivered')}
                  </button>
                ) : null}
              </div>

              {!isSellerView &&
                ['confirmed', 'in_transit', 'delivered', 'accepted'].includes(selected.status) &&
                selected.shop?.ownerId && (
                  <div style={{ marginTop: '1rem' }}>
                    {!showDispute ? (
                      <button type="button" className="hub-btn hub-btn--ghost" onClick={() => setShowDispute(true)}>
                        {t('orders.openDispute')}
                      </button>
                    ) : (
                      <div style={{ display: 'grid', gap: 10 }}>
                        <select
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: '1px solid var(--hub-line)',
                            background: 'var(--hub-surface)',
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
                            border: '1px solid var(--hub-line)',
                            background: 'var(--hub-surface)',
                            resize: 'vertical',
                          }}
                        />
                        <div className="hub-card__actions">
                          <button
                            type="button"
                            className="hub-btn"
                            onClick={() => void openDispute()}
                            disabled={disputing || disputeDesc.trim().length < 10}
                          >
                            {disputing ? t('orders.sendingDispute') : t('orders.sendDispute')}
                          </button>
                          <button type="button" className="hub-btn hub-btn--ghost" onClick={() => setShowDispute(false)}>
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </section>
          )}

          <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link href="/disputes" className="hub-back">
              {t('orders.myDisputesLink')}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
