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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SERVICE_CATEGORIES } from '@lefrig/shared';
import { fetchWithMeta, mapApiService, type ServiceItem, unwrapPaginated } from '@/lib/api';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppIcon } from '@/components/AppIcon';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

export default function ServicesScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const activeCategory = categoryParam
    ? SERVICE_CATEGORIES.find((c) => c.slug === categoryParam)
    : undefined;

  useEffect(() => {
    setLoading(true);
    const q = categoryParam ? `?category=${encodeURIComponent(categoryParam)}` : '';
    fetchWithMeta(`/services${q}`, { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }).then(
      (res) => {
        setServices(unwrapPaginated(res.data as never).map((s) => mapApiService(s as Record<string, unknown>)));
        setLoading(false);
      },
    );
  }, [categoryParam]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) => s.title.toLowerCase().includes(q) || s.campName.toLowerCase().includes(q),
    );
  }, [services, search]);

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={t('services.title')}
        subtitle={t('services.lead')}
        right={
          <Pressable style={styles.createBtn} onPress={() => router.push('/services/create')}>
            <AppIcon name="plus" size={16} color={theme.pearl} />
            <Text style={styles.createText}>{t('services.offer')}</Text>
          </Pressable>
        }
      />

      <View style={styles.searchWrap}>
        <AppIcon name="search" size={18} color={theme.inkMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('services.searchPlaceholder')}
          placeholderTextColor={theme.inkSoft}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {activeCategory ? (
        <View style={styles.activeCat}>
          <Text style={styles.activeCatIcon}>{activeCategory.icon}</Text>
          <Text style={styles.activeCatText}>{pickName(locale, activeCategory)}</Text>
          <Pressable onPress={() => router.setParams({ category: undefined })}>
            <AppIcon name="x" size={16} color={theme.inkMuted} />
          </Pressable>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
        <Pressable
          style={[styles.catChip, !categoryParam && styles.catChipActive]}
          onPress={() => router.setParams({ category: undefined })}
        >
          <Text style={[styles.catText, !categoryParam && styles.catTextActive]}>{t('common.all')}</Text>
        </Pressable>
        {SERVICE_CATEGORIES.slice(0, 14).map((cat) => (
          <Pressable
            key={cat.slug}
            style={[styles.catChip, categoryParam === cat.slug && styles.catChipActive]}
            onPress={() => router.setParams({ category: cat.slug })}
          >
            <Text style={styles.catEmoji}>{cat.icon}</Text>
            <Text style={[styles.catText, categoryParam === cat.slug && styles.catTextActive]}>
              {pickName(locale, cat)}
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
            <Text style={styles.empty}>{t('services.emptyTitle')}</Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push(`/services/${item.id}`)}
          >
            <View style={styles.iconWrap}>
              <AppIcon name="zap" size={20} color={theme.oasisDeep} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.title}</Text>
              <Text style={styles.price}>
                {t('services.priceFrom', { price: item.priceFrom.toLocaleString() })} · {item.campName}
              </Text>
            </View>
            <View style={styles.rating}>
              <AppIcon name="star" size={12} color={theme.dune} />
              <Text style={styles.star}>{item.rating.toFixed(1)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: theme.oasisDeep,
  },
  createText: { fontSize: 12, fontWeight: '800', color: theme.pearl },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: theme.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
    minHeight: 48,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: theme.ink, fontWeight: '500' },
  activeCat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(168,132,45,0.12)',
  },
  activeCatIcon: { fontSize: 16 },
  activeCatText: { fontSize: 13, fontWeight: '700', color: theme.dune },
  catRow: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  catChipActive: {
    backgroundColor: 'rgba(45,138,98,0.12)',
    borderColor: 'rgba(45,138,98,0.35)',
  },
  catEmoji: { fontSize: 14 },
  catText: { fontSize: 12, fontWeight: '600', color: theme.inkMuted },
  catTextActive: { color: theme.oasisDeep, fontWeight: '800' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  empty: { textAlign: 'center', color: theme.inkMuted, marginTop: 40, fontSize: 15 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  cardPressed: { opacity: 0.92 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(45,138,98,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: theme.ink },
  price: { fontSize: 13, color: theme.oasisDeep, marginTop: 4, fontWeight: '600' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  star: { fontSize: 13, color: theme.dune, fontWeight: '800' },
});
