import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Hero, Button, EmptyState } from '@/components/ui';
import { useT } from '@/lib/locale';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme } from '@/lib/theme';
import { fonts, space, ui } from '@/lib/ui';

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number | string;
  subtotal: number | string;
};
type OrderDetail = {
  id: string;
  buyerId?: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number | string;
  createdAt: string;
  notes?: string;
  shop?: { name: string; ownerId?: string };
  items?: OrderItem[];
};

const DISPUTE_REASONS = [
  { value: 'not_received', labelKey: 'orders.disputeReasons.not_received' },
  { value: 'not_as_described', labelKey: 'orders.disputeReasons.not_as_described' },
  { value: 'payment_issue', labelKey: 'orders.disputeReasons.payment_issue' },
  { value: 'fraud', labelKey: 'orders.disputeReasons.fraud' },
  { value: 'other', labelKey: 'orders.disputeReasons.other' },
] as const;

const STATUS_KEYS: Record<string, string> = {
  pending: 'orders.status.pending',
  confirmed: 'orders.status.confirmed',
  in_transit: 'orders.status.confirmed',
  delivered: 'orders.status.delivered',
  cancelled: 'orders.status.cancelled',
  disputed: 'orders.status.disputed',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { authFetch, syncUser } = useAuthApi();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('not_received');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [disputing, setDisputing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const sync = await syncUser();
      if (sync && typeof sync.user === 'object' && sync.user && 'id' in sync.user) {
        setUserId(String((sync.user as { id: string }).id));
      }
      const detail = await authFetch<OrderDetail>(`/orders/${id}`);
      setOrder(detail);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [authFetch, id, syncUser]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchStatus = async (status: string) => {
    if (!order) return;
    setBusy(true);
    try {
      await authFetch(`/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const updated = await authFetch<OrderDetail>(`/orders/${order.id}`);
      setOrder(updated);
    } catch {
      Alert.alert(t('common.error'), t('common.retry'));
    } finally {
      setBusy(false);
    }
  };

  const openDispute = async () => {
    if (!order?.shop?.ownerId || disputeDesc.trim().length < 10) {
      Alert.alert(t('common.error'), t('publish.completeRequired'));
      return;
    }
    setDisputing(true);
    try {
      await authFetch('/disputes', {
        method: 'POST',
        body: JSON.stringify({
          reason: disputeReason,
          description: disputeDesc.trim(),
          respondentId: order.shop.ownerId,
          orderId: order.id,
        }),
      });
      router.push('/disputes');
    } catch {
      Alert.alert(t('common.error'), t('report.error'));
    } finally {
      setDisputing(false);
    }
  };

  if (loading) {
    return (
      <View style={ui.screen}>
        <ActivityIndicator color={theme.dune} style={{ marginTop: 80 }} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={ui.screen}>
        <Hero title={t('orders.title')} />
        <EmptyState icon="alert-circle" title={t('common.error')} actionLabel={t('common.retry')} onAction={() => load()} />
      </View>
    );
  }

  const label = STATUS_KEYS[order.status] ? t(STATUS_KEYS[order.status]) : order.status;
  const isSeller = Boolean(userId && order.shop?.ownerId === userId);
  const isBuyer = Boolean(userId && order.buyerId === userId);

  return (
    <View style={ui.screen}>
      <Hero
        title={order.shop?.name ?? t('orders.title')}
        subtitle={t('orders.ref', {
          ref: order.id.slice(0, 8).toUpperCase(),
          status: label,
        })}
        kicker={t('me.modules.orders')}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.total}>
          {Number(order.totalAmount).toLocaleString()} {t('orders.currency')}
        </Text>
        <Text style={styles.meta}>
          {new Date(order.createdAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        <Text style={styles.meta}>
          {t('orders.payment', {
            method: order.paymentMethod === 'cash' ? t('common.cashOnReceive') : order.paymentMethod,
            extra: '',
          })}
        </Text>
        {order.notes ? (
          <Text style={styles.meta}>
            {t('orders.notes')} {order.notes}
          </Text>
        ) : null}

        {(order.items ?? []).length > 0 ? (
          <>
            <Text style={styles.section}>{t('orders.items')}</Text>
            {order.items!.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {item.name} × {item.quantity}
                </Text>
                <Text style={styles.itemPrice}>
                  {Number(item.subtotal).toLocaleString()} {t('orders.currency')}
                </Text>
              </View>
            ))}
          </>
        ) : null}

        {isSeller && order.status === 'pending' ? (
          <View style={styles.actions}>
            <Button
              label={t('orders.confirmOrder')}
              loading={busy}
              onPress={() => void patchStatus('confirmed')}
              fullWidth
            />
          </View>
        ) : null}
        {isSeller && (order.status === 'confirmed' || order.status === 'in_transit') ? (
          <View style={styles.actions}>
            <Button
              label={t('orders.markDelivered')}
              loading={busy}
              onPress={() => void patchStatus('delivered')}
              fullWidth
            />
          </View>
        ) : null}

        {isBuyer && order.status === 'pending' ? (
          <View style={styles.actions}>
            <Button
              label={t('orders.cancel')}
              variant="danger"
              loading={busy}
              onPress={() => void patchStatus('cancelled')}
              fullWidth
            />
          </View>
        ) : null}

        {isBuyer && ['confirmed', 'delivered', 'in_transit'].includes(order.status) ? (
          <View style={styles.actions}>
            <Button
              label={t('orders.openDispute')}
              variant="ghost"
              onPress={() => setShowDispute((v) => !v)}
              fullWidth
            />
          </View>
        ) : null}

        {showDispute ? (
          <View style={styles.dispute}>
            <Text style={styles.section}>{t('orders.openDispute')}</Text>
            {DISPUTE_REASONS.map((r) => (
              <Pressable
                key={r.value}
                style={[ui.chip, styles.reason, disputeReason === r.value && ui.chipOn]}
                onPress={() => setDisputeReason(r.value)}
              >
                <Text style={[ui.chipText, disputeReason === r.value && ui.chipTextOn]}>{t(r.labelKey)}</Text>
              </Pressable>
            ))}
            <TextInput
              style={[ui.input, styles.textArea]}
              value={disputeDesc}
              onChangeText={setDisputeDesc}
              placeholder={t('orders.disputeDescPlaceholder')}
              placeholderTextColor={theme.inkSoft}
              multiline
            />
            <Button
              label={t('orders.sendDispute')}
              loading={disputing}
              onPress={() => void openDispute()}
              fullWidth
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 48 },
  total: { fontFamily: fonts.display, fontSize: 28, color: theme.oasisDeep },
  meta: { fontFamily: fonts.body, fontSize: 14, color: theme.inkMuted, marginTop: 6 },
  section: { fontFamily: fonts.displaySemi, fontSize: 18, color: theme.ink, marginTop: 20, marginBottom: 10 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  itemName: { fontFamily: fonts.bodySemi, color: theme.ink, flex: 1, paddingRight: 8 },
  itemPrice: { fontFamily: fonts.bodyBold, color: theme.oasisDeep },
  actions: { marginTop: 20, gap: 10 },
  dispute: { marginTop: 16, gap: 8 },
  reason: { marginBottom: 6, alignSelf: 'flex-start' },
  textArea: { minHeight: 100, textAlignVertical: 'top', marginVertical: 8 },
});
