import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, TextInput, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { resolveImageUrl } from '@lefrig/shared';
import { API_URL, fetchWithMeta, mapApiShop, type ShopItem, unwrapPaginated } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { AppIcon } from '@/components/AppIcon';
import { CAMPS } from '@lefrig/shared';
import { fonts, space } from '@/lib/ui';

const TYPE_FILTERS = [
  { id: 'all', labelKey: 'shops.filterAll' },
  { id: 'individual', labelKey: 'shops.typeIndividual' },
  { id: 'restaurant', labelKey: 'shops.typeRestaurant' },
  { id: 'pharmacy', labelKey: 'shops.typePharmacy' },
  { id: 'cooperative', labelKey: 'shops.typeCooperative' },
  { id: 'workshop', labelKey: 'shops.typeWorkshop' },
  { id: 'association', labelKey: 'shops.typeAssociation' },
] as const;

export default function ShopsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ shopType?: string }>();
  const { authFetch, isSignedIn } = useAuthApi();
  const t = useT();
  const { locale, dir } = useLocale();
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [myShops, setMyShops] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [campFilter, setCampFilter] = useState<string | null>(null);
  const initialType =
    typeof params.shopType === 'string' && TYPE_FILTERS.some((x) => x.id === params.shopType)
      ? params.shopType
      : 'all';
  const [typeFilter, setTypeFilter] = useState<string>(initialType);

  useEffect(() => {
    fetchWithMeta('/shops', { data: [] as ShopItem[], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } })
      .then((res) => {
        const raw = unwrapPaginated(res.data as never);
        setShops(res.fromFallback ? [] : raw.map((s) => mapApiShop(s as Record<string, unknown>)));
        setLoading(false);
      })
      .catch(() => {
        setShops([]);
        setLoading(false);
      });
    if (isSignedIn) {
      authFetch<{ id: string; name: string }[]>('/shops/mine')
        .then((mine) => setMyShops(Array.isArray(mine) ? mine.map((s) => ({ id: s.id, name: s.name })) : []))
        .catch(() => setMyShops([]));
    } else {
      setMyShops([]);
    }
  }, [authFetch, isSignedIn]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shops.filter((s) => {
      const campOk = !campFilter || s.camp.toLowerCase().includes(campFilter.toLowerCase());
      const searchOk = !q || s.name.toLowerCase().includes(q) || s.camp.toLowerCase().includes(q);
      const typeOk = typeFilter === 'all' || (s.shopType ?? 'individual') === typeFilter;
      return campOk && searchOk && typeOk;
    });
  }, [shops, search, campFilter, typeFilter]);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={styles.kicker}>Lefrig</Text>
              <Text style={[styles.heroTitle, dir === 'rtl' && styles.rtl]}>{t('shops.title')}</Text>
              <View style={styles.rule} />
              <Text style={[styles.heroSub, dir === 'rtl' && styles.rtl]}>{t('shops.verifiedMarsas')}</Text>
            </View>
            <View style={styles.heroActions}>
              {isSignedIn ? (
                <Pressable style={styles.secondaryBtn} onPress={() => router.push('/shops/mine')}>
                  <Text style={styles.secondaryBtnText}>{t('shops.mine.title')}</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.primaryBtn} onPress={() => router.push('/shops/register')}>
                <AppIcon name="plus" size={18} color={theme.pearl} strokeWidth={2.5} />
                <Text style={styles.primaryBtnText}>{t('shops.open')}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.searchWrap}>
            <AppIcon name="search" size={18} color={theme.inkSoft} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('shops.searchPlaceholder')}
              placeholderTextColor={theme.inkSoft}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
      </SafeAreaView>

      {myShops.length > 0 ? (
        <View style={styles.inlineBannerWrap}>
          {myShops.map((shop) => (
            <Pressable
              key={shop.id}
              style={styles.inlineBanner}
              onPress={() => router.push(`/shops/${shop.id}/manage` as never)}
            >
              <Text style={styles.inlineBannerEyebrow}>{t('shops.mine.title')}</Text>
              <View style={styles.inlineBannerRow}>
                <Text style={styles.inlineBannerTitle} numberOfLines={1}>
                  {myShops.length === 1 ? t('shops.manageMyShop') : shop.name}
                </Text>
                <AppIcon name="arrow-right" size={15} color={theme.dune} />
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.campRow}>
          {TYPE_FILTERS.map((tf) => {
            const active = typeFilter === tf.id;
            return (
              <Pressable key={tf.id} style={styles.filterItem} onPress={() => setTypeFilter(tf.id)}>
                <Text style={[styles.filterText, active && styles.filterTextOn]}>{t(tf.labelKey)}</Text>
                {active ? <View style={styles.filterRule} /> : <View style={styles.filterRuleGhost} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.campRow}>
          <Pressable style={styles.filterItem} onPress={() => setCampFilter(null)}>
            <Text style={[styles.filterText, !campFilter && styles.filterTextOn]}>{t('common.all')}</Text>
            {!campFilter ? <View style={styles.filterRule} /> : <View style={styles.filterRuleGhost} />}
          </Pressable>
          {CAMPS.map((c) => {
            const active = campFilter === c.slug;
            return (
              <Pressable key={c.slug} style={styles.filterItem} onPress={() => setCampFilter(c.slug)}>
                <Text style={[styles.filterText, active && styles.filterTextOn]}>{pickName(locale, c)}</Text>
                {active ? <View style={styles.filterRule} /> : <View style={styles.filterRuleGhost} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={theme.dune} style={{ marginTop: 40 }} />
          ) : (
            <Text style={styles.empty}>{t('shops.emptyTitle')}</Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/shops/${item.id}`)}>
            {item.imageUrl ? (
              <Image source={{ uri: resolveImageUrl(item.imageUrl, API_URL) ?? item.imageUrl }} style={styles.shopImg} />
            ) : (
              <View style={styles.avatar}>
                <AppIcon name="shopping-bag" size={22} color={theme.oasisDeep} />
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.camp}>{item.camp}</Text>
              <Text style={styles.meta}>
                {item.verified ? `${t('shops.verified')} · ` : ''}
                {t('common.cash')}
              </Text>
            </View>
            <AppIcon name="chevron-right" size={16} color={theme.inkSoft} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  hero: {
    paddingHorizontal: space.lg,
    paddingBottom: 8,
  },
  heroTop: {
    gap: 16,
  },
  heroCopy: {
    paddingTop: 6,
  },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.dune,
  },
  heroTitle: { fontFamily: fonts.display, fontSize: 34, color: theme.ink, letterSpacing: -0.9, marginTop: 6 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  rule: {
    width: 34,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.dune,
    marginTop: 12,
    marginBottom: 8,
  },
  heroSub: { fontFamily: fonts.body, fontSize: 14, color: theme.inkMuted, lineHeight: 21 },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  secondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: theme.dune,
    backgroundColor: theme.surface,
  },
  secondaryBtnText: { fontFamily: fonts.bodyBold, fontSize: 13, color: theme.dune },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: theme.oasisDeep,
  },
  primaryBtnText: { fontFamily: fonts.bodyBold, fontSize: 13, color: theme.pearl },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    paddingHorizontal: 14,
    minHeight: 48,
    gap: 10,
    marginTop: 16,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: theme.ink },
  inlineBannerWrap: { marginTop: 12, marginHorizontal: space.lg, gap: 10 },
  inlineBanner: {
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.borderStrong,
  },
  inlineBannerEyebrow: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: theme.dune,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  inlineBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  inlineBannerTitle: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 16, color: theme.ink, paddingRight: 12 },
  filterWrap: {
    marginTop: 8,
    marginBottom: 4,
  },
  campRow: { paddingHorizontal: space.lg, gap: 18, alignItems: 'center' },
  filterItem: { paddingBottom: 2 },
  filterText: { fontFamily: fonts.bodyMed, fontSize: 13, color: theme.inkSoft },
  filterTextOn: { fontFamily: fonts.bodyBold, color: theme.ink },
  filterRule: { height: 2, backgroundColor: theme.dune, borderRadius: 1, marginTop: 6 },
  filterRuleGhost: { height: 2, marginTop: 6 },
  list: { padding: space.lg, paddingBottom: 100 },
  empty: { textAlign: 'center', color: theme.inkMuted, marginTop: 40, fontFamily: fonts.body },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    gap: 12,
  },
  shopImg: { width: 48, height: 48, borderRadius: 14, backgroundColor: theme.canvasSoft },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(45,138,98,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontFamily: fonts.bodyBold, fontSize: 18, color: theme.ink },
  camp: { fontFamily: fonts.body, fontSize: 14, color: theme.inkMuted, marginTop: 2 },
  meta: { fontFamily: fonts.bodySemi, fontSize: 12, color: theme.dune, marginTop: 8 },
});
