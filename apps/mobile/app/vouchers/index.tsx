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
import { useRouter } from 'expo-router';
import { useT } from '@/lib/locale';
import { fetchWithMeta } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, gradients } from '@/lib/theme';
import { AppIcon } from '@/components/AppIcon';

type Program = { id: string; name: string; description?: string };
type Voucher = {
  id: string;
  code: string;
  balance: number;
  currency: string;
  status: string;
  expiresAt?: string;
  program?: { name: string };
};

export default function VouchersScreen() {
  const router = useRouter();
  const t = useT();
  const { authFetch, isSignedIn } = useAuthApi();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [myVouchers, setMyVouchers] = useState<Voucher[]>([]);
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('500');
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    fetchWithMeta<Program[]>('/vouchers/programs', []).then((res) => {
      setPrograms(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    authFetch<Voucher[]>('/vouchers/my')
      .then(setMyVouchers)
      .catch(() => setMyVouchers([]));
  }, [authFetch, isSignedIn]);

  const redeem = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    if (!code.trim()) return;
    setRedeeming(true);
    try {
      await authFetch('/vouchers/redeem', {
        method: 'POST',
        body: JSON.stringify({ code: code.trim().toUpperCase(), amount: Number(amount) }),
      });
      Alert.alert(t('common.success'), t('vouchers.redeem'));
      setCode('');
      const updated = await authFetch<Voucher[]>('/vouchers/my');
      setMyVouchers(updated);
    } catch {
      Alert.alert(t('common.error'), t('auth.errors.wrongCode'));
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.hero]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.title}>{t('vouchers.title')}</Text>
          <Text style={styles.sub}>{t('vouchers.ong')}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>{t('vouchers.redeem')}</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="VOUCHER-XXXX"
          placeholderTextColor={theme.textDarkMuted}
          autoCapitalize="characters"
        />
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder={t('cash.cashPlaceholder')}
          placeholderTextColor={theme.textDarkMuted}
        />
        <Pressable style={[styles.cta, redeeming && styles.ctaDisabled]} onPress={redeem} disabled={redeeming}>
          {redeeming ? (
            <ActivityIndicator color={theme.text} />
          ) : (
            <Text style={styles.ctaText}>{t('vouchers.redeem')}</Text>
          )}
        </Pressable>

        <Text style={[styles.section, { marginTop: 28 }]}>{t('vouchers.ong')}</Text>
        {loading ? (
          <ActivityIndicator color={theme.gold} />
        ) : programs.length === 0 ? (
          <Text style={styles.muted}>{t('vouchers.noPrograms')}</Text>
        ) : (
          programs.map((p) => (
            <View key={p.id} style={styles.programCard}>
              <AppIcon name="tag" size={18} color={theme.emeraldDeep} />
              <View style={styles.programInfo}>
                <Text style={styles.programName}>{p.name}</Text>
                <Text style={styles.programDesc}>{p.description ?? t('vouchers.ong')}</Text>
              </View>
            </View>
          ))
        )}

        {myVouchers.length > 0 && (
          <>
            <Text style={[styles.section, { marginTop: 28 }]}>{t('vouchers.title')}</Text>
            {myVouchers.map((v) => (
              <View key={v.id} style={styles.voucherCard}>
                <Text style={styles.voucherCode}>{v.code}</Text>
                <Text style={styles.voucherBalance}>
                  {Number(v.balance).toLocaleString()} {v.currency}
                </Text>
                <Text style={styles.voucherMeta}>
                  {v.program?.name ?? t('vouchers.ong')} · {v.status}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  header: { paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: theme.text, paddingHorizontal: 20, paddingTop: 8 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', paddingHorizontal: 20, marginTop: 4 },
  content: { padding: 20, paddingBottom: 100 },
  section: { fontSize: 16, fontWeight: '800', color: theme.textDark, marginBottom: 12 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: 14,
    fontSize: 16,
    color: theme.textDark,
    marginBottom: 10,
  },
  cta: {
    backgroundColor: theme.emeraldDeep,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: { color: theme.text, fontWeight: '700', fontSize: 16 },
  muted: { color: theme.textDarkMuted },
  programCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  programInfo: { flex: 1 },
  programName: { fontSize: 16, fontWeight: '700', color: theme.textDark },
  programDesc: { fontSize: 13, color: theme.textDarkMuted, marginTop: 4, lineHeight: 18 },
  voucherCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: theme.obsidian,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(232,184,109,0.25)',
  },
  voucherCode: { fontSize: 14, fontWeight: '700', color: theme.gold, letterSpacing: 1 },
  voucherBalance: { fontSize: 24, fontWeight: '800', color: theme.text, marginTop: 6 },
  voucherMeta: { fontSize: 12, color: theme.textMuted, marginTop: 6 },
});
