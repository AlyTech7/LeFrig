import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useT } from '@/lib/locale';
import { useAuthApi } from '@/lib/useAuthApi';
import {
  loadPendingCashAgreement,
  clearPendingCashAgreement,
  type PendingCashAgreement,
} from '@/lib/cash-session';
import { theme, gradients } from '@/lib/theme';

type CashAgreement = {
  id: string;
  operationCode: string;
  amount: number | string;
  status: string;
  listing?: { title: string };
  pin?: string;
  hasReceipt?: boolean;
  confirmationCount?: number;
  myConfirmed?: boolean;
};

type ReceiptPayload = {
  shareText: string;
  operationCode: string;
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
  const [pending, setPending] = useState<PendingCashAgreement | null>(null);

  const refresh = useCallback(async () => {
    const list = await authFetch<CashAgreement[]>('/cash/my');
    setAgreements(list);
  }, [authFetch]);

  useEffect(() => {
    (async () => {
      const stored = await loadPendingCashAgreement();
      if (stored) {
        setPending(stored);
        setLookupCode(stored.operationCode);
      }
      try {
        await refresh();
      } catch {
        setAgreements([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  const confirm = async () => {
    if (!lookupCode.trim() || pin.length < 4) {
      Alert.alert(t('common.error'), t('publish.completeRequired'));
      return;
    }
    setConfirming(true);
    try {
      const res = await authFetch<{ fullyConfirmed?: boolean }>('/cash/confirm', {
        method: 'POST',
        body: JSON.stringify({ operationCode: lookupCode.trim().toUpperCase(), pin }),
      });
      Alert.alert(
        t('common.success'),
        res.fullyConfirmed ? t('cash.fullyConfirmed') : t('cash.success'),
      );
      setPin('');
      await refresh();
      if (res.fullyConfirmed) await clearPendingCashAgreement();
      setPending(null);
    } catch {
      Alert.alert(t('common.error'), t('cash.pinFail'));
    } finally {
      setConfirming(false);
    }
  };

  const shareReceipt = async (code: string) => {
    try {
      const receipt = await authFetch<ReceiptPayload>(`/cash/receipt/${code}`);
      await Clipboard.setStringAsync(receipt.shareText);
      await Share.share({ message: receipt.shareText });
      Alert.alert(t('common.success'), t('cash.receiptCopied'));
    } catch {
      Alert.alert(t('common.error'), t('cash.notFound'));
    }
  };

  const banner = pending ?? agreements.find((a) => a.pin && a.status === 'agreed');
  const bannerTitle = banner && 'listingTitle' in banner ? banner.listingTitle : undefined;
  const bannerListingName =
    bannerTitle ?? (banner && 'listing' in banner ? banner.listing?.title : undefined);

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.gold]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.title}>{t('cash.title')}</Text>
          <Text style={styles.sub}>{t('cash.subtitle')}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {banner?.pin ? (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>{banner.operationCode}</Text>
            {bannerListingName ? (
              <Text style={styles.bannerListing}>{bannerListingName}</Text>
            ) : null}
            <Text style={styles.bannerPin}>PIN: {banner.pin}</Text>
            <Text style={styles.bannerHint}>{t('cash.sellerPinHint')}</Text>
          </View>
        ) : null}

        <Text style={styles.section}>{t('cash.confirmDelivery')}</Text>
        <Text style={styles.hint}>{t('cash.buyerPinHint')}</Text>
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
          secureTextEntry
        />
        <Pressable style={[styles.cta, confirming && styles.ctaDisabled]} onPress={confirm} disabled={confirming}>
          {confirming ? (
            <ActivityIndicator color={theme.obsidian} />
          ) : (
            <Text style={styles.ctaText}>{t('cash.confirmPin')}</Text>
          )}
        </Pressable>

        <Text style={styles.section}>{t('cash.myOps')}</Text>
        {loading ? (
          <ActivityIndicator color={theme.gold} />
        ) : agreements.length === 0 ? (
          <Pressable onPress={() => router.push('/marketplace')}>
            <Text style={styles.empty}>{t('cash.emptyOps')}</Text>
          </Pressable>
        ) : (
          agreements.map((a) => (
            <Pressable
              key={a.id}
              style={styles.card}
              onPress={() => setLookupCode(a.operationCode)}
            >
              <Text style={styles.code}>{a.operationCode}</Text>
              <Text style={styles.cardTitle}>{a.listing?.title ?? t('cash.cashOp')}</Text>
              <Text style={styles.amount}>
                {Number(a.amount).toLocaleString()} {t('common.currency')} · {a.status}
              </Text>
              {a.status === 'confirmed' && a.hasReceipt ? (
                <Pressable style={styles.receiptBtn} onPress={() => shareReceipt(a.operationCode)}>
                  <Text style={styles.receiptBtnText}>{t('cash.shareReceipt')}</Text>
                </Pressable>
              ) : null}
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
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', paddingHorizontal: 20, marginTop: 4 },
  content: { padding: 20, paddingBottom: 120 },
  banner: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(232,184,109,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(232,184,109,0.35)',
    marginBottom: 20,
  },
  bannerTitle: { fontWeight: '700', color: theme.textDark, fontFamily: 'monospace' },
  bannerListing: { marginTop: 6, color: theme.textDarkMuted, fontSize: 14 },
  bannerPin: { fontSize: 28, fontWeight: '800', color: theme.emeraldDeep, marginTop: 8, letterSpacing: 4 },
  bannerHint: { marginTop: 8, fontSize: 13, color: theme.textDarkMuted, lineHeight: 18 },
  section: { fontSize: 16, fontWeight: '800', color: theme.textDark, marginBottom: 8, marginTop: 8 },
  hint: { fontSize: 13, color: theme.textDarkMuted, marginBottom: 12, lineHeight: 18 },
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
  receiptBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(45,138,98,0.12)',
  },
  receiptBtnText: { color: theme.emeraldDeep, fontWeight: '700', fontSize: 13 },
});
