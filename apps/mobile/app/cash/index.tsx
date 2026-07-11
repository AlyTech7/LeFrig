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
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, gradients } from '@/lib/theme';

type CashAgreement = {
  id: string;
  operationCode: string;
  amount: number | string;
  status: string;
  listing?: { title: string };
  pin?: string;
};

export default function CashScreen() {
  const router = useRouter();
  const t = useT();
  const { authFetch } = useAuthApi();
  const [agreements, setAgreements] = useState<CashAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupCode, setLookupCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [banner, setBanner] = useState<CashAgreement | null>(null);

  useEffect(() => {
    authFetch<CashAgreement[]>('/cash/my')
      .then(setAgreements)
      .catch(() => setAgreements([]))
      .finally(() => setLoading(false));
  }, [authFetch]);

  const confirm = async () => {
    if (!lookupCode.trim() || pin.length < 4) {
      Alert.alert(t('common.error'), t('publish.completeRequired'));
      return;
    }
    setConfirming(true);
    try {
      await authFetch('/cash/confirm', {
        method: 'POST',
        body: JSON.stringify({ operationCode: lookupCode.trim().toUpperCase(), pin }),
      });
      Alert.alert(t('common.success'), t('cash.success'));
      setPin('');
      const updated = await authFetch<CashAgreement[]>('/cash/my');
      setAgreements(updated);
    } catch {
      Alert.alert(t('common.error'), t('auth.errors.wrongCode'));
    } finally {
      setConfirming(false);
    }
  };

  const createFromMarketplace = async () => {
    router.push('/marketplace');
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.gold]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.title}>{t('cash.title')}</Text>
          <Text style={styles.sub}>{t('payment.cash')}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {banner?.pin && (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>{banner.operationCode}</Text>
            <Text style={styles.bannerPin}>PIN: {banner.pin}</Text>
          </View>
        )}

        <Text style={styles.section}>{t('cash.confirmDelivery')}</Text>
        <TextInput
          style={styles.input}
          value={lookupCode}
          onChangeText={setLookupCode}
          placeholder="CASH-XXXX"
          placeholderTextColor={theme.textDarkMuted}
          autoCapitalize="characters"
        />
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          placeholder={t('cash.pinPlaceholder')}
          placeholderTextColor={theme.textDarkMuted}
          keyboardType="number-pad"
          maxLength={4}
        />
        <Pressable style={[styles.cta, confirming && styles.ctaDisabled]} onPress={confirm} disabled={confirming}>
          {confirming ? <ActivityIndicator color={theme.obsidian} /> : <Text style={styles.ctaText}>{t('cash.confirmPin')}</Text>}
        </Pressable>

        <Text style={styles.section}>{t('orders.title')}</Text>
        {loading ? (
          <ActivityIndicator color={theme.gold} />
        ) : agreements.length === 0 ? (
          <Pressable onPress={createFromMarketplace}>
            <Text style={styles.empty}>{t('cash.noAgreements')}</Text>
          </Pressable>
        ) : (
          agreements.map((a) => (
            <Pressable
              key={a.id}
              style={styles.card}
              onPress={() => {
                setLookupCode(a.operationCode);
                if (a.pin) setBanner(a);
              }}
            >
              <Text style={styles.code}>{a.operationCode}</Text>
              <Text style={styles.cardTitle}>{a.listing?.title ?? t('cash.title')}</Text>
              <Text style={styles.amount}>
                {Number(a.amount).toLocaleString()} {t('common.currency')} · {a.status}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  header: { paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: theme.text, paddingHorizontal: 20, paddingTop: 8 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', paddingHorizontal: 20, marginTop: 4 },
  content: { padding: 20, paddingBottom: 120 },
  banner: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(232,184,109,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(232,184,109,0.35)',
    marginBottom: 20,
  },
  bannerTitle: { fontWeight: '700', color: theme.textDark },
  bannerPin: { fontSize: 22, fontWeight: '800', color: theme.emeraldDeep, marginTop: 8 },
  section: { fontSize: 16, fontWeight: '800', color: theme.textDark, marginBottom: 12, marginTop: 8 },
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
    backgroundColor: theme.gold,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 52,
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: { fontWeight: '800', color: theme.obsidian, fontSize: 16 },
  empty: { color: theme.textDarkMuted, textAlign: 'center', marginVertical: 20 },
  card: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 10,
  },
  code: { fontFamily: 'monospace', fontWeight: '700', color: theme.gold },
  cardTitle: { fontSize: 15, fontWeight: '600', color: theme.textDark, marginTop: 4 },
  amount: { fontSize: 14, color: theme.emeraldDeep, fontWeight: '700', marginTop: 4 },
});
