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
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useT } from '@/lib/locale';
import { useAuthApi } from '@/lib/useAuthApi';
import {
  loadPendingCashAgreement,
  clearPendingCashAgreement,
  type PendingCashAgreement,
} from '@/lib/cash-session';
import { theme, radii } from '@/lib/theme';
import { fonts, space, ui } from '@/lib/ui';
import { Hero, Button, EmptyState } from '@/components/ui';

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
    <View style={ui.screen}>
      <Hero title={t('cash.title')} subtitle={t('cash.subtitle')} kicker={t('me.modules.cash')} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {banner?.pin ? (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>{banner.operationCode}</Text>
            {bannerListingName ? <Text style={styles.bannerListing}>{bannerListingName}</Text> : null}
            <Text style={styles.bannerPin}>PIN: {banner.pin}</Text>
            <Text style={styles.bannerHint}>{t('cash.sellerPinHint')}</Text>
          </View>
        ) : null}

        <Text style={styles.section}>{t('cash.confirmDelivery')}</Text>
        <Text style={styles.hint}>{t('cash.buyerPinHint')}</Text>
        <TextInput
          style={ui.input}
          value={lookupCode}
          onChangeText={setLookupCode}
          placeholder="CASH-XXXX"
          placeholderTextColor={theme.inkSoft}
          autoCapitalize="characters"
        />
        <TextInput
          style={[ui.input, { marginTop: 10 }]}
          value={pin}
          onChangeText={setPin}
          placeholder={t('cash.pinPlaceholder')}
          placeholderTextColor={theme.inkSoft}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
        />
        <View style={{ marginTop: 14 }}>
          <Button label={t('cash.confirmPin')} loading={confirming} onPress={() => void confirm()} fullWidth />
        </View>

        <Text style={styles.section}>{t('cash.myOps')}</Text>
        {loading ? (
          <ActivityIndicator color={theme.dune} />
        ) : agreements.length === 0 ? (
          <EmptyState
            icon="dollar-sign"
            title={t('cash.emptyOps')}
            actionLabel={t('marketplace.mine.browse')}
            onAction={() => router.push('/marketplace')}
          />
        ) : (
          agreements.map((a) => (
            <Pressable key={a.id} style={styles.card} onPress={() => setLookupCode(a.operationCode)}>
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
  content: { padding: space.lg, paddingBottom: 120, gap: 4 },
  banner: {
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: theme.warningSoft,
    borderWidth: 1,
    borderColor: 'rgba(168,132,45,0.35)',
    marginBottom: 12,
  },
  bannerTitle: { fontFamily: fonts.bodyBold, color: theme.ink, letterSpacing: 1 },
  bannerListing: { marginTop: 6, color: theme.inkMuted, fontSize: 14, fontFamily: fonts.body },
  bannerPin: {
    fontSize: 28,
    fontFamily: fonts.display,
    color: theme.oasisDeep,
    marginTop: 8,
    letterSpacing: 4,
  },
  bannerHint: { marginTop: 8, fontSize: 13, color: theme.inkMuted, lineHeight: 18, fontFamily: fonts.body },
  section: {
    fontFamily: fonts.displaySemi,
    fontSize: 18,
    color: theme.ink,
    marginBottom: 8,
    marginTop: 16,
  },
  hint: { fontFamily: fonts.body, fontSize: 13, color: theme.inkMuted, marginBottom: 12, lineHeight: 18 },
  card: {
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 10,
  },
  code: { fontFamily: fonts.bodyBold, color: theme.dune, letterSpacing: 0.5 },
  cardTitle: { fontFamily: fonts.bodySemi, color: theme.ink, marginTop: 4 },
  amount: { fontFamily: fonts.body, color: theme.inkMuted, marginTop: 4, fontSize: 13 },
  receiptBtn: { marginTop: 10, alignSelf: 'flex-start' },
  receiptBtnText: { fontFamily: fonts.bodyBold, color: theme.oasisDeep },
});
