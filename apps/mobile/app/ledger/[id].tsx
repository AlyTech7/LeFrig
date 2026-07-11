import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { useT } from '@/lib/locale';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, gradients } from '@/lib/theme';

type LedgerAccount = {
  id: string;
  balance: number | string;
  shop?: { name: string };
  debtor?: { displayName: string };
  creditor?: { displayName: string };
  entries?: { id?: string; description?: string; notes?: string; amount: number | string; createdAt: string; type: string }[];
};

export default function LedgerAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { authFetch } = useAuthApi();
  const [account, setAccount] = useState<LedgerAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const load = () => {
    if (!id) return;
    authFetch<LedgerAccount>(`/ledger/accounts/${id}`)
      .then(setAccount)
      .catch(() => setAccount(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const pay = async () => {
    const num = Number(amount);
    if (!num || num <= 0) {
      Alert.alert(t('common.error'), t('cash.cashPlaceholder'));
      return;
    }
    setPaying(true);
    try {
      await authFetch('/ledger/payments', {
        method: 'POST',
        body: JSON.stringify({ accountId: id, amount: num, method: 'cash', notes: t('ledger.registerPayment') }),
      });
      setAmount('');
      load();
      Alert.alert(t('common.success'), t('cash.success'));
    } catch {
      Alert.alert(t('common.error'), t('report.error'));
    } finally {
      setPaying(false);
    }
  };

  if (loading || !account) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={theme.gold} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.hero]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <AppIcon name="arrow-left" size={20} color={theme.text} />
            <Text style={styles.backText}>{t('ledger.title')}</Text>
          </Pressable>
          <Text style={styles.shopName}>{account.shop?.name ?? t('ledger.account')}</Text>
          <Text style={styles.balance}>
            {Number(account.balance).toLocaleString()} {t('common.currency')}
          </Text>
          <Text style={styles.balanceLabel}>{t('ledger.balance')}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>{t('ledger.registerPayment')}</Text>
        <View style={styles.payRow}>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder={t('cash.cashPlaceholder')}
            placeholderTextColor={theme.textDarkMuted}
          />
          <Pressable style={[styles.payBtn, paying && styles.payBtnDisabled]} onPress={pay} disabled={paying}>
            {paying ? (
              <ActivityIndicator color={theme.text} size="small" />
            ) : (
              <Text style={styles.payBtnText}>{t('common.save')}</Text>
            )}
          </Pressable>
        </View>

        <Text style={[styles.section, { marginTop: 28 }]}>{t('ledger.noMovements')}</Text>
        {(account.entries ?? []).length === 0 ? (
          <Text style={styles.empty}>{t('ledger.noMovements')}</Text>
        ) : (
          (account.entries ?? []).map((m, i) => (
            <View key={m.id ?? i} style={styles.movement}>
              <View style={{ flex: 1 }}>
                <Text style={styles.moveDesc}>{m.notes ?? m.description ?? m.type}</Text>
                <Text style={styles.moveDate}>
                  {new Date(m.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
              <Text style={[styles.moveAmount, m.type === 'payment' && styles.positive]}>
                {m.type === 'payment' ? '+' : '-'}
                {Number(m.amount).toLocaleString()} {t('common.currency')}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  safe: { flex: 1, backgroundColor: theme.cream },
  header: { paddingBottom: 28 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 8 },
  backText: { color: theme.text, fontWeight: '600' },
  shopName: { fontSize: 18, fontWeight: '700', color: theme.textMuted, paddingHorizontal: 20, marginTop: 12 },
  balance: { fontSize: 36, fontWeight: '800', color: theme.gold, paddingHorizontal: 20, marginTop: 4 },
  balanceLabel: { fontSize: 14, color: theme.textMuted, paddingHorizontal: 20, marginTop: 4 },
  content: { padding: 20, paddingBottom: 40 },
  section: { fontSize: 16, fontWeight: '800', color: theme.textDark, marginBottom: 12 },
  payRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.textDark,
  },
  payBtn: {
    backgroundColor: theme.emeraldDeep,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    minWidth: 88,
    alignItems: 'center',
  },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { color: theme.text, fontWeight: '700', fontSize: 16 },
  empty: { color: theme.textDarkMuted },
  movement: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  moveDesc: { fontSize: 15, fontWeight: '600', color: theme.textDark },
  moveDate: { fontSize: 12, color: theme.textDarkMuted, marginTop: 2 },
  moveAmount: { fontSize: 15, fontWeight: '700', color: theme.terracotta },
  positive: { color: theme.emeraldDeep },
});
