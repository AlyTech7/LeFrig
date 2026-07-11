import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { useT } from '@/lib/locale';
import { fetchWithMeta, mapApiNeed, type NeedItem } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, gradients } from '@/lib/theme';

type NeedOffer = {
  id: string;
  message: string;
  priceEstimate?: number | null;
  offerer: { displayName: string };
};

type NeedDetail = NeedItem & { offers?: NeedOffer[] };

const TYPE_KEYS: Record<string, string> = {
  product: 'nav.marketplace',
  service: 'nav.services',
  transport: 'nav.transport',
  job: 'nav.jobs',
  tindouf: 'transport.tindouf',
};

export default function NeedDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { authFetch, syncUser } = useAuthApi();
  const [need, setNeed] = useState<NeedDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [offering, setOffering] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchWithMeta<Record<string, unknown>>(`/needs/${id}`, {} as never).then((res) => {
      const mapped = mapApiNeed(res.data);
      const offers = (res.data.offers as NeedOffer[] | undefined) ?? [];
      setNeed({ ...mapped, offers });
      setLoading(false);
    });
  }, [id]);

  const offerHelp = async () => {
    if (!id) return;
    setOffering(true);
    try {
      await syncUser();
      await authFetch(`/needs/${id}/offers`, {
        method: 'POST',
        body: JSON.stringify({ message: t('messages.placeholder') }),
      });
      Alert.alert(t('common.success'), t('needs.offer'));
      const refreshed = await authFetch<Record<string, unknown>>(`/needs/${id}`);
      const mapped = mapApiNeed(refreshed);
      setNeed({ ...mapped, offers: (refreshed.offers as NeedOffer[]) ?? [] });
    } catch {
      Alert.alert(t('common.error'), t('report.error'));
    } finally {
      setOffering(false);
    }
  };

  if (loading || !need) {
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
            <Text style={styles.backText}>{t('needs.title')}</Text>
          </Pressable>
          <Text style={styles.title}>{need.title}</Text>
          <Text style={styles.meta}>
            {TYPE_KEYS[need.type] ? t(TYPE_KEYS[need.type]) : need.type} · {need.campName}
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.desc}>{need.description}</Text>
        {need.requesterName ? (
          <Text style={styles.requester}>{need.requesterName}</Text>
        ) : null}

        <Pressable style={[styles.cta, offering && styles.ctaDisabled]} onPress={offerHelp} disabled={offering}>
          {offering ? (
            <ActivityIndicator color={theme.text} />
          ) : (
            <>
              <AppIcon name="heart" size={18} color={theme.text} />
              <Text style={styles.ctaText}>{t('needs.offer')}</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.sectionTitle}>{need.offersCount}</Text>
        {(need.offers ?? []).length === 0 ? (
          <Text style={styles.emptyOffers}>{t('needs.empty')}</Text>
        ) : (
          (need.offers ?? []).map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <Text style={styles.offerName}>{offer.offerer.displayName}</Text>
              <Text style={styles.offerMsg}>{offer.message}</Text>
              {offer.priceEstimate != null ? (
                <Text style={styles.offerPrice}>
                  ~{Number(offer.priceEstimate).toLocaleString()} {t('common.currency')}
                </Text>
              ) : null}
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
  header: { paddingBottom: 24 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 8 },
  backText: { color: theme.text, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: theme.text, paddingHorizontal: 20, marginTop: 12 },
  meta: { fontSize: 14, color: theme.gold, paddingHorizontal: 20, marginTop: 6, fontWeight: '600' },
  content: { padding: 20, paddingBottom: 40 },
  desc: { fontSize: 16, lineHeight: 24, color: theme.textDarkMuted },
  requester: { fontSize: 15, color: theme.textDarkMuted, marginTop: 16 },
  cta: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: theme.emeraldDeep,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 56,
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: { color: theme.text, fontSize: 17, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.textDark, marginTop: 28, marginBottom: 12 },
  emptyOffers: { color: theme.textDarkMuted, fontSize: 14 },
  offerCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  offerName: { fontWeight: '700', color: theme.emeraldDeep, marginBottom: 4 },
  offerMsg: { color: theme.textDark, lineHeight: 20 },
  offerPrice: { marginTop: 6, fontWeight: '600', color: theme.gold },
});
