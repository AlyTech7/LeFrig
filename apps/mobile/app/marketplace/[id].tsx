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
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { findDepartmentForSlug, formatAttributeDetails } from '@lefrig/shared';
import { demoListings, fetchWithMeta, mapApiListing, API_URL } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppIcon } from '@/components/AppIcon';
import { ReportButton } from '@/components/ReportButton';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import type { ListingSummary } from '@lefrig/shared';

type ListingDetail = ListingSummary & {
  description?: string;
  sellerId?: string;
  images?: string[];
};

const { width: SCREEN_W } = Dimensions.get('window');

function resolveImage(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_URL.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
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
  const { locale } = useLocale();
  const { authFetch, syncUser, isSignedIn } = useAuthApi();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [creatingCash, setCreatingCash] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchWithMeta<Record<string, unknown>>(`/listings/${id}`, demoListings[0] as never).then((res) => {
      const mapped: ListingDetail = res.fromFallback
        ? {
            ...(demoListings.find((l) => l.id === id) ?? demoListings[0]!),
            images: (() => {
              const d = demoListings.find((l) => l.id === id) ?? demoListings[0]!;
              return d.imageUrl ? [d.imageUrl] : [];
            })(),
          }
        : parseListing(res.data);
      setListing(mapped);
      setLoading(false);
    });
  }, [id]);

  const dept = listing ? findDepartmentForSlug(listing.category) : undefined;
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
    if (!requireAuth() || !listing?.sellerId) return;
    setCreatingCash(true);
    try {
      await syncUser();
      const agreement = await authFetch<{ operationCode: string; pin: string }>('/cash/agreements', {
        method: 'POST',
        body: JSON.stringify({
          listingId: id,
          sellerId: listing.sellerId,
          amount: listing.price,
          method: 'cash',
        }),
      });
      Alert.alert(
        t('common.success'),
        t('marketplaceExtra.agreementCreated'),
        [{ text: t('nav.cash'), onPress: () => router.push('/cash') }],
      );
    } catch {
      Alert.alert(t('common.error'), t('marketplace.publishError'));
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
      Alert.alert(t('common.error'), t('messages.empty'));
    } finally {
      setContacting(false);
    }
  };

  if (loading || !listing) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={theme.dune} size="large" />
      </View>
    );
  }

  const images = listing.images ?? [];

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={listing.title}
        subtitle={`${listing.price.toLocaleString()} ${listing.currency}`}
        backLabel={t('nav.marketplace')}
        right={
          <Pressable onPress={toggleFavorite} hitSlop={8}>
            <AppIcon name="heart" size={22} color={favorited ? theme.dune : theme.inkSoft} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {images.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>
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
          <View style={styles.placeholder}>
            <AppIcon name="image" size={40} color={theme.oasis} />
            <Text style={styles.placeholderText}>{t('marketplaceExtra.noPhotos')}</Text>
          </View>
        )}

        <View style={styles.badges}>
          <View style={styles.badge}>
            <AppIcon name="dollar-sign" size={14} color={theme.oasisDeep} />
            <Text style={styles.badgeText}>{t('common.cashOnReceive')}</Text>
          </View>
          {dept ? (
            <View style={[styles.badge, styles.badgeMuted]}>
              <Text style={styles.badgeMutedText}>{dept.icon} {pickName(locale, dept)}</Text>
            </View>
          ) : null}
        </View>

        {attributeRows.length > 0 ? (
          <View style={styles.attrGrid}>
            {attributeRows.map((row) => (
              <View key={row.label} style={styles.attrCell}>
                <Text style={styles.attrLabel}>{row.label}</Text>
                <Text style={styles.attrValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.desc}>
          {listing.description ?? t('marketplaceExtra.defaultDescription')}
        </Text>

        <View style={styles.sellerRow}>
          <View style={styles.sellerAvatar}>
            <AppIcon name="user" size={18} color={theme.oasisDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sellerLabel}>{t('marketplaceExtra.seller')}</Text>
            <Text style={styles.sellerName}>{listing.sellerName}</Text>
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

        <Pressable
          style={[styles.cashBtn, creatingCash && styles.ctaDisabled]}
          onPress={createCashDeal}
          disabled={creatingCash}
        >
          {creatingCash ? (
            <ActivityIndicator color={theme.pearl} />
          ) : (
            <>
              <AppIcon name="dollar-sign" size={20} color={theme.pearl} />
              <Text style={styles.cashText}>{t('marketplace.agreeCash')}</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={[styles.cta, contacting && styles.ctaDisabled]}
          onPress={contactSeller}
          disabled={contacting}
        >
          {contacting ? (
            <ActivityIndicator color={theme.pearl} />
          ) : (
            <>
              <AppIcon name="message-circle" size={20} color={theme.pearl} />
              <Text style={styles.ctaText}>{t('marketplace.contactSeller')}</Text>
            </>
          )}
        </Pressable>

        <View style={styles.reportRow}>
          <ReportButton
            targetType="listing"
            targetId={String(id)}
            targetUserId={listing.sellerId}
            label={t('moderation.reportListing')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.canvas },
  content: { paddingBottom: 40 },
  gallery: { marginBottom: 16 },
  galleryImage: { width: SCREEN_W, height: 260 },
  placeholder: {
    height: 200,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(45,138,98,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: { color: theme.inkMuted, fontWeight: '600' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(45,138,98,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  badgeText: { color: theme.oasisDeep, fontWeight: '700', fontSize: 12 },
  badgeMuted: { backgroundColor: theme.canvasSoft },
  badgeMutedText: { color: theme.inkMuted, fontWeight: '600', fontSize: 12 },
  attrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  attrCell: {
    minWidth: '46%',
    flex: 1,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  attrLabel: { fontSize: 11, fontWeight: '700', color: theme.inkMuted, marginBottom: 4 },
  attrValue: { fontSize: 15, fontWeight: '800', color: theme.ink },
  desc: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.inkMuted,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  reportRow: { alignItems: 'center', marginTop: 16 },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(45,138,98,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerLabel: { fontSize: 11, color: theme.inkSoft, fontWeight: '600', textTransform: 'uppercase' },
  sellerName: { fontSize: 16, fontWeight: '700', color: theme.ink },
  cashBtn: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: theme.dune,
    borderRadius: radii.lg,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    minHeight: 56,
  },
  cashText: { color: theme.pearl, fontSize: 16, fontWeight: '800' },
  cta: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: theme.oasisDeep,
    borderRadius: radii.lg,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    minHeight: 56,
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: { color: theme.pearl, fontSize: 16, fontWeight: '800' },
});
