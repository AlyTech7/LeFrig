'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, colors } from '@lefrig/ui/client';
import { AppIcon } from '@/components/AppIcon';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useT } from '@/lib/locale';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
};

export default function NotificationsPage() {
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthFetch();
  const t = useT();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    authFetch<Notification[]>('/notifications')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [authFetch, isSignedIn, router]);

  const markAllRead = async () => {
    try {
      await authFetch('/notifications/read-all', { method: 'PATCH' });
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      /* ignore */
    }
  };

  const markRead = async (id: string) => {
    try {
      await authFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      /* ignore */
    }
  };

  const openNotification = async (n: Notification) => {
    if (!n.isRead) await markRead(n.id);
    const conversationId = n.data?.conversationId;
    const href = typeof n.data?.href === 'string' ? n.data.href : null;

    if (n.type === 'new_message' && typeof conversationId === 'string') {
      router.push(`/messages/${conversationId}`);
      return;
    }
    if (n.type === 'driver_verified' || n.type === 'driver_revoked') {
      router.push(href || '/me/driver');
      return;
    }
    if (href?.startsWith('/')) {
      router.push(href);
    }
  };

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <>
      <section className="lf-page-hero">
        <div className="lf-page-hero-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="lf-hero-badge" style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <AppIcon name="bell" size={16} color="var(--lf-gold)" />
                {t('notifications.title')}
              </div>
              <h1 className="lf-page-title">{t('notifications.inbox')}</h1>
              <p className="lf-page-sub">
                {unread > 0 ? t('notifications.unread', { count: unread }) : t('notifications.allCaughtUp')}
              </p>
            </div>
            {unread > 0 && (
              <Button variant="outline" onClick={markAllRead}>
                {t('notifications.markAllRead')}
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="lf-page-body" style={{ maxWidth: 720 }}>
        {loading ? (
          <p style={{ color: colors.gray[500] }}>{t('common.loading')}</p>
        ) : items.length === 0 ? (
          <Card padding="lg">
            <p style={{ margin: 0, color: colors.gray[600] }}>
              {t('notifications.emptyDetail')}
            </p>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {items.map((n) => (
              <Card
                key={n.id}
                padding="md"
                style={{
                  opacity: n.isRead ? 0.75 : 1,
                  borderLeft: n.isRead ? undefined : `4px solid ${colors.deepGreen[500]}`,
                  cursor: 'pointer',
                }}
                onClick={() => openNotification(n)}
              >
                <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 700, color: colors.deepGreen[500], textTransform: 'uppercase' }}>
                  {t(`notifications.types.${n.type}` as 'notifications.types.new_message') ===
                  `notifications.types.${n.type}`
                    ? n.type.replace(/_/g, ' ')
                    : t(`notifications.types.${n.type}` as 'notifications.types.new_message')}
                </p>
                <strong>{n.title}</strong>
                <p style={{ margin: '6px 0 0', color: colors.gray[600], lineHeight: 1.5 }}>{n.body}</p>
                <p style={{ margin: '10px 0 0', fontSize: '0.8rem', color: colors.gray[400] }}>
                  {new Date(n.createdAt).toLocaleString('es-ES')}
                </p>
              </Card>
            ))}
          </div>
        )}

        <p style={{ marginTop: 32, textAlign: 'center' }}>
          <Link href="/messages" style={{ color: colors.deepGreen[600], fontWeight: 600 }}>
            {t('notifications.goToMessages')}
          </Link>
        </p>
      </div>
    </>
  );
}
