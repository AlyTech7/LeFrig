import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  ImageBackground,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  LISTING_CATEGORIES,
  CAMPS,
  MARKETPLACE_DEPARTMENTS,
  getListingAttributeFilters,
  listingAttributeFilterSchema,
  LISTING_ATTR_FILTER_KEYS,
  resolveImageUrl,
  type ListingAttributeFilterValues,
} from '@lefrig/shared';
import type { ListingSummary } from '@lefrig/shared';
import { API_URL, demoListingsPage, fetchWithMeta, mapListingsResponse } from '@/lib/api';
import { pickLabel, pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';
import { AppIcon, type FeatherIconName } from '@/components/AppIcon';
import { ListingCard } from '@/components/ListingCard';

function resolveImage(url?: string): string | undefined {
  return resolveImageUrl(url, API_URL) ?? undefined;
}

function pickAttrParams(
  params: Record<string, string | undefined>,
): ListingAttributeFilterValues {
  const raw: Record<string, string> = {};
  for (const key of LISTING_ATTR_FILTER_KEYS) {
    const v = params[key];
    if (v) raw[key] = v;
  }
  return listingAttributeFilterSchema.parse(raw);
}

function attrParamsToRouter(
  filters: ListingAttributeFilterValues,
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const key of LISTING_ATTR_FILTER_KEYS) {
    const v = filters[key];
    out[key] = v !== undefined && v !== '' ? String(v) : undefined;
  }
  return out;
}

function clearAttrRouterParams(): Record<string, undefined> {
  const out: Record<string, undefined> = {};
  for (const key of LISTING_ATTR_FILTER_KEYS) out[key] = undefined;
  return out;
}

const CATEGORY_GROUPS = MARKETPLACE_DEPARTMENTS.map((dept) => ({
  id: dept.id,
  nameEs: dept.nameEs,
  nameAr: dept.nameAr,
  categories: dept.items.filter((i) => i.kind === 'listing'),
})).filter((g) => g.categories.length > 0);

type SortMode = 'recent' | 'price_asc' | 'price_desc';

const SORT_KEYS: Record<SortMode, string> = {
  recent: 'marketplace.sortRecent',
  price_asc: 'marketplace.sortPriceAsc',
  price_desc: 'marketplace.sortPriceDesc',
};

const SORT_ICON: Record<SortMode, FeatherIconName> = {
  recent: 'clock',
  price_asc: 'trending-up',
  price_desc: 'trending-down',
};

function SkeletonCard() {
  return (
    <View style={styles.skelCard}>
      <View style={styles.skelMedia} />
      <View style={styles.skelLineWide} />
      <View style={styles.skelLineMid} />
      <View style={styles.skelLineShort} />
    </View>
  );
}

export default function MarketplaceScreen() {
  const router = useRouter();
  const t = useT();
  const { locale, dir } = useLocale();
  const routeParams = useLocalSearchParams<Record<string, string | undefined>>();
  const { q, category, camp } = routeParams;
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [search, setSearch] = useState(q ?? '');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingCamp, setPendingCamp] = useState<string | undefined>(camp || undefined);
  const [pendingCategory, setPendingCategory] = useState<string | undefined>(category || undefined);
  const [sort, setSort] = useState<SortMode>('recent');
  const [pendingAttr, setPendingAttr] = useState<ListingAttributeFilterValues>({});
  const [searchFocused, setSearchFocused] = useState(false);

  const enter = useRef(new Animated.Value(0)).current;
  const searchPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  useEffect(() => {
    Animated.timing(searchPulse, {
      toValue: searchFocused ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [searchFocused, searchPulse]);

  const activeAttrFilters = useMemo(() => pickAttrParams(routeParams), [routeParams]);

  useEffect(() => {
    setSearch(q ?? '');
  }, [q]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (camp) params.set('campId', camp);
    for (const key of LISTING_ATTR_FILTER_KEYS) {
      const v = activeAttrFilters[key];
      if (v !== undefined && v !== '') params.set(key, String(v));
    }
    params.set('limit', '40');
    const query = params.toString() ? `?${params.toString()}` : '';

    fetchWithMeta(`/listings${query}`, demoListingsPage).then((res) => {
      const page = res.fromFallback ? demoListingsPage : mapListingsResponse(res.data as never);
      setListings(page.data);
      setUsingDemo(res.fromFallback);
      setLoading(false);
    });
  }, [q, category, camp, activeAttrFilters]);

  const activeCategory = category ? LISTING_CATEGORIES.find((c) => c.slug === category) : undefined;
  const activeCamp = camp ? CAMPS.find((c) => c.slug === camp) : undefined;
  const filterCount =
    (activeCamp ? 1 : 0) +
    (activeCategory ? 1 : 0) +
    Object.values(activeAttrFilters).filter((v) => v !== undefined).length;

  const sorted = useMemo(() => {
    if (sort === 'recent') return listings;
    const copy = [...listings];
    copy.sort((a, b) => (sort === 'price_asc' ? a.price - b.price : b.price - a.price));
    return copy;
  }, [listings, sort]);

  const { featured, rest } = useMemo(() => {
    if (sort !== 'recent') return { featured: undefined, rest: sorted };
    const withImage = sorted.findIndex((l) => !!l.imageUrl);
    if (withImage === -1) return { featured: undefined, rest: sorted };
    const copy = [...sorted];
    const [hero] = copy.splice(withImage, 1);
    return { featured: hero, rest: copy };
  }, [sorted, sort]);

  const featuredCamp = featured
    ? CAMPS.find((c) => c.slug === featured.campId)
    : undefined;
  const featuredCategory = featured
    ? LISTING_CATEGORIES.find((c) => c.slug === featured.category)
    : undefined;

  const selectCategory = (slug?: string) => {
    router.setParams({
      q: search || undefined,
      category: slug === category ? undefined : slug,
      camp: camp || undefined,
    });
  };

  const selectCamp = (slug?: string) => {
    router.setParams({
      q: search || undefined,
      category: category || undefined,
      camp: slug === camp ? undefined : slug,
    });
  };

  const cycleSort = () => {
    setSort((s) => (s === 'recent' ? 'price_asc' : s === 'price_asc' ? 'price_desc' : 'recent'));
  };

  const openSheet = () => {
    setPendingCamp(camp || undefined);
    setPendingCategory(category || undefined);
    setPendingAttr(activeAttrFilters);
    setSheetOpen(true);
  };

  const applyFilters = () => {
    setSheetOpen(false);
    router.setParams({
      q: search || undefined,
      category: pendingCategory,
      camp: pendingCamp,
      ...attrParamsToRouter(pendingAttr),
    });
  };

  const clearFilters = () => {
    setPendingCamp(undefined);
    setPendingCategory(undefined);
    setPendingAttr({});
    setSheetOpen(false);
    router.setParams({
      q: search || undefined,
      category: undefined,
      camp: undefined,
      ...clearAttrRouterParams(),
    });
  };

  const categories = useMemo(
    () => [{ slug: '', nameEs: t('common.all'), nameAr: t('common.all') }, ...LISTING_CATEGORIES],
    [t],
  );

  const searchBorder = searchPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.borderStrong, theme.dune],
  });

  const heroMotion = {
    opacity: enter,
    transform: [
      {
        translateY: enter.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
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
        <Animated.View style={[styles.hero, heroMotion]}>
          <View style={styles.brandRow}>
            <View style={styles.brandCopy}>
              <Text style={styles.kicker}>{t('marketplace.kicker')}</Text>
              <Text style={[styles.brandAr, dir === 'rtl' && styles.rtl]} accessibilityRole="header">
                {t('marketplaceExtra.heroAr')}
              </Text>
              <Text style={[styles.brandEs, dir === 'rtl' && styles.rtl]}>{t('nav.marketplace')}</Text>
              <View style={styles.rule} />
            </View>
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
                onPress={() => router.push('/marketplace/mine')}
              >
                <Text style={styles.ghostBtnText}>{t('marketplace.mine.manage')}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.sellBtn, pressed && styles.pressed]}
                onPress={() => router.push('/marketplace/create')}
              >
                <AppIcon name="plus" size={15} color={theme.pearl} strokeWidth={2.5} />
                <Text style={styles.sellBtnText}>{t('nav.sell')}</Text>
              </Pressable>
            </View>
          </View>

          <Text style={[styles.trustLine, dir === 'rtl' && styles.rtl]}>
            {t('common.cashOnReceive')} · {t('trust.community')}
          </Text>

          <View style={styles.searchRow}>
            <Animated.View style={[styles.searchWrap, { borderColor: searchBorder }]}>
              <AppIcon name="search" size={17} color={searchFocused ? theme.dune : theme.inkSoft} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('marketplace.searchPlaceholder')}
                placeholderTextColor={theme.inkSoft}
                value={search}
                onChangeText={setSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onSubmitEditing={() =>
                  router.setParams({
                    q: search || undefined,
                    category: category || undefined,
                    camp: camp || undefined,
                  })
                }
                returnKeyType="search"
              />
              {search.length > 0 ? (
                <Pressable
                  onPress={() => {
                    setSearch('');
                    router.setParams({ q: undefined });
                  }}
                  hitSlop={8}
                >
                  <AppIcon name="x" size={15} color={theme.inkMuted} />
                </Pressable>
              ) : null}
            </Animated.View>
            <Pressable
              style={({ pressed }) => [
                styles.filterBtn,
                filterCount > 0 && styles.filterBtnOn,
                pressed && styles.pressed,
              ]}
              onPress={openSheet}
            >
              <AppIcon name="sliders" size={17} color={filterCount > 0 ? theme.pearl : theme.ink} />
              {filterCount > 0 ? (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{filterCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>

      <FlatList
        data={loading ? [] : rest}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Animated.View
            style={{
              opacity: enter,
              transform: [
                {
                  translateY: enter.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            }}
          >
            <Text style={styles.sectionLabel}>{t('marketplaceExtra.categories')}</Text>
            <View style={styles.railWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.catRow}
              >
                {categories.map((cat) => {
                  const selected = cat.slug === '' ? !category : category === cat.slug;
                  return (
                    <Pressable
                      key={cat.slug || 'all'}
                      style={styles.catItem}
                      onPress={() => selectCategory(cat.slug || undefined)}
                    >
                      <Text style={[styles.catText, selected && styles.catTextOn]} numberOfLines={1}>
                        {pickName(locale, cat)}
                      </Text>
                      <View style={[styles.catRule, selected ? styles.catRuleOn : null]} />
                    </Pressable>
                  );
                })}
              </ScrollView>
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(250,248,244,0)', theme.canvas]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.railFade}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.campRow}
            >
              <Pressable style={styles.campItem} onPress={() => selectCamp(undefined)}>
                <Text style={[styles.campText, !camp && styles.campTextOn]}>{t('marketplace.allCamps')}</Text>
              </Pressable>
              {CAMPS.filter((c) => !c.isTindouf).map((c) => {
                const on = camp === c.slug;
                return (
                  <Pressable key={c.slug} style={styles.campItem} onPress={() => selectCamp(c.slug)}>
                    <Text style={[styles.campText, on && styles.campTextOn]}>{pickName(locale, c)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {(activeCategory || activeCamp) && (
              <View style={styles.activeRow}>
                {activeCategory ? (
                  <Pressable style={styles.activePill} onPress={() => selectCategory(undefined)}>
                    <Text style={styles.activePillText}>{pickName(locale, activeCategory)}</Text>
                    <AppIcon name="x" size={12} color={theme.dune} />
                  </Pressable>
                ) : null}
                {activeCamp ? (
                  <Pressable style={styles.activePill} onPress={() => selectCamp(undefined)}>
                    <Text style={styles.activePillText}>{pickName(locale, activeCamp)}</Text>
                    <AppIcon name="x" size={12} color={theme.dune} />
                  </Pressable>
                ) : null}
              </View>
            )}

            {usingDemo ? (
              <View style={styles.demoBanner}>
                <AppIcon name="wifi-off" size={13} color={theme.dune} />
                <Text style={styles.demoText}>{t('common.demo')}</Text>
              </View>
            ) : null}

            {loading ? (
              <View style={styles.skelRow}>
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : null}

            {!loading && featured ? (
              <Pressable
                style={({ pressed }) => [styles.featured, pressed && styles.pressed]}
                onPress={() => router.push(`/marketplace/${featured.id}`)}
              >
                <ImageBackground
                  source={{ uri: resolveImage(featured.imageUrl) }}
                  style={styles.featuredBg}
                  imageStyle={styles.featuredImage}
                >
                  <LinearGradient
                    colors={['rgba(8,6,4,0.05)', 'rgba(8,6,4,0.55)', 'rgba(8,6,4,0.92)']}
                    locations={[0, 0.45, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.featuredTop}>
                    <Text style={styles.featuredEyebrow}>
                      {[
                        featuredCategory ? pickName(locale, featuredCategory) : null,
                        featuredCamp ? pickName(locale, featuredCamp) : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || t('common.featured')}
                    </Text>
                  </View>
                  <View style={styles.featuredFooter}>
                    <Text style={styles.featuredTitle} numberOfLines={2}>
                      {featured.title}
                    </Text>
                    <View style={styles.featuredMeta}>
                      <Text style={styles.featuredPrice}>
                        {featured.price.toLocaleString()} {featured.currency}
                      </Text>
                      <Text style={styles.featuredSeller} numberOfLines={1}>
                        {featured.sellerName}
                      </Text>
                    </View>
                  </View>
                </ImageBackground>
              </Pressable>
            ) : null}

            {!loading ? (
              <View style={styles.resultRow}>
                <View style={styles.resultLeft}>
                  <Text style={styles.resultCount}>
                    {t(listings.length === 1 ? 'common.results' : 'common.results_plural', {
                      count: listings.length,
                    })}
                  </Text>
                  <View style={styles.resultRule} />
                </View>
                <Pressable style={styles.sortBtn} onPress={cycleSort} hitSlop={8}>
                  <AppIcon name={SORT_ICON[sort]} size={13} color={theme.dune} />
                  <Text style={styles.sortText}>{t(SORT_KEYS[sort])}</Text>
                </Pressable>
              </View>
            ) : null}
          </Animated.View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyAr}>{t('marketplaceExtra.heroAr')}</Text>
              <Text style={styles.emptyTitle}>{t('empty.nothingHere')}</Text>
              <Text style={styles.emptySub}>
                {activeCategory || activeCamp ? t('empty.tryFilters') : t('empty.beFirst')}
              </Text>
              {activeCategory || activeCamp ? (
                <Pressable style={styles.emptyBtn} onPress={clearFilters}>
                  <Text style={styles.emptyBtnText}>{t('empty.removeFilters')}</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.emptyBtn} onPress={() => router.push('/marketplace/create')}>
                  <Text style={styles.emptyBtnText}>{t('marketplace.publishListing')}</Text>
                  <AppIcon name="arrow-right" size={14} color={theme.dune} />
                </Pressable>
              )}
            </View>
          )
        }
        renderItem={({ item }) => (
          <ListingCard item={item} grid onPress={() => router.push(`/marketplace/${item.id}`)} />
        )}
      />

      <Modal visible={sheetOpen} animationType="slide" transparent onRequestClose={() => setSheetOpen(false)}>
        <View style={styles.sheetRoot}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetKicker}>{t('common.filters')}</Text>
                <Text style={styles.sheetTitle}>{t('marketplace.quickFilters')}</Text>
              </View>
              <Pressable onPress={clearFilters} hitSlop={8}>
                <Text style={styles.sheetClear}>{t('common.clearAll')}</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetLabel}>{t('marketplace.camp')}</Text>
              <View style={styles.sheetChips}>
                <Pressable
                  style={[styles.sheetChip, !pendingCamp && styles.sheetChipOn]}
                  onPress={() => setPendingCamp(undefined)}
                >
                  <Text style={[styles.sheetChipText, !pendingCamp && styles.sheetChipTextOn]}>
                    {t('common.all')}
                  </Text>
                </Pressable>
                {CAMPS.map((c) => (
                  <Pressable
                    key={c.slug}
                    style={[styles.sheetChip, pendingCamp === c.slug && styles.sheetChipOn]}
                    onPress={() => setPendingCamp(pendingCamp === c.slug ? undefined : c.slug)}
                  >
                    <Text style={[styles.sheetChipText, pendingCamp === c.slug && styles.sheetChipTextOn]}>
                      {pickName(locale, c)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.sheetLabel}>{t('publish.categoryHint')}</Text>
              <Pressable
                style={[styles.sheetChip, styles.sheetAllCat, !pendingCategory && styles.sheetChipOn]}
                onPress={() => setPendingCategory(undefined)}
              >
                <Text style={[styles.sheetChipText, !pendingCategory && styles.sheetChipTextOn]}>
                  {t('marketplaceExtra.allCategories')}
                </Text>
              </Pressable>
              {CATEGORY_GROUPS.map((group) => (
                <View key={group.id} style={styles.sheetGroup}>
                  <Text style={styles.sheetGroupName}>{pickName(locale, group)}</Text>
                  <View style={styles.sheetChips}>
                    {group.categories.map((cat) => (
                      <Pressable
                        key={cat.slug}
                        style={[styles.sheetChip, pendingCategory === cat.slug && styles.sheetChipOn]}
                        onPress={() =>
                          setPendingCategory(pendingCategory === cat.slug ? undefined : cat.slug)
                        }
                      >
                        <Text
                          style={[
                            styles.sheetChipText,
                            pendingCategory === cat.slug && styles.sheetChipTextOn,
                          ]}
                        >
                          {pickName(locale, cat)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}

              {getListingAttributeFilters(pendingCategory ?? category ?? '').length > 0 ? (
                <>
                  <Text style={styles.sheetLabel}>{t('marketplaceExtra.categoryFilters')}</Text>
                  {getListingAttributeFilters(pendingCategory ?? category ?? '').map((def) => (
                    <View key={def.param} style={styles.sheetGroup}>
                      <Text style={styles.sheetGroupName}>{pickLabel(locale, def)}</Text>
                      {def.type === 'select' && def.options ? (
                        <View style={styles.sheetChips}>
                          <Pressable
                            style={[
                              styles.sheetChip,
                              !pendingAttr[def.param as keyof ListingAttributeFilterValues] &&
                                styles.sheetChipOn,
                            ]}
                            onPress={() =>
                              setPendingAttr((prev) => {
                                const next = { ...prev };
                                delete next[def.param as keyof ListingAttributeFilterValues];
                                return next;
                              })
                            }
                          >
                            <Text style={styles.sheetChipText}>{t('common.all')}</Text>
                          </Pressable>
                          {def.options.map((opt) => {
                            const current = pendingAttr[def.param as keyof ListingAttributeFilterValues];
                            const selected = current != null && String(current) === opt.value;
                            const numericParams = new Set(['yearMin', 'yearMax', 'rooms', 'areaMin']);
                            return (
                            <Pressable
                              key={opt.value}
                              style={[
                                styles.sheetChip,
                                selected && styles.sheetChipOn,
                              ]}
                              onPress={() =>
                                setPendingAttr((prev) => ({
                                  ...prev,
                                  [def.param]: numericParams.has(def.param)
                                    ? Number(opt.value)
                                    : opt.value,
                                }))
                              }
                            >
                              <Text style={styles.sheetChipText}>{pickLabel(locale, opt)}</Text>
                            </Pressable>
                            );
                          })}
                        </View>
                      ) : (
                        <TextInput
                          style={styles.sheetInput}
                          placeholder={def.placeholder}
                          keyboardType="numeric"
                          value={
                            pendingAttr[def.param as keyof ListingAttributeFilterValues] != null
                              ? String(pendingAttr[def.param as keyof ListingAttributeFilterValues])
                              : ''
                          }
                          onChangeText={(v) =>
                            setPendingAttr((prev) => {
                              const next = { ...prev };
                              if (!v.trim()) delete next[def.param as keyof ListingAttributeFilterValues];
                              else
                                next[def.param as keyof ListingAttributeFilterValues] = Number(
                                  v,
                                ) as never;
                              return next;
                            })
                          }
                        />
                      )}
                    </View>
                  ))}
                </>
              ) : null}
            </ScrollView>

            <Pressable style={styles.sheetApply} onPress={applyFilters}>
              <Text style={styles.sheetApplyText}>{t('marketplaceExtra.viewResults')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  orb: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(168,132,45,0.07)',
  },
  hero: {
    paddingHorizontal: space.lg,
    paddingTop: 4,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  brandCopy: { flex: 1 },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: theme.dune,
  },
  brandAr: {
    fontFamily: fonts.display,
    fontSize: 40,
    letterSpacing: -0.5,
    color: theme.ink,
    marginTop: 2,
    writingDirection: 'rtl',
    lineHeight: 48,
  },
  brandEs: {
    fontFamily: fonts.bodyMed,
    fontSize: 15,
    color: theme.inkMuted,
    marginTop: -2,
  },
  rule: {
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.dune,
    marginTop: 10,
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  actions: { alignItems: 'flex-end', gap: 8, paddingTop: 6 },
  ghostBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(168,132,45,0.35)',
  },
  ghostBtnText: { fontFamily: fonts.bodyBold, fontSize: 12, color: theme.dune },
  sellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: radii.md,
    backgroundColor: theme.ink,
  },
  sellBtnText: { fontFamily: fonts.bodyBold, fontSize: 12, color: theme.pearl },
  trustLine: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: theme.inkSoft,
    marginTop: 12,
    marginBottom: 14,
    lineHeight: 17,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },

  searchRow: { flexDirection: 'row', gap: 10 },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 48,
    gap: 10,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: theme.ink },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: theme.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnOn: { backgroundColor: theme.dune, borderColor: theme.dune },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: theme.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: { fontFamily: fonts.bodyBold, fontSize: 10, color: theme.pearl },

  sectionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: theme.dune,
    marginTop: 10,
    marginBottom: 10,
  },
  railWrap: { position: 'relative', marginBottom: 6 },
  catRow: { gap: 18, paddingBottom: 4, paddingRight: 28 },
  catItem: { flexShrink: 0 },
  catText: { fontFamily: fonts.bodyMed, fontSize: 14, color: theme.inkSoft },
  catTextOn: { fontFamily: fonts.bodyBold, color: theme.ink },
  catRule: { height: 2, marginTop: 7, borderRadius: 1, backgroundColor: 'transparent' },
  catRuleOn: { backgroundColor: theme.dune },
  railFade: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 28,
  },

  campRow: { gap: 14, paddingVertical: 8, paddingRight: 8 },
  campItem: { flexShrink: 0 },
  campText: { fontFamily: fonts.body, fontSize: 12.5, color: theme.inkSoft },
  campTextOn: { fontFamily: fonts.bodyBold, color: theme.dune },

  activeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8, marginTop: 2 },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  activePillText: { fontFamily: fonts.bodyBold, fontSize: 13, color: theme.dune },

  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    marginBottom: 8,
  },
  demoText: { fontFamily: fonts.bodySemi, fontSize: 12, color: theme.dune },

  skelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 8 },
  skelCard: { width: '48%', gap: 8 },
  skelMedia: {
    width: '100%',
    aspectRatio: 0.86,
    borderRadius: radii.md,
    backgroundColor: 'rgba(168,132,45,0.08)',
  },
  skelLineWide: { height: 12, borderRadius: 6, backgroundColor: 'rgba(26,22,18,0.06)', width: '92%' },
  skelLineMid: { height: 12, borderRadius: 6, backgroundColor: 'rgba(26,22,18,0.05)', width: '70%' },
  skelLineShort: { height: 10, borderRadius: 5, backgroundColor: 'rgba(168,132,45,0.12)', width: '44%' },

  featured: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 18,
  },
  featuredBg: { height: 248, justifyContent: 'space-between', padding: 18 },
  featuredImage: { borderRadius: radii.lg },
  featuredTop: { alignSelf: 'flex-start' },
  featuredEyebrow: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: 'rgba(250,248,244,0.72)',
  },
  featuredFooter: { gap: 10 },
  featuredTitle: {
    fontFamily: fonts.display,
    fontSize: 26,
    letterSpacing: -0.5,
    color: theme.pearl,
    lineHeight: 30,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  featuredPrice: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: theme.duneBright,
  },
  featuredSeller: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(250,248,244,0.62)',
    flexShrink: 1,
  },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  resultLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultCount: { fontFamily: fonts.bodyBold, fontSize: 13, color: theme.ink },
  resultRule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.borderStrong },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  sortText: { fontFamily: fonts.bodyBold, fontSize: 12, color: theme.dune },

  list: { paddingHorizontal: space.lg, paddingBottom: 120 },
  gridRow: { justifyContent: 'space-between' },

  emptyWrap: { alignItems: 'center', paddingVertical: 56, gap: 6 },
  emptyAr: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: 'rgba(168,132,45,0.28)',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: theme.ink },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: theme.inkMuted,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  emptyBtnText: { fontFamily: fonts.bodyBold, fontSize: 14, color: theme.dune },

  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.scrim },
  sheet: {
    backgroundColor: theme.canvas,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: space.lg,
    paddingBottom: 24,
    maxHeight: '82%',
    zIndex: 1,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.borderStrong,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  sheetKicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.dune,
  },
  sheetTitle: { fontFamily: fonts.display, fontSize: 24, color: theme.ink, marginTop: 2 },
  sheetClear: { fontFamily: fonts.bodyBold, fontSize: 13, color: theme.flare, marginTop: 8 },
  sheetScroll: { marginBottom: 12 },
  sheetLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: theme.dune,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 10,
  },
  sheetChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sheetChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radii.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sheetAllCat: { alignSelf: 'flex-start', marginBottom: 4 },
  sheetChipOn: { backgroundColor: 'rgba(168,132,45,0.1)', borderColor: theme.dune },
  sheetChipText: { fontFamily: fonts.bodySemi, fontSize: 13, color: theme.inkMuted },
  sheetChipTextOn: { color: theme.ink, fontFamily: fonts.bodyBold },
  sheetGroup: { marginTop: 14 },
  sheetGroupName: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: theme.ink,
    marginBottom: 8,
  },
  sheetApply: {
    paddingVertical: 16,
    borderRadius: radii.md,
    backgroundColor: theme.ink,
    alignItems: 'center',
  },
  sheetApplyText: { fontFamily: fonts.bodyBold, fontSize: 16, color: theme.pearl },
  sheetInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radii.md,
    padding: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: theme.ink,
    backgroundColor: theme.surface,
    marginBottom: 8,
  },
});
