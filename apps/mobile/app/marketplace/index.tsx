import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Modal,
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LISTING_CATEGORIES, CAMPS, MARKETPLACE_DEPARTMENTS, getListingAttributeFilters, listingAttributeFilterSchema, resolveImageUrl, type ListingAttributeFilterValues } from '@lefrig/shared';
import type { ListingSummary } from '@lefrig/shared';
import { API_URL, demoListingsPage, fetchWithMeta, mapListingsResponse } from '@/lib/api';
import { accentColors, getAtlasVisual } from '@/lib/home-visuals';
import { pickLabel, pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { AppIcon, type FeatherIconName } from '@/components/AppIcon';
import { ListingCard } from '@/components/ListingCard';

function resolveImage(url?: string): string | undefined {
  return resolveImageUrl(url, API_URL) ?? undefined;
}

/** Tintes rotativos para los círculos de categoría */
const CAT_TINTS: [string, string][] = [
  ['rgba(168,132,45,0.14)', 'rgba(168,132,45,0.4)'],
  ['rgba(45,138,98,0.13)', 'rgba(45,138,98,0.38)'],
  ['rgba(196,92,58,0.12)', 'rgba(196,92,58,0.36)'],
  ['rgba(59,130,246,0.11)', 'rgba(59,130,246,0.34)'],
  ['rgba(147,51,234,0.1)', 'rgba(147,51,234,0.32)'],
];

/** Categorías de anuncios agrupadas por sala del Atlas (solo kind listing) */
const CATEGORY_GROUPS = MARKETPLACE_DEPARTMENTS.map((dept) => ({
  id: dept.id,
  nameEs: dept.nameEs,
  nameAr: dept.nameAr,
  icon: dept.icon,
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

export default function MarketplaceScreen() {
  const router = useRouter();
  const t = useT();
  const { locale, dir } = useLocale();
  const { q, category, camp, brand, yearMin, storage, areaMin, propertyType, fuel } = useLocalSearchParams<{
    q?: string;
    category?: string;
    camp?: string;
    brand?: string;
    yearMin?: string;
    storage?: string;
    areaMin?: string;
    propertyType?: string;
    fuel?: string;
  }>();
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [search, setSearch] = useState(q ?? '');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingCamp, setPendingCamp] = useState<string | undefined>(camp || undefined);
  const [pendingCategory, setPendingCategory] = useState<string | undefined>(category || undefined);
  const [sort, setSort] = useState<SortMode>('recent');

  const [pendingAttr, setPendingAttr] = useState<ListingAttributeFilterValues>({});

  const activeAttrFilters = useMemo(
    () =>
      listingAttributeFilterSchema.parse({
        ...(brand ? { brand } : {}),
        ...(yearMin ? { yearMin } : {}),
        ...(storage ? { storage } : {}),
        ...(areaMin ? { areaMin } : {}),
        ...(propertyType ? { propertyType } : {}),
        ...(fuel ? { fuel } : {}),
      }),
    [brand, yearMin, storage, areaMin, propertyType, fuel],
  );

  useEffect(() => {
    setSearch(q ?? '');
  }, [q]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (camp) params.set('campId', camp);
    if (brand) params.set('brand', brand);
    if (yearMin) params.set('yearMin', yearMin);
    if (storage) params.set('storage', storage);
    if (areaMin) params.set('areaMin', areaMin);
    if (propertyType) params.set('propertyType', propertyType);
    if (fuel) params.set('fuel', fuel);
    params.set('limit', '40');
    const query = params.toString() ? `?${params.toString()}` : '';

    fetchWithMeta(`/listings${query}`, demoListingsPage).then((res) => {
      const page = res.fromFallback ? demoListingsPage : mapListingsResponse(res.data as never);
      setListings(page.data);
      setUsingDemo(res.fromFallback);
      setLoading(false);
    });
  }, [q, category, camp, brand, yearMin, storage, areaMin, propertyType, fuel]);

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

  const selectCategory = (slug?: string) => {
    router.setParams({
      q: search || undefined,
      category: slug === category ? undefined : slug,
      camp: camp || undefined,
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
      brand: pendingAttr.brand ? String(pendingAttr.brand) : undefined,
      yearMin: pendingAttr.yearMin != null ? String(pendingAttr.yearMin) : undefined,
      storage: pendingAttr.storage ? String(pendingAttr.storage) : undefined,
      areaMin: pendingAttr.areaMin != null ? String(pendingAttr.areaMin) : undefined,
      propertyType: pendingAttr.propertyType ? String(pendingAttr.propertyType) : undefined,
      fuel: pendingAttr.fuel ? String(pendingAttr.fuel) : undefined,
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
      brand: undefined,
      yearMin: undefined,
      storage: undefined,
      areaMin: undefined,
      propertyType: undefined,
      fuel: undefined,
    });
  };

  // Rail de categorías en 2 filas horizontales
  const catRail = useMemo(() => {
    const all = [{ slug: '', nameEs: t('common.all'), nameAr: t('common.all'), icon: '🛍️' }, ...LISTING_CATEGORIES];
    const top: typeof all = [];
    const bottom: typeof all = [];
    all.forEach((c, i) => (i % 2 === 0 ? top : bottom).push(c));
    return { top, bottom };
  }, []);

  const CategoryTile = ({
    cat,
    index,
  }: {
    cat: { slug: string; nameEs: string; nameAr: string; icon: string };
    index: number;
  }) => {
    const selected = cat.slug === '' ? !category : category === cat.slug;
    const [bg, ring] = CAT_TINTS[index % CAT_TINTS.length]!;
    return (
      <Pressable
        style={({ pressed }) => [styles.catTile, pressed && styles.catPressed]}
        onPress={() => selectCategory(cat.slug || undefined)}
      >
        <View
          style={[
            styles.catCircle,
            { backgroundColor: bg, borderColor: selected ? theme.oasisDeep : ring },
            selected && styles.catCircleOn,
          ]}
        >
          <Text style={styles.catEmoji}>{cat.icon}</Text>
          {selected ? (
            <View style={styles.catCheck}>
              <AppIcon name="check" size={10} color={theme.pearl} strokeWidth={3} />
            </View>
          ) : null}
        </View>
        <Text style={[styles.catName, selected && styles.catNameOn]} numberOfLines={1}>
          {pickName(locale, cat)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.heroEyebrow}>{t('marketplace.kicker')}</Text>
            <Text style={[styles.heroAr, dir === 'rtl' && styles.rtl]}>{t('marketplaceExtra.heroAr')}</Text>
          </View>
          <Pressable style={styles.createBtn} onPress={() => router.push('/marketplace/create')}>
            <AppIcon name="plus" size={16} color={theme.pearl} strokeWidth={2.5} />
            <Text style={styles.createText}>{t('nav.sell')}</Text>
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <AppIcon name="search" size={18} color={theme.inkMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('marketplace.searchPlaceholder')}
              placeholderTextColor={theme.inkSoft}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() =>
                router.setParams({ q: search || undefined, category: category || undefined, camp: camp || undefined })
              }
              returnKeyType="search"
            />
            {search.length > 0 ? (
              <Pressable onPress={() => { setSearch(''); router.setParams({ q: undefined }); }} hitSlop={8}>
                <AppIcon name="x" size={16} color={theme.inkMuted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable style={[styles.filterBtn, filterCount > 0 && styles.filterBtnOn]} onPress={openSheet}>
            <AppIcon name="sliders" size={18} color={filterCount > 0 ? theme.pearl : theme.ink} />
            {filterCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{filterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </SafeAreaView>

      <FlatList
        data={rest}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.railHeader}>
              <Text style={styles.railTitle}>{t('marketplaceExtra.categories')}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catRail}
            >
              <View style={styles.catColumns}>
                <View style={styles.catRow}>
                  {catRail.top.map((c, i) => (
                    <CategoryTile key={c.slug || 'all'} cat={c} index={i} />
                  ))}
                </View>
                <View style={styles.catRow}>
                  {catRail.bottom.map((c, i) => (
                    <CategoryTile key={c.slug} cat={c} index={i + 1} />
                  ))}
                </View>
              </View>
            </ScrollView>

            {activeCamp ? (
              <View style={styles.activeRow}>
                <Pressable style={styles.activeChip} onPress={() => router.setParams({ camp: undefined })}>
                  <Text style={styles.activeChipText}>📍 {pickName(locale, activeCamp)}</Text>
                  <AppIcon name="x" size={13} color={theme.dune} />
                </Pressable>
              </View>
            ) : null}

            {usingDemo ? (
              <View style={styles.demoBanner}>
                <AppIcon name="wifi-off" size={14} color={theme.dune} />
                <Text style={styles.demoText}>{t('common.demo')}</Text>
              </View>
            ) : null}

            {featured ? (
              <Pressable
                style={({ pressed }) => [styles.featured, pressed && styles.catPressed]}
                onPress={() => router.push(`/marketplace/${featured.id}`)}
              >
                <ImageBackground
                  source={{ uri: resolveImage(featured.imageUrl) }}
                  style={styles.featuredBg}
                  imageStyle={styles.featuredImage}
                >
                  <LinearGradient
                    colors={['rgba(0,0,0,0.0)', theme.scrimDeep]}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.featuredBadge}>
                    <AppIcon name="star" size={12} color={theme.pearl} />
                    <Text style={styles.featuredBadgeText}>{t('common.featured')}</Text>
                  </View>
                  <View style={styles.featuredFooter}>
                    <View style={styles.featuredCopy}>
                      <Text style={styles.featuredTitle} numberOfLines={2}>
                        {featured.title}
                      </Text>
                      <Text style={styles.featuredSeller} numberOfLines={1}>
                        {featured.sellerName} · {t('common.cashOnReceive')}
                      </Text>
                    </View>
                    <View style={styles.featuredPricePill}>
                      <Text style={styles.featuredPrice}>
                        {featured.price.toLocaleString()} {featured.currency}
                      </Text>
                    </View>
                  </View>
                </ImageBackground>
              </Pressable>
            ) : null}

            <View style={styles.resultRow}>
              <Text style={styles.resultCount}>
                {loading
                  ? t('marketplaceExtra.searching')
                  : `${t(listings.length === 1 ? 'common.results' : 'common.results_plural', { count: listings.length })}${activeCategory ? ` · ${pickName(locale, activeCategory)}` : ''}`}
              </Text>
              <View style={styles.resultDivider} />
              <Pressable style={styles.sortBtn} onPress={cycleSort} hitSlop={6}>
                <AppIcon name={SORT_ICON[sort]} size={13} color={theme.oasisDeep} />
                <Text style={styles.sortText}>{t(SORT_KEYS[sort])}</Text>
              </Pressable>
            </View>
          </View>
        }
        ListFooterComponent={
          rest.length > 0 ? (
            <View>
              <View style={styles.salasHeader}>
                <Text style={styles.railTitle}>{t('marketplaceExtra.exploreRooms')}</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.salasRow}
              >
                {MARKETPLACE_DEPARTMENTS.map((dept) => {
                  const visual = getAtlasVisual(dept.id);
                  const [c1, c2] = accentColors(dept.accent);
                  return (
                    <Pressable
                      key={dept.id}
                      style={({ pressed }) => [styles.sala, pressed && styles.catPressed]}
                      onPress={() => router.push(`/atlas/${dept.id}` as never)}
                    >
                      <LinearGradient colors={[c1, c2]} style={styles.salaRing}>
                        <Image source={{ uri: visual.uri }} style={styles.salaImage} />
                      </LinearGradient>
                      <Text style={styles.salaName} numberOfLines={1}>
                        {dept.icon} {pickName(locale, dept)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={theme.dune} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <AppIcon name="package" size={30} color={theme.dune} />
              </View>
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
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{t('common.filters')}</Text>
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
                <Text style={[styles.sheetChipText, !pendingCamp && styles.sheetChipTextOn]}>{t('common.all')}</Text>
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
                <View style={styles.sheetGroupHeader}>
                  <Text style={styles.sheetGroupIcon}>{group.icon}</Text>
                  <Text style={styles.sheetGroupName}>{pickName(locale, group)}</Text>
                </View>
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
                        style={[styles.sheetChipText, pendingCategory === cat.slug && styles.sheetChipTextOn]}
                      >
                        {cat.icon} {pickName(locale, cat)}
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
                          style={[styles.sheetChip, !pendingAttr[def.param as keyof ListingAttributeFilterValues] && styles.sheetChipOn]}
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
                        {def.options.map((opt) => (
                          <Pressable
                            key={opt.value}
                            style={[
                              styles.sheetChip,
                              pendingAttr[def.param as keyof ListingAttributeFilterValues] === opt.value &&
                                styles.sheetChipOn,
                            ]}
                            onPress={() =>
                              setPendingAttr((prev) => ({
                                ...prev,
                                [def.param]: def.type === 'number' ? Number(opt.value) : opt.value,
                              }))
                            }
                          >
                            <Text style={styles.sheetChipText}>{pickLabel(locale, opt)}</Text>
                          </Pressable>
                        ))}
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
                            else next[def.param as keyof ListingAttributeFilterValues] = Number(v) as never;
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
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: theme.canvas,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
    paddingTop: 4,
  },
  heroEyebrow: { fontSize: 10, fontWeight: '800', color: theme.dune, letterSpacing: 2 },
  heroAr: { fontSize: 30, fontWeight: '900', color: theme.ink, writingDirection: 'rtl', marginTop: 2 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: radii.pill,
    backgroundColor: theme.oasisDeep,
    shadowColor: theme.oasisDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createText: { fontSize: 13, fontWeight: '800', color: theme.pearl },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
    minHeight: 50,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: theme.ink, fontWeight: '500' },
  filterBtn: {
    width: 50,
    height: 50,
    borderRadius: radii.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnOn: { backgroundColor: theme.dune, borderColor: theme.dune },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.flare,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: { fontSize: 10, fontWeight: '800', color: theme.pearl },
  railHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 4,
  },
  railTitle: { fontSize: 16, fontWeight: '800', color: theme.ink, letterSpacing: -0.3 },
  railTitleAr: { fontSize: 13, fontWeight: '700', color: theme.dune, writingDirection: 'rtl' },
  catRail: { paddingVertical: 10, paddingRight: 8 },
  catColumns: { gap: 12 },
  catRow: { flexDirection: 'row', gap: 12 },
  catTile: { alignItems: 'center', width: 66 },
  catPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  catCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  catCircleOn: {
    borderWidth: 2.5,
    shadowColor: theme.oasisDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  catEmoji: { fontSize: 24 },
  catCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.oasisDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.canvas,
  },
  catName: { fontSize: 10.5, fontWeight: '700', color: theme.inkMuted, marginTop: 5, textAlign: 'center' },
  catNameOn: { color: theme.oasisDeep, fontWeight: '800' },
  activeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(168,132,45,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168,132,45,0.3)',
  },
  activeChipText: { fontSize: 12, fontWeight: '700', color: theme.dune },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: 'rgba(168,132,45,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(168,132,45,0.25)',
    marginBottom: 12,
  },
  demoText: { fontSize: 12, color: theme.dune, fontWeight: '600' },
  featured: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: 16,
    marginTop: 4,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 5,
  },
  featuredBg: { height: 210, justifyContent: 'space-between', padding: 14 },
  featuredImage: { borderRadius: radii.xl },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(168,132,45,0.9)',
  },
  featuredBadgeText: { fontSize: 11, fontWeight: '800', color: theme.pearl, letterSpacing: 0.4 },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  featuredCopy: { flex: 1 },
  featuredTitle: { fontSize: 19, fontWeight: '800', color: theme.pearl, letterSpacing: -0.3 },
  featuredSeller: { fontSize: 12, color: 'rgba(250,248,244,0.8)', marginTop: 4 },
  featuredPricePill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: theme.pearl,
  },
  featuredPrice: { fontSize: 14, fontWeight: '900', color: theme.oasisDeep },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  resultCount: { fontSize: 13, fontWeight: '800', color: theme.ink },
  resultDivider: { flex: 1, height: 1, backgroundColor: theme.border },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(45,138,98,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45,138,98,0.25)',
  },
  sortText: { fontSize: 11.5, fontWeight: '800', color: theme.oasisDeep },
  list: { paddingHorizontal: 20, paddingBottom: 110 },
  gridRow: { justifyContent: 'space-between' },
  salasHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 4,
  },
  salasRow: { paddingVertical: 12, gap: 14, paddingRight: 8 },
  sala: { alignItems: 'center', width: 72 },
  salaRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  salaImage: {
    width: 53,
    height: 53,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: theme.canvas,
  },
  salaName: { fontSize: 10.5, fontWeight: '700', color: theme.inkMuted, marginTop: 6, textAlign: 'center' },
  emptyWrap: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: 'rgba(168,132,45,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: theme.ink },
  emptySub: { fontSize: 14, color: theme.inkMuted, textAlign: 'center', maxWidth: 260 },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: theme.oasisDeep,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '800', color: theme.pearl },
  sheetBackdrop: { flex: 1, backgroundColor: theme.scrim },
  sheet: {
    backgroundColor: theme.canvas,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: '82%',
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.borderStrong,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: theme.ink },
  sheetClear: { fontSize: 13, fontWeight: '700', color: theme.flare },
  sheetScroll: { marginBottom: 12 },
  sheetLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.dune,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 10,
  },
  sheetChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sheetChip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sheetAllCat: { alignSelf: 'flex-start', marginBottom: 4 },
  sheetChipOn: { backgroundColor: 'rgba(45,138,98,0.14)', borderColor: theme.oasisDeep },
  sheetChipText: { fontSize: 13, fontWeight: '600', color: theme.inkMuted },
  sheetChipTextOn: { color: theme.oasisDeep, fontWeight: '800' },
  sheetGroup: { marginTop: 14 },
  sheetGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sheetGroupIcon: { fontSize: 16 },
  sheetGroupName: { fontSize: 14, fontWeight: '800', color: theme.ink, flex: 1 },
  sheetGroupAr: { fontSize: 12, fontWeight: '700', color: theme.dune, writingDirection: 'rtl' },
  sheetApply: {
    paddingVertical: 16,
    borderRadius: radii.lg,
    backgroundColor: theme.oasisDeep,
    alignItems: 'center',
  },
  sheetApplyText: { fontSize: 16, fontWeight: '800', color: theme.pearl },
  sheetInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 15,
    color: theme.ink,
    backgroundColor: theme.surface,
    marginBottom: 8,
  },
});
