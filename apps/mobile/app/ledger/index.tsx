import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
};

export default function LedgerScreen() {
  const router = useRouter();
  const t = useT();
  const { authFetch } = useAuthApi();
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch<LedgerAccount[]>('/ledger/accounts')
      .then(setAccounts)
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, [authFetch]);

  const totalDebt = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.hero]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.title}>{t('ledger.title')}</Text>
          <Text style={styles.sub}>{t('ledger.fiado')}</Text>
          {accounts.length > 0 && (
            <Text style={styles.total}>
              {totalDebt.toLocaleString()} {t('common.currency')}
            </Text>
          )}
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={theme.gold} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyWrap}>
              <AppIcon name="book-open" size={32} color={theme.textDarkMuted} />
              <Text style={styles.emptyTitle}>{t('ledger.noMovements')}</Text>
              <Text style={styles.emptySub}>{t('payment.fiado')}</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/ledger/${item.id}`)}>
            <View style={styles.iconWrap}>
              <AppIcon name="book-open" size={20} color={theme.emeraldDeep} />
            </View>
            <View style={styles.info}>
              <Text style={styles.shop}>{item.shop?.name ?? t('ledger.account')}</Text>
              <Text style={styles.meta}>
                {item.creditor?.displayName ? item.creditor.displayName : t('ledger.registerPayment')}
              </Text>
            </View>
            <View style={styles.amountCol}>
              <Text style={styles.amount}>{Number(item.balance).toLocaleString()}</Text>
              <Text style={styles.currency}>{t('common.currency')}</Text>
            </View>
            <AppIcon name="chevron-right" size={16} color={theme.textDarkMuted} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  header: { paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: theme.text, paddingHorizontal: 20, paddingTop: 8 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', paddingHorizontal: 20, marginTop: 4 },
  total: { fontSize: 20, fontWeight: '800', color: theme.gold, paddingHorizontal: 20, marginTop: 12 },
  list: { padding: 16, paddingBottom: 100 },
  emptyWrap: { alignItems: 'center', marginTop: 48, gap: 12, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: theme.textDark },
  emptySub: { fontSize: 14, color: theme.textDarkMuted, textAlign: 'center', lineHeight: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 10,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(13,148,136,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  shop: { fontSize: 16, fontWeight: '700', color: theme.textDark },
  meta: { fontSize: 13, color: theme.textDarkMuted, marginTop: 2 },
  amountCol: { alignItems: 'flex-end' },
  amount: { fontSize: 17, fontWeight: '800', color: theme.emeraldDeep },
  currency: { fontSize: 11, color: theme.textDarkMuted },
});
