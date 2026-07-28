import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from 'react-native';
import { AppIcon } from '@/components/AppIcon';
import { Hero, EmptyState, Button } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useAuthApi } from '@/lib/useAuthApi';
import { useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space, ui } from '@/lib/ui';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown> | null;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { authFetch } = useAuthApi();
  const t = useT();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await authFetch<Notification[]>('/notifications');
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authFetch]);

  useEffect(() => {
    load();
  }, [load]);

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

  const openNotification = async (item: Notification) => {
    if (!item.isRead) await markRead(item.id);
    const conversationId = item.data?.conversationId;
    const mobileHref = typeof item.data?.mobileHref === 'string' ? item.data.mobileHref : null;
    const href = typeof item.data?.href === 'string' ? item.data.href : null;

    if (item.type === 'new_message' && typeof conversationId === 'string') {
      router.push(`/messages/${conversationId}`);
      return;
    }
    if (item.type === 'driver_verified' || item.type === 'driver_revoked') {
      router.push((mobileHref || '/transport/garage') as never);
      return;
    }
    if (mobileHref?.startsWith('/')) {
      router.push(mobileHref as never);
      return;
    }
    if (href === '/me/driver') {
      router.push('/transport/garage' as never);
    }
  };

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <View style={ui.screen}>
      <Hero
        title={t('nav.notifications')}
        subtitle={unread > 0 ? t('me.modules.notificationsSub', { count: unread }) : t('me.modules.notificationsNone')}
        kicker={t('me.modules.notifications')}
        back={false}
        right={
          unread > 0 ? (
            <Button label={t('notifications.markAllRead')} variant="ghost" onPress={() => void markAllRead()} />
          ) : null
        }
      />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={theme.dune}
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={theme.dune} style={{ marginTop: 48 }} />
          ) : (
            <EmptyState icon="bell" title={t('notifications.empty')} />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, !item.isRead && styles.rowUnread]}
            onPress={() => void openNotification(item)}
          >
            <View style={styles.dotWrap}>
              {!item.isRead ? <View style={styles.dot} /> : <AppIcon name="bell" size={16} color={theme.inkSoft} />}
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, paddingBottom: 110 },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 8,
  },
  rowUnread: {
    borderColor: 'rgba(168,132,45,0.35)',
    backgroundColor: 'rgba(168,132,45,0.06)',
  },
  dotWrap: { width: 24, alignItems: 'center', paddingTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.dune },
  info: { flex: 1 },
  title: { fontFamily: fonts.bodyBold, fontSize: 15, color: theme.ink },
  body: { fontFamily: fonts.body, fontSize: 13, color: theme.inkMuted, marginTop: 2 },
  date: { fontFamily: fonts.body, fontSize: 11, color: theme.inkSoft, marginTop: 6 },
});
