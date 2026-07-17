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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '@/components/AppIcon';
import { useRouter } from 'expo-router';
import { useAuthApi } from '@/lib/useAuthApi';
import { useLocale, useT } from '@/lib/locale';
import { theme, gradients } from '@/lib/theme';

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
  const { dir } = useLocale();
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
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.hero]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.title, dir === 'rtl' && styles.rtl]}>{t('notifications.title')}</Text>
              <Text style={[styles.sub, dir === 'rtl' && styles.rtl]}>
                {unread > 0 ? t('notifications.unread', { count: unread }) : t('notifications.allCaughtUp')}
              </Text>
            </View>
            {unread > 0 && (
              <Pressable style={styles.markBtn} onPress={markAllRead}>
                <Text style={styles.markText}>{t('notifications.markRead')}</Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.gold} />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={theme.gold} style={{ marginTop: 48 }} />
          ) : (
            <View style={styles.emptyWrap}>
              <AppIcon name="bell" size={32} color={theme.textDarkMuted} />
              <Text style={styles.empty}>{t('notifications.empty')}</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !item.isRead && styles.cardUnread]}
            onPress={() => openNotification(item)}
          >
            <Text style={styles.type}>{item.type.replace(/_/g, ' ')}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.time}>
              {new Date(item.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  header: { paddingBottom: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: { fontSize: 24, fontWeight: '800', color: theme.text },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  sub: { fontSize: 14, color: theme.textMuted, marginTop: 4 },
  markBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(232,184,109,0.4)',
  },
  markText: { color: theme.gold, fontWeight: '700', fontSize: 13 },
  list: { padding: 16, paddingBottom: 100 },
  emptyWrap: { alignItems: 'center', marginTop: 48, gap: 12 },
  empty: { color: theme.textDarkMuted },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: theme.emeraldDeep },
  type: { fontSize: 11, fontWeight: '700', color: theme.emeraldDeep, textTransform: 'uppercase' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.textDark, marginTop: 4 },
  body: { fontSize: 14, color: theme.textDarkMuted, marginTop: 6, lineHeight: 20 },
  time: { fontSize: 12, color: theme.gray500, marginTop: 10 },
});
