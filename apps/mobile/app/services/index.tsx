import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SERVICE_CATEGORIES } from '@lefrig/shared';
import { fetchWithMeta, mapApiService, type ServiceItem, unwrapPaginated } from '@/lib/api';
import { AppIcon } from '@/components/AppIcon';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';

function formatPrice(item: ServiceItem, t: (k: string, p?: Record<string, string | number>) => string) {
  const currency = item.currency || 'DZD';
  if (!item.priceFrom) return t('services.studio.priceNegotiable');
  if (item.priceTo != null && item.priceTo > item.priceFrom) {
    return t('services.priceRange', {
      from: item.priceFrom.toLocaleString(),
      to: item.priceTo.toLocaleString(),
      currency,
    });
  }
  return t('services.priceFrom', { price: item.priceFrom.toLocaleString(), currency });
}

export default function ServicesScreen() {
  const router = useRouter();
  const t = useT();
  const { locale, dir } = useLocale();
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 560,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const load = useCallback(
    async (soft = false) => {
      if (soft) setRefreshing(true);
      else setLoading(true);
      try {
        const q = categoryParam ? `?category=${encodeURIComponent(categoryParam)}` : '';
        const res = await fetchWithMeta(`/services${q}`, {
          data: [],
          meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
        });
        if (res.fromFallback) {
          setServices([]);
        } else {
          setServices(unwrapPaginated(res.data as never).map((s) => mapApiService(s as Record<string, unknown>)));
        }
      } catch {
        setServices([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [categoryParam],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => {
      const hay = [
        s.title,
        s.campName,
        s.campNames.join(' '),
        s.categoryName ?? '',
        s.providerName ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [services, search]);

  const setCategory = (slug?: string) => {
    router.setParams({ category: slug });
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#f7f1e4', theme.canvas, theme.canvas]}
        locations={[0, 0.28, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.orb} pointerEvents="none" />

      <SafeAreaView edges={['top']}>
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: enter,
              transform: [
                {
                  translateY: enter.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={styles.kicker}>{t('services.kicker')}</Text>
              <Text style={[styles.brandAr, dir === 'rtl' && styles.rtl]} accessibilityRole="header">
                {t('services.brandAr')}
              </Text>
              <Text style={[styles.title, dir === 'rtl' && styles.rtl]}>{t('services.title')}</Text>
              <View style={styles.rule} />
            </View>
            <Pressable
              style={({ pressed }) => [styles.publishBtn, pressed && styles.pressed]}
              onPress={() => router.push('/services/create')}
            >
              <AppIcon name="plus" size={15} color={theme.pearl} strokeWidth={2.5} />
              <Text style={styles.publishBtnText}>{t('services.offer')}</Text>
            </Pressable>
          </View>

          <View style={[styles.searchWrap, searchFocused && styles.searchFocused]}>
            <AppIcon name="search" size={17} color={theme.inkSoft} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('services.searchPlaceholder')}
              placeholderTextColor={theme.inkSoft}
              value={search}
              onChangeText={setSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              accessibilityLabel={t('services.searchAria')}
            />
            {search ? (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <AppIcon name="x" size={16} color={theme.inkMuted} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
            accessibilityLabel={t('services.categoriesAria')}
          >
            <Pressable style={styles.catItem} onPress={() => setCategory(undefined)}>
              <Text style={[styles.catText, !categoryParam && styles.catTextOn]}>{t('common.all')}</Text>
              <View style={[styles.catRule, !categoryParam && styles.catRuleOn]} />
            </Pressable>
            {SERVICE_CATEGORIES.map((cat) => {
              const on = categoryParam === cat.slug;
              return (
                <Pressable key={cat.slug} style={styles.catItem} onPress={() => setCategory(cat.slug)}>
                  <Text style={[styles.catText, on && styles.catTextOn]}>{pickName(locale, cat)}</Text>
                  <View style={[styles.catRule, on && styles.catRuleOn]} />
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, filtered.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={theme.dune}
            colors={[theme.dune]}
          />
        }
        ListHeaderComponent={
          !loading && filtered.length > 0 ? (
            <View style={styles.countRow}>
              <Text style={styles.countText}>
                {filtered.length} · {t('services.directory')}
              </Text>
              <View style={styles.countRule} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={theme.dune} style={{ marginTop: 48 }} />
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyAr}>{t('services.brandAr')}</Text>
              <Text style={styles.emptyTitle}>{t('services.emptyTitle')}</Text>
              <Text style={styles.emptyBody}>{t('services.emptyHint')}</Text>
              <Pressable style={styles.emptyCta} onPress={() => router.push('/services/create')}>
                <Text style={styles.emptyCtaText}>{t('services.publishMine')}</Text>
                <AppIcon name="arrow-right" size={14} color={theme.dune} />
              </Pressable>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            onPress={() => router.push(`/services/${item.id}`)}
          >
            <View style={styles.info}>
              {item.categoryName ? <Text style={styles.rowTrade}>{item.categoryName}</Text> : null}
              <Text style={styles.rowTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {[item.campNames.join(', ') || item.campName, item.providerName].filter(Boolean).join(' · ')}
              </Text>
              <Text style={styles.rowPrice}>{formatPrice(item, t)}</Text>
            </View>
            {item.rating != null ? (
              <View style={styles.rating}>
                <AppIcon name="star" size={12} color={theme.dune} />
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              </View>
            ) : (
              <AppIcon name="chevron-right" size={16} color={theme.inkSoft} />
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  orb: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(168,132,45,0.07)',
  },
  hero: { paddingHorizontal: space.lg, paddingTop: 6, paddingBottom: 4 },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroCopy: { flex: 1 },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: theme.dune,
  },
  brandAr: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: theme.ink,
    marginTop: 2,
    writingDirection: 'rtl',
    lineHeight: 44,
  },
  title: { fontFamily: fonts.bodyMed, fontSize: 15, color: theme.inkMuted, marginTop: -2 },
  rule: {
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.dune,
    marginTop: 10,
    marginBottom: 4,
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: theme.ink,
    marginTop: 8,
  },
  publishBtnText: { fontFamily: fonts.bodyBold, fontSize: 12, color: theme.pearl },
  pressed: { opacity: 0.9 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingHorizontal: 14,
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderStrong,
  },
  searchFocused: { borderBottomColor: theme.dune },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: theme.ink,
    paddingVertical: 10,
  },

  catRow: { paddingTop: 16, paddingBottom: 8, gap: 18 },
  catItem: { flexShrink: 0 },
  catText: { fontFamily: fonts.bodyMed, fontSize: 13, color: theme.inkSoft },
  catTextOn: { fontFamily: fonts.bodyBold, color: theme.ink },
  catRule: { height: 2, marginTop: 7, borderRadius: 1, backgroundColor: 'transparent' },
  catRuleOn: { backgroundColor: theme.dune },

  list: { paddingHorizontal: space.lg, paddingBottom: 120, paddingTop: 8 },
  listEmpty: { flexGrow: 1 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  countText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.dune,
  },
  countRule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.borderStrong },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  info: { flex: 1, minWidth: 0 },
  rowTrade: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.dune,
    marginBottom: 4,
  },
  rowTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: theme.ink,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  rowMeta: { fontFamily: fonts.body, fontSize: 12, color: theme.inkSoft, marginTop: 3 },
  rowPrice: {
    fontFamily: fonts.displaySemi,
    fontSize: 14,
    color: theme.ink,
    marginTop: 6,
  },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontFamily: fonts.bodyBold, fontSize: 13, color: theme.dune },

  emptyWrap: { alignItems: 'center', paddingVertical: 56, gap: 6 },
  emptyAr: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: 'rgba(168,132,45,0.28)',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: fonts.displaySemi,
    fontSize: 22,
    letterSpacing: -0.4,
    color: theme.ink,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: theme.inkMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 21,
    marginTop: 4,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 8,
  },
  emptyCtaText: { fontFamily: fonts.bodyBold, fontSize: 14, color: theme.dune },
});
