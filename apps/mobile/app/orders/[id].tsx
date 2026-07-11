import { useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { useT } from '@/lib/locale';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, gradients } from '@/lib/theme';

type OrderItem = { id: string; name: string; quantity: number; unitPrice: number | string; subtotal: number | string };
type OrderDetail = {
  id: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number | string;
  createdAt: string;
  notes?: string;
  shop?: { name: string; ownerId?: string };
  items?: OrderItem[];
};

const disputeReasonKeys = [
  { value: 'not_received', labelKey: 'disputes.reasons.notReceived' },
  { value: 'not_as_described', labelKey: 'disputes.reasons.wrongItem' },
  { value: 'payment_issue', labelKey: 'payment.cash' },
  { value: 'fraud', labelKey: 'moderation.reasons.scam' },
  { value: 'other', labelKey: 'disputes.reasons.other' },
] as const;

const STATUS_KEYS: Record<string, string> = {
  pending: 'orders.status.pending',
  confirmed: 'orders.status.confirmed',
  in_transit: 'orders.status.confirmed',
  delivered: 'orders.status.delivered',
  cancelled: 'orders.status.cancelled',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { authFetch } = useAuthApi();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState<string>('not_received');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [disputing, setDisputing] = useState(false);

  useEffect(() => {
    if (!id) return;
    authFetch<OrderDetail>(`/orders/${id}`)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id, authFetch]);

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

  const cancel = async () => {
    if (!order || order.status !== 'pending') return;
    setCancelling(true);
    try {
      await authFetch(`/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const updated = await authFetch<OrderDetail>(`/orders/${order.id}`);
      setOrder(updated);
    } catch {
      Alert.alert(t('common.error'), t('orders.cancel'));
    } finally {
      setCancelling(false);
    }
  };

  if (loading || !order) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={theme.gold} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const label = STATUS_KEYS[order.status] ? t(STATUS_KEYS[order.status]) : order.status;

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.hero]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <AppIcon name="arrow-left" size={20} color={theme.text} />
            <Text style={styles.backText}>{t('orders.title')}</Text>
          </Pressable>
          <Text style={styles.title}>{order.shop?.name ?? t('orders.title')}</Text>
          <Text style={styles.sub}>
            REF: {order.id.slice(0, 8).toUpperCase()} · {label}
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.total}>{Number(order.totalAmount).toLocaleString()} MRU</Text>
        <Text style={styles.meta}>
          {new Date(order.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
        <Text style={styles.meta}>
          Pago: {order.paymentMethod === 'cash' ? t('payment.cash') : order.paymentMethod}
        </Text>

        {(order.items ?? []).length > 0 && (
          <>
            <Text style={styles.section}>{t('orders.items')}</Text>
            {order.items!.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {item.name} × {item.quantity}
                </Text>
                <Text style={styles.itemPrice}>{Number(item.subtotal ?? item.unitPrice).toLocaleString()} MRU</Text>
              </View>
            ))}
          </>
        )}

        {order.notes ? <Text style={styles.notes}>Notas: {order.notes}</Text> : null}

        {order.status === 'pending' && (
          <Pressable style={[styles.cancelBtn, cancelling && styles.btnDisabled]} onPress={cancel} disabled={cancelling}>
            {cancelling ? (
              <ActivityIndicator color={theme.terracotta} />
            ) : (
              <Text style={styles.cancelText}>{t('orders.cancel')}</Text>
            )}
          </Pressable>
        )}

        {['confirmed', 'in_transit', 'delivered', 'accepted'].includes(order.status) && order.shop?.ownerId && (
          <View style={styles.disputeSection}>
            {!showDispute ? (
              <Pressable style={styles.disputeBtn} onPress={() => setShowDispute(true)}>
                <AppIcon name="shield" size={18} color={theme.gold} />
                <Text style={styles.disputeBtnText}>{t('orders.openDispute')}</Text>
              </Pressable>
            ) : (
              <>
                <Text style={styles.section}>{t('disputes.addNote')}</Text>
                <View style={styles.reasonRow}>
                  {disputeReasonKeys.map((r) => (
                    <Pressable
                      key={r.value}
                      style={[styles.reasonChip, disputeReason === r.value && styles.reasonChipActive]}
                      onPress={() => setDisputeReason(r.value)}
                    >
                      <Text style={[styles.reasonText, disputeReason === r.value && styles.reasonTextActive]}>{t(r.labelKey)}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  style={styles.disputeInput}
                  value={disputeDesc}
                  onChangeText={setDisputeDesc}
                  placeholder={t('report.detailsPlaceholder')}
                  placeholderTextColor={theme.gray500}
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.disputeActions}>
                  <Pressable
                    style={[styles.submitDispute, (disputing || disputeDesc.trim().length < 10) && styles.btnDisabled]}
                    onPress={openDispute}
                    disabled={disputing || disputeDesc.trim().length < 10}
                  >
                    {disputing ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitText}>{t('report.submit')}</Text>
                    )}
                  </Pressable>
                  <Pressable onPress={() => setShowDispute(false)}>
                    <Text style={styles.cancelLink}>{t('common.cancel')}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        )}

        <Pressable style={styles.linkRow} onPress={() => router.push('/disputes')}>
          <Text style={styles.linkText}>{t('disputes.title')} →</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  safe: { flex: 1, backgroundColor: theme.cream },
  header: { paddingBottom: 24 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 8 },
  backText: { color: theme.text, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: theme.text, paddingHorizontal: 20, marginTop: 12 },
  sub: { fontSize: 14, color: theme.textMuted, paddingHorizontal: 20, marginTop: 4 },
  content: { padding: 20, paddingBottom: 100 },
  total: { fontSize: 28, fontWeight: '800', color: theme.emeraldDeep },
  meta: { fontSize: 14, color: theme.textDarkMuted, marginTop: 8 },
  section: { fontSize: 16, fontWeight: '800', color: theme.textDark, marginTop: 24, marginBottom: 12 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  itemName: { flex: 1, fontSize: 15, color: theme.textDark, fontWeight: '600' },
  itemPrice: { fontSize: 15, fontWeight: '700', color: theme.emeraldDeep },
  notes: { fontSize: 14, color: theme.textDarkMuted, marginTop: 20, lineHeight: 20 },
  cancelBtn: {
    marginTop: 28,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(224,122,95,0.4)',
    backgroundColor: 'rgba(224,122,95,0.08)',
  },
  cancelText: { color: theme.terracotta, fontWeight: '700', fontSize: 16 },
  btnDisabled: { opacity: 0.7 },
  disputeSection: { marginTop: 28 },
  disputeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,184,109,0.35)',
    backgroundColor: 'rgba(232,184,109,0.1)',
  },
  disputeBtnText: { color: theme.gold, fontWeight: '700', fontSize: 16 },
  reasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  reasonChipActive: { borderColor: theme.gold, backgroundColor: 'rgba(232,184,109,0.15)' },
  reasonText: { fontSize: 13, color: theme.textDarkMuted, fontWeight: '600' },
  reasonTextActive: { color: theme.gold },
  disputeInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    color: theme.textDark,
    backgroundColor: theme.surface,
  },
  disputeActions: { marginTop: 16, gap: 12, alignItems: 'center' },
  submitDispute: {
    width: '100%',
    backgroundColor: theme.emeraldDeep,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelLink: { color: theme.textDarkMuted, fontWeight: '600' },
  linkRow: { marginTop: 24, alignItems: 'center' },
  linkText: { color: theme.gold, fontWeight: '700' },
});
