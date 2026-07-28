import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useAuthApi } from '@/lib/useAuthApi';
import { unwrapPaginated } from '@/lib/api';
import { useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space, ui } from '@/lib/ui';
import { AppIcon } from '@/components/AppIcon';
import { Hero, EmptyState, SegmentTabs } from '@/components/ui';
import { useRouter } from 'expo-router';

type Order = {
  id: string;
  buyerId?: string;
  beneficiaryId?: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  shop?: { name: string; ownerId?: string };
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
  const { authFetch, syncUser, isSignedIn, isLoaded } = useAuthApi();
  const t = useT();
  const [orders, setOrders] = useState<Order[]>([]);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');

  const load = useCallback(async () => {
    if (!isSignedIn) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const sync = await syncUser();
      const uid =
        sync && typeof sync.user === 'object' && sync.user && 'id' in sync.user
          ? String((sync.user as { id: string }).id)
          : '';
      setUserId(uid);
      const res = await authFetch<{ data: Order[] }>('/orders?limit=50');
      const list = unwrapPaginated(res as never).map((raw: unknown) => {
        const o = raw as Order & { total?: number };
        return { ...o, totalAmount: o.total ?? o.totalAmount };
      });
      setOrders(list);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [authFetch, isSignedIn, syncUser]);

  useEffect(() => {
    if (!isLoaded) return;
    void load();
  }, [isLoaded, load]);

  const buyOrders = useMemo(
    () => orders.filter((o) => !userId || o.buyerId === userId || o.beneficiaryId === userId),
    [orders, userId],
  );
  const sellOrders = useMemo(
    () => orders.filter((o) => userId && o.shop?.ownerId === userId),
    [orders, userId],
  );
  const visible = tab === 'buy' ? buyOrders : sellOrders;

  return (
    <View style={ui.screen}>
      <Hero
        title={t('orders.title')}
        subtitle={t('orders.sub')}
        kicker={t('me.modules.orders')}
        back={false}
        right={
          <Pressable onPress={() => router.push('/shops')} hitSlop={8}>
            <Text style={styles.link}>{t('orders.exploreShops')}</Text>
          </Pressable>
        }
      />
      <View style={styles.tabs}>
        <SegmentTabs
          tabs={[
            { id: 'buy', label: t('orders.tabBuy') },
            { id: 'sell', label: t('orders.tabSell') },
          ]}
          value={tab}
          onChange={(id) => setTab(id as 'buy' | 'sell')}
        />
      </View>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={theme.dune} style={{ marginTop: 40 }} />
          ) : !isSignedIn ? (
            <EmptyState
              icon="log-in"
              title={t('me.signInPrompt')}
              actionLabel={t('nav.signIn')}
              onAction={() => router.push('/sign-in')}
            />
          ) : (
            <EmptyState
              icon="package"
              title={tab === 'buy' ? t('orders.emptyBuy') : t('orders.emptySell')}
              actionLabel={t('orders.exploreShops')}
              onAction={() => router.push('/shops')}
            />
          )
        }
        renderItem={({ item }) => {
          const statusKey = STATUS_KEYS[item.status];
          const label = statusKey ? t(statusKey) : item.status;
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/orders/${item.id}`)}>
              <View style={styles.row}>
                <Text style={styles.shop} numberOfLines={1}>
                  {item.shop?.name ?? item.listing?.title ?? t('orders.title')}
                </Text>
                <View style={styles.rowEnd}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{label}</Text>
                  </View>
                  <AppIcon name="chevron-right" size={16} color={theme.inkSoft} />
                </View>
              </View>
              <Text style={styles.ref}>
                {t('orders.ref', { ref: item.id.slice(0, 8).toUpperCase(), status: label })}
              </Text>
              <Text style={styles.total}>
                {Number(item.totalAmount).toLocaleString()} {t('orders.currency')}
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
  tabs: { paddingHorizontal: space.lg, paddingTop: space.sm },
  link: { fontFamily: fonts.bodyBold, fontSize: 12, color: theme.dune },
  list: { padding: space.lg, paddingBottom: 110 },
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
  shop: { fontFamily: fonts.bodyBold, fontSize: 16, flex: 1, color: theme.ink },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(45,138,98,0.12)',
  },
  badgeText: { color: theme.oasisDeep, fontSize: 12, fontFamily: fonts.bodyBold },
  ref: { fontFamily: fonts.body, fontSize: 12, color: theme.inkSoft, marginTop: 6 },
  total: { fontFamily: fonts.displaySemi, fontSize: 18, color: theme.oasisDeep, marginTop: 6 },
  date: { fontFamily: fonts.body, fontSize: 13, color: theme.inkMuted, marginTop: 4 },
});
