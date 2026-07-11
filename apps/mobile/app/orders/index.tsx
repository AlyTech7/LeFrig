import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthApi } from '@/lib/useAuthApi';
import { unwrapPaginated } from '@/lib/api';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { AppIcon } from '@/components/AppIcon';
import { useRouter } from 'expo-router';

type Order = {
  id: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  shop?: { name: string };
  listing?: { title: string };
};

const STATUS_KEYS: Record<string, string> = {
  pending: 'orders.status.pending',
  confirmed: 'orders.status.confirmed',
  in_transit: 'orders.status.confirmed',
  delivered: 'orders.status.delivered',
  cancelled: 'orders.status.cancelled',
  disputed: 'orders.status.disputed',
};

export default function OrdersScreen() {
  const router = useRouter();
  const { authFetch } = useAuthApi();
  const t = useT();
  const { dir } = useLocale();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch<{ data: Order[]; meta?: unknown }>('/orders')
      .then((res) => {
        const list = unwrapPaginated(res as never).map((raw: unknown) => {
          const o = raw as Order & { total?: number };
          return { ...o, totalAmount: o.total ?? o.totalAmount };
        });
        setOrders(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [authFetch]);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={[styles.title, dir === 'rtl' && styles.rtl]}>{t('orders.title')}</Text>
        <Text style={[styles.sub, dir === 'rtl' && styles.rtl]}>{t('orders.sub')}</Text>
      </SafeAreaView>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={theme.dune} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyWrap}>
              <AppIcon name="package" size={32} color={theme.inkSoft} />
              <Text style={styles.empty}>{t('orders.empty')}</Text>
              <Pressable style={styles.browseBtn} onPress={() => router.push('/marketplace')}>
                <Text style={styles.browseText}>{t('orders.browseMarket')}</Text>
              </Pressable>
            </View>
          )
        }
        renderItem={({ item }) => {
          const statusKey = STATUS_KEYS[item.status];
          const label = statusKey ? t(statusKey) : item.status;
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/orders/${item.id}`)}>
              <View style={styles.row}>
                <Text style={styles.shop}>{item.shop?.name ?? item.listing?.title ?? t('orders.title')}</Text>
                <View style={styles.rowEnd}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{label}</Text>
                  </View>
                  <AppIcon name="chevron-right" size={16} color={theme.inkSoft} />
                </View>
              </View>
              <Text style={styles.total}>
                {Number(item.totalAmount).toLocaleString()} {t('common.currency')}
              </Text>
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: { fontSize: 26, fontWeight: '800', color: theme.ink },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  sub: { fontSize: 14, color: theme.inkMuted, marginTop: 4 },
  list: { padding: 20, paddingBottom: 100 },
  emptyWrap: { alignItems: 'center', marginTop: 48, gap: 12 },
  empty: { color: theme.inkMuted, fontSize: 15 },
  browseBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: theme.oasisDeep,
  },
  browseText: { color: theme.pearl, fontWeight: '800' },
  card: {
    padding: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 10,
    backgroundColor: theme.surface,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  rowEnd: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shop: { fontSize: 16, fontWeight: '700', flex: 1, color: theme.ink },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(45,138,98,0.12)' },
  badgeText: { color: theme.oasisDeep, fontSize: 12, fontWeight: '700' },
  total: { fontSize: 18, fontWeight: '800', color: theme.oasisDeep, marginTop: 8 },
  date: { fontSize: 13, color: theme.inkMuted, marginTop: 4 },
});
