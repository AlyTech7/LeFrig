import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CAMPS, findDepartmentForSlug, formatAttributeDetails, LISTING_CATEGORIES, resolveImageUrl } from '@lefrig/shared';
import { fetchApi, mapApiListing, API_URL } from '@/lib/api';
import { useAuthApi, ApiError } from '@/lib/useAuthApi';
import { AppIcon } from '@/components/AppIcon';
import { savePendingCashAgreement } from '@/lib/cash-session';
import { SellerTrustBadge } from '@/components/SellerTrustBadge';
import { ReportButton } from '@/components/ReportButton';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';
import type { ListingSummary } from '@lefrig/shared';

type ListingDetail = ListingSummary & {
  description?: string;
  sellerId?: string;
  images?: string[];
};

const { width: SCREEN_W } = Dimensions.get('window');
const GALLERY_H = Math.round(SCREEN_W * 1.05);

function resolveImage(url: string): string {
  return resolveImageUrl(url, API_URL) ?? url;
}

function parseListing(raw: Record<string, unknown>): ListingDetail {
  const seller = raw.seller as { id?: string; displayName?: string } | undefined;
  const images = raw.images as string[] | undefined;
  const mapped = mapApiListing(raw);
  return {
    ...mapped,
    description: raw.description != null ? String(raw.description) : undefined,
    sellerId: seller?.id,
    images: images?.length ? images : mapped.imageUrl ? [mapped.imageUrl] : [],
  };
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { locale, dir } = useLocale();
  const { authFetch, syncUser, isSignedIn } = useAuthApi();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [creatingCash, setCreatingCash] = useState(false);
  const [page, setPage] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    fetchApi<Record<string, unknown>>(`/listings/${id}`)
      .then((data) => {
        if (cancelled) return;
        setListing(parseListing(data));
        Animated.timing(fade, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }).start();
      })
      .catch(() => {
        if (cancelled) return;
        setListing(null);
        setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, fade]);

  const dept = listing ? findDepartmentForSlug(listing.category) : undefined;
  const category = listing
    ? LISTING_CATEGORIES.find((c) => c.slug === listing.category)
    : undefined;
  const camp = listing ? CAMPS.find((c) => c.slug === listing.campId) : undefined;
  const attributeRows = listing
    ? formatAttributeDetails(listing.category, listing.attributes)
    : [];

  const requireAuth = () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return false;
    }
    return true;
  };

  const toggleFavorite = async () => {
    if (!requireAuth()) return;
    try {
      await syncUser();
      const res = await authFetch<{ favorited: boolean }>(`/listings/${id}/favorite`, { method: 'POST' });
      setFavorited(res.favorited);
    } catch {
      Alert.alert(t('common.error'), t('favorites.empty'));
    }
  };

  const createCashDeal = async () => {
    if (!requireAuth()) return;
    if (!listing?.sellerId) {
      Alert.alert(t('common.error'), t('marketplaceExtra.agreementError'));
      return;
    }
    setCreatingCash(true);
    try {
      await syncUser();
      const agreement = await authFetch<{
        id: string;
        operationCode: string;
        amount: number | string;
        listing?: { title: string };
      }>('/cash/agreements', {
        method: 'POST',
        body: JSON.stringify({
          listingId: id,
          sellerId: listing.sellerId,
          amount: listing.price,
          method: 'cash',
        }),
      });
      // El API no devuelve el PIN al comprador; lo ve el vendedor en /cash.
      await savePendingCashAgreement({
        id: agreement.id,
        operationCode: agreement.operationCode,
        pin: '',
        amount: agreement.amount,
        listingTitle: listing.title,
        createdAt: new Date().toISOString(),
      });
      Alert.alert(
        t('cash.agreementCreated'),
        `${t('cash.codeLabel')} ${agreement.operationCode}\n\n${t('cash.buyerCreatedHint')}`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('profile.links.cashPin'), onPress: () => router.push('/cash') },
        ],
      );
    } catch (err) {
      const detail =
        err instanceof ApiError && err.message && !err.message.startsWith('API ')
          ? err.message
          : t('marketplaceExtra.agreementError');
      Alert.alert(t('common.error'), detail);
    } finally {
      setCreatingCash(false);
    }
  };

  const contactSeller = async () => {
    if (!requireAuth()) return;
    if (!listing?.sellerId) {
      Alert.alert(t('footer.contact'), t('marketplaceExtra.contactCoordinate'));
      return;
    }
    setContacting(true);
    try {
      await syncUser();
      await authFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: listing.sellerId,
          content: `Hola, me interesa tu anuncio: ${listing.title}`,
          refId: id,
          type: 'listing',
        }),
      });
      router.push('/messages');
    } catch {
      Alert.alert(t('common.error'), t('marketplaceExtra.chatError'));
    } finally {
      setContacting(false);
    }
  };

  const onGalleryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    setPage(Math.round(x / SCREEN_W));
  };

  if (loading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={theme.dune} size="large" />
      </View>
    );
  }

  if (loadError || !listing) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.errorHeader}>
          <Pressable style={styles.backChip} onPress={() => router.back()}>
            <AppIcon name="arrow-left" size={18} color={theme.dune} />
            <Text style={styles.backText}>{t('nav.marketplace')}</Text>
          </Pressable>
        </SafeAreaView>
        <View style={styles.boot}>
          <Text style={styles.errorBody}>{t('errors.genericBody')}</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={styles.emptyBtnText}>{t('common.back')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const images = listing.images ?? [];
  const metaLine = [
    category ? pickName(locale, category) : dept ? pickName(locale, dept) : null,
    camp ? pickName(locale, camp) : null,
    t('common.cashOnReceive'),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.galleryWrap}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onGalleryScroll}
              scrollEventThrottle={16}
            >
              {images.map((uri) => (
                <Image
                  key={uri}
                  source={{ uri: resolveImage(uri) }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <LinearGradient
              colors={['rgba(168,132,45,0.12)', 'rgba(45,138,98,0.08)']}
              style={styles.placeholder}
            >
              <AppIcon name="image" size={36} color={theme.dune} />
              <Text style={styles.placeholderText}>{t('marketplaceExtra.noPhotos')}</Text>
            </LinearGradient>
          )}

          <LinearGradient
            colors={['rgba(8,6,4,0.45)', 'transparent']}
            style={styles.galleryTopFade}
            pointerEvents="none"
          />

          <SafeAreaView edges={['top']} style={styles.galleryChrome} pointerEvents="box-none">
            <Pressable style={styles.chromeBtn} onPress={() => router.back()} hitSlop={8}>
              <AppIcon name="arrow-left" size={18} color={theme.pearl} />
            </Pressable>
            <Pressable style={styles.chromeBtn} onPress={toggleFavorite} hitSlop={8}>
              <AppIcon name="heart" size={18} color={favorited ? theme.duneBright : theme.pearl} />
            </Pressable>
          </SafeAreaView>

          {images.length > 1 ? (
            <View style={styles.dots}>
              {images.map((uri, i) => (
                <View key={uri} style={[styles.dot, i === page && styles.dotOn]} />
              ))}
            </View>
          ) : null}
        </View>

        <Animated.View style={[styles.body, { opacity: fade }]}>
          <Text style={[styles.meta, dir === 'rtl' && styles.rtlText]}>{metaLine}</Text>
          <Text style={[styles.title, dir === 'rtl' && styles.rtlText]}>{listing.title}</Text>
          <Text style={[styles.price, dir === 'rtl' && styles.rtlText]}>
            {listing.price.toLocaleString()}{' '}
            <Text style={styles.currency}>{listing.currency}</Text>
          </Text>
          <View style={[styles.rule, dir === 'rtl' && styles.ruleRtl]} />

          {listing.sellerId ? (
            <View style={styles.trustWrap}>
              <SellerTrustBadge userId={listing.sellerId} />
            </View>
          ) : null}

          {attributeRows.length > 0 ? (
            <View style={styles.attrBlock}>
              <Text style={[styles.sectionLabel, dir === 'rtl' && styles.rtlText]}>
                {t('marketplaceExtra.quickData')}
              </Text>
              {attributeRows.map((row, idx) => (
                <View
                  key={row.label}
                  style={[styles.attrRow, idx === attributeRows.length - 1 && styles.attrRowLast]}
                >
                  <Text style={styles.attrLabel}>{row.label}</Text>
                  <Text style={styles.attrValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={[styles.sectionLabel, dir === 'rtl' && styles.rtlText]}>
            {t('publish.description')}
          </Text>
          <Text style={[styles.desc, dir === 'rtl' && styles.rtlText]}>
            {listing.description?.trim() || t('marketplaceExtra.defaultDescription')}
          </Text>

          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerInitial}>
                {(listing.sellerName || '?').slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sellerLabel, dir === 'rtl' && styles.rtlText]}>
                {t('marketplaceExtra.seller')}
              </Text>
              <Text style={[styles.sellerName, dir === 'rtl' && styles.rtlText]}>
                {listing.sellerName}
              </Text>
            </View>
            {listing.sellerId ? (
              <ReportButton
                targetType="user"
                targetId={listing.sellerId}
                targetUserId={listing.sellerId}
                label={t('moderation.report')}
                compact
              />
            ) : null}
          </View>

          <View style={styles.reportRow}>
            <ReportButton
              targetType="listing"
              targetId={String(id)}
              targetUserId={listing.sellerId}
              label={t('moderation.reportListing')}
            />
          </View>
        </Animated.View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.ctaBar}>
        <Pressable
          style={[styles.cashBtn, creatingCash && styles.ctaDisabled]}
          onPress={createCashDeal}
          disabled={creatingCash}
        >
          {creatingCash ? (
            <ActivityIndicator color={theme.pearl} />
          ) : (
            <Text style={styles.cashText}>{t('marketplace.agreeCash')}</Text>
          )}
        </Pressable>
        <Pressable
          style={[styles.chatBtn, contacting && styles.ctaDisabled]}
          onPress={contactSeller}
          disabled={contacting}
        >
          {contacting ? (
            <ActivityIndicator color={theme.ink} />
          ) : (
            <>
              <AppIcon name="message-circle" size={16} color={theme.ink} />
              <Text style={styles.chatText}>{t('marketplace.contactSeller')}</Text>
            </>
          )}
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.canvas },
  errorHeader: { paddingHorizontal: space.lg, paddingTop: 8 },
  errorBody: {
    fontFamily: fonts.body,
    color: theme.inkMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptyBtnText: { fontFamily: fonts.bodyBold, fontSize: 14, color: theme.dune },
  backChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontFamily: fonts.bodyBold, fontSize: 13, color: theme.dune },
  scroll: { paddingBottom: 160 },

  galleryWrap: {
    height: GALLERY_H,
    backgroundColor: theme.canvasSoft,
  },
  galleryImage: { width: SCREEN_W, height: GALLERY_H },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  placeholderText: { fontFamily: fonts.bodySemi, color: theme.inkMuted },
  galleryTopFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  galleryChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  chromeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(8,6,4,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(250,248,244,0.35)',
  },
  dotOn: {
    backgroundColor: theme.pearl,
    width: 16,
  },

  body: {
    paddingHorizontal: space.lg,
    paddingTop: 22,
  },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },
  meta: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.dune,
    marginBottom: 10,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    letterSpacing: -0.7,
    color: theme.ink,
    lineHeight: 36,
  },
  price: {
    fontFamily: fonts.displaySemi,
    fontSize: 24,
    color: theme.ink,
    marginTop: 12,
  },
  currency: {
    fontFamily: fonts.bodyMed,
    fontSize: 14,
    color: theme.dune,
  },
  rule: {
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.dune,
    marginTop: 16,
    marginBottom: 18,
  },
  ruleRtl: { alignSelf: 'flex-end' },
  trustWrap: { marginBottom: 8 },
  sectionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.dune,
    marginBottom: 10,
    marginTop: 8,
  },
  attrBlock: { marginBottom: 8 },
  attrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
    gap: 16,
  },
  attrRowLast: { borderBottomWidth: 0 },
  attrLabel: { fontFamily: fonts.body, fontSize: 13, color: theme.inkSoft, flex: 1 },
  attrValue: { fontFamily: fonts.bodyBold, fontSize: 14, color: theme.ink, textAlign: 'right' },
  desc: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 26,
    color: theme.inkMuted,
    marginBottom: 28,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingTop: 4,
  },
  sellerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(168,132,45,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerInitial: {
    fontFamily: fonts.displaySemi,
    fontSize: 18,
    color: theme.dune,
  },
  sellerLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.inkSoft,
  },
  sellerName: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: theme.ink,
    marginTop: 2,
  },
  reportRow: { alignItems: 'center', marginBottom: 12 },

  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.lg,
    paddingTop: 12,
    backgroundColor: 'rgba(250,248,244,0.94)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
    gap: 8,
  },
  cashBtn: {
    backgroundColor: theme.ink,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  cashText: { fontFamily: fonts.bodyBold, fontSize: 15, color: theme.pearl },
  chatBtn: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.surface,
  },
  chatText: { fontFamily: fonts.bodyBold, fontSize: 14, color: theme.ink },
  ctaDisabled: { opacity: 0.7 },
});
