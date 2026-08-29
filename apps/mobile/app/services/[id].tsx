import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { useT } from '@/lib/locale';
import { fetchApi } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';

type ServiceDetail = {
  id: string;
  title: string;
  description?: string;
  priceFrom?: number | string;
  priceTo?: number | string;
  currency?: string;
  images?: string[];
  category?: { nameEs?: string; slug?: string };
  provider?: { id: string; displayName: string; phone?: string; reputationScore?: number };
  camps?: { camp: { nameEs: string } }[];
};

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { authFetch, isSignedIn, syncUser } = useAuthApi();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);
  const [error, setError] = useState(false);

  const reload = () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    fetchApi<ServiceDetail>(`/services/${id}`)
      .then(setService)
      .catch(() => {
        setService(null);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, [id]);

  const contact = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    if (!service?.provider?.id) return;
    setContacting(true);
    try {
      await syncUser();
      await authFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: service.provider.id,
          content: t('services.studio.chatTemplate', { title: service.title }),
          refId: service.id,
          type: 'service',
        }),
      });
      router.push('/messages');
    } catch {
      Alert.alert(t('common.error'), t('services.studio.chatError'));
    } finally {
      setContacting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color={theme.dune} style={{ marginTop: 80 }} />
      </View>
    );
  }

  if (error || !service) {
    return (
      <View style={styles.root}>
        <LinearGradient colors={['#f7f1e4', theme.canvas]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safe}>
          <Pressable style={styles.backLink} onPress={() => router.back()}>
            <AppIcon name="arrow-left" size={18} color={theme.dune} />
            <Text style={styles.backText}>{t('services.studio.detailBack')}</Text>
          </Pressable>
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyAr}>{t('services.brandAr')}</Text>
            <Text style={styles.emptyTitle}>{t('common.error')}</Text>
            <Pressable style={styles.emptyCta} onPress={reload}>
              <Text style={styles.emptyCtaText}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const camps = service.camps?.map((c) => c.camp.nameEs).filter(Boolean).join(', ') ?? '—';
  const currency = service.currency || 'DURU';
  const from = service.priceFrom != null ? Number(service.priceFrom) : NaN;
  const to = service.priceTo != null ? Number(service.priceTo) : NaN;
  const price =
    Number.isFinite(from) && from > 0
      ? Number.isFinite(to) && to > from
        ? t('services.priceRange', {
            from: from.toLocaleString(),
            to: to.toLocaleString(),
            currency,
          })
        : t('services.priceFrom', { price: from.toLocaleString(), currency })
      : t('services.studio.priceNegotiable');
  const cover = service.images?.[0];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#f7f1e4', theme.canvas, theme.canvas]}
        locations={[0, 0.22, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Pressable style={styles.backLink} onPress={() => router.back()}>
            <AppIcon name="arrow-left" size={18} color={theme.dune} />
            <Text style={styles.backText}>{t('services.studio.detailBack')}</Text>
          </Pressable>

          {cover ? (
            <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={styles.coverPlain}>
              <Text style={styles.coverGlyph}>{t('services.brandAr')}</Text>
            </View>
          )}

          <Text style={styles.kicker}>{service.category?.nameEs ?? t('services.kicker')}</Text>
          <Text style={styles.title}>{service.title}</Text>
          <View style={styles.rule} />
          <Text style={styles.price}>{price}</Text>

          <Text style={styles.section}>{t('services.studio.about')}</Text>
          <Text style={styles.desc}>{service.description?.trim() || t('services.studio.defaultDesc')}</Text>

          <Text style={styles.section}>{t('services.campsLabel')}</Text>
          <Text style={styles.meta}>{camps}</Text>

          {service.provider ? (
            <View style={styles.provider}>
              <View style={styles.providerMark}>
                <AppIcon name="user" size={18} color={theme.dune} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.providerLabel}>{t('services.providerLabel')}</Text>
                <Text style={styles.providerName}>{service.provider.displayName}</Text>
              </View>
              {service.provider.reputationScore != null ? (
                <View style={styles.rating}>
                  <AppIcon name="star" size={13} color={theme.dune} />
                  <Text style={styles.ratingText}>
                    {Number(service.provider.reputationScore).toFixed(1)}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={{ height: 100 }} />
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.ctaBar}>
          <Pressable
            style={[styles.cta, contacting && styles.ctaDisabled]}
            onPress={() => void contact()}
            disabled={contacting || !service.provider?.id}
          >
            {contacting ? (
              <ActivityIndicator color={theme.pearl} />
            ) : (
              <>
                <AppIcon name="message-circle" size={18} color={theme.pearl} />
                <Text style={styles.ctaText}>{t('services.contactProfessional')}</Text>
              </>
            )}
          </Pressable>
        </SafeAreaView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: space.lg, paddingBottom: 24 },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    marginBottom: 8,
  },
  backText: { fontFamily: fonts.bodySemi, fontSize: 14, color: theme.dune },
  cover: {
    width: '100%',
    height: 220,
    borderRadius: radii.lg,
    marginBottom: 20,
    backgroundColor: theme.sand,
  },
  coverPlain: {
    width: '100%',
    height: 160,
    borderRadius: radii.lg,
    marginBottom: 20,
    backgroundColor: 'rgba(168,132,45,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverGlyph: {
    fontFamily: fonts.display,
    fontSize: 42,
    color: 'rgba(168,132,45,0.35)',
    writingDirection: 'rtl',
  },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.dune,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    letterSpacing: -0.6,
    color: theme.ink,
    marginTop: 6,
    lineHeight: 34,
  },
  rule: {
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.dune,
    marginTop: 12,
    marginBottom: 12,
  },
  price: { fontFamily: fonts.displaySemi, fontSize: 20, color: theme.ink },
  section: {
    fontFamily: fonts.displaySemi,
    fontSize: 17,
    color: theme.ink,
    marginTop: 24,
    marginBottom: 8,
  },
  desc: { fontFamily: fonts.body, fontSize: 15, color: theme.inkMuted, lineHeight: 23 },
  meta: { fontFamily: fonts.body, fontSize: 14, color: theme.inkSoft, lineHeight: 20 },
  provider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
  },
  providerMark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(168,132,45,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.inkSoft,
  },
  providerName: { fontFamily: fonts.bodyBold, fontSize: 15, color: theme.ink, marginTop: 2 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontFamily: fonts.bodyBold, fontSize: 13, color: theme.dune },
  ctaBar: {
    paddingHorizontal: space.lg,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
    backgroundColor: theme.canvas,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.ink,
    borderRadius: radii.md,
    paddingVertical: 16,
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 16, color: theme.pearl },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyAr: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: 'rgba(168,132,45,0.28)',
    writingDirection: 'rtl',
  },
  emptyTitle: { fontFamily: fonts.displaySemi, fontSize: 22, color: theme.ink },
  emptyCta: { marginTop: 12, paddingVertical: 8 },
  emptyCtaText: { fontFamily: fonts.bodyBold, fontSize: 14, color: theme.dune },
});
