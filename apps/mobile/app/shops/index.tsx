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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { fetchWithMeta, mapApiShop, type ShopItem, unwrapPaginated } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { AppIcon } from '@/components/AppIcon';
import { CAMPS } from '@lefrig/shared';

const fallback: ShopItem[] = [
  { id: '1', name: 'Marsa Al-Khair', camp: 'Rabouni', verified: true },
  { id: '2', name: 'Electro Smara', camp: 'Smara', verified: true },
];

export default function ShopsScreen() {
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthApi();
  const t = useT();
  const { locale, dir } = useLocale();
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [myShopId, setMyShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [campFilter, setCampFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchWithMeta('/shops', { data: fallback, meta: { total: 2, page: 1, limit: 20, totalPages: 1 } }).then(
      (res) => {
        const raw = unwrapPaginated(res.data as never);
        setShops(res.fromFallback ? fallback : raw.map((s) => mapApiShop(s as Record<string, unknown>)));
        setLoading(false);
      },
    );
    if (isSignedIn) {
      authFetch<{ id: string }[]>('/shops/mine')
        .then((mine) => setMyShopId(mine[0]?.id ?? null))
        .catch(() => setMyShopId(null));
    }
  }, [authFetch, isSignedIn]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shops.filter((s) => {
      const campOk = !campFilter || s.camp.toLowerCase().includes(campFilter.toLowerCase());
      const searchOk = !q || s.name.toLowerCase().includes(q) || s.camp.toLowerCase().includes(q);
      return campOk && searchOk;
    });
  }, [shops, search, campFilter]);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.heroTitle, dir === 'rtl' && styles.rtl]}>{t('shops.title')}</Text>
          </View>
          <Pressable style={styles.registerBtn} onPress={() => router.push('/shops/register')}>
            <AppIcon name="plus" size={18} color={theme.pearl} strokeWidth={2.5} />
            <Text style={styles.registerText}>{t('shops.open')}</Text>
          </Pressable>
        </View>
        <Text style={[styles.heroSub, dir === 'rtl' && styles.rtl]}>{t('shops.verifiedMarsas')}</Text>

        <View style={styles.searchWrap}>
          <AppIcon name="search" size={18} color={theme.inkMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('shops.searchPlaceholder')}
            placeholderTextColor={theme.inkSoft}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </SafeAreaView>

      {myShopId ? (
        <Pressable style={styles.myShopBanner} onPress={() => router.push(`/shops/${myShopId}/products`)}>
          <AppIcon name="edit-3" size={18} color={theme.dune} />
          <Text style={styles.myShopText}>{t('shops.manageMyShop')}</Text>
          <AppIcon name="chevron-right" size={16} color={theme.dune} />
        </Pressable>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.campRow}>
        <Pressable
          style={[styles.campChip, !campFilter && styles.campChipOn]}
          onPress={() => setCampFilter(null)}
        >
          <Text style={[styles.campText, !campFilter && styles.campTextOn]}>{t('common.all')}</Text>
        </Pressable>
        {CAMPS.map((c) => (
          <Pressable
            key={c.slug}
            style={[styles.campChip, campFilter === c.slug && styles.campChipOn]}
            onPress={() => setCampFilter(c.slug)}
          >
            <Text style={[styles.campText, campFilter === c.slug && styles.campTextOn]}>
              {pickName(locale, c)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

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
            <View style={styles.avatar}>
              <AppIcon name="shopping-bag" size={22} color={theme.oasisDeep} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.camp}>{item.camp}</Text>
              <View style={styles.tags}>
                <Text style={styles.tag}>{t('common.cash')}</Text>
                {item.verified ? <Text style={[styles.tag, styles.tagGold]}>{t('shops.verified')}</Text> : null}
              </View>
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTitle: { fontSize: 26, fontWeight: '800', color: theme.ink },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  heroSub: { fontSize: 14, color: theme.inkMuted, marginTop: 4, marginBottom: 12 },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: theme.oasisDeep,
  },
  registerText: { fontSize: 13, fontWeight: '800', color: theme.pearl },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
    minHeight: 48,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: theme.ink, fontWeight: '500' },
  myShopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: 'rgba(168,132,45,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(168,132,45,0.25)',
  },
  myShopText: { flex: 1, fontWeight: '700', color: theme.dune },
  campRow: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  campChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  campChipOn: { backgroundColor: 'rgba(45,138,98,0.12)', borderColor: 'rgba(45,138,98,0.35)' },
  campText: { fontSize: 12, fontWeight: '600', color: theme.inkMuted },
  campTextOn: { color: theme.oasisDeep, fontWeight: '800' },
  list: { padding: 20, paddingBottom: 100 },
  empty: { textAlign: 'center', color: theme.inkMuted, marginTop: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(45,138,98,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700', color: theme.ink },
  camp: { fontSize: 14, color: theme.inkMuted, marginTop: 2 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tag: {
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: theme.oasisDeep,
    color: theme.pearl,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagGold: { backgroundColor: theme.dune, color: theme.pearl },
});
