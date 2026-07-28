import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { resolveImageUrl } from '@lefrig/shared';
import { Hero, Button, EmptyState } from '@/components/ui';
import { useAuthApi } from '@/lib/useAuthApi';
import { useT } from '@/lib/locale';
import { API_URL } from '@/lib/api';
import { theme, radii } from '@/lib/theme';
import { type as typo, space, ui, fonts } from '@/lib/ui';

type MineShop = {
  id: string;
  name: string;
  shopType: string;
  imageUrl?: string | null;
  isActive: boolean;
  phone?: string;
  _count?: { products: number };
};

const TYPE_KEYS: Record<string, string> = {
  individual: 'shops.typeIndividual',
  restaurant: 'shops.typeRestaurant',
  cooperative: 'shops.typeCooperative',
  association: 'shops.typeAssociation',
  workshop: 'shops.typeWorkshop',
};

export default function MyShopsScreen() {
  const t = useT();
  const router = useRouter();
  const { authFetch, isSignedIn, isLoaded, syncUser } = useAuthApi();
  const [shops, setShops] = useState<MineShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await syncUser();
      const mine = await authFetch<MineShop[]>('/shops/mine');
      setShops(Array.isArray(mine) ? mine : []);
    } catch {
      setError(t('shops.mine.loadError'));
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, [authFetch, syncUser, t]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }
    void load();
  }, [isLoaded, isSignedIn, load, router]);

  return (
    <View style={ui.screen}>
      <Hero
        title={t('shops.mine.title')}
        subtitle={t('shops.mine.lead')}
        right={
          <Button label={t('shops.mine.emptyCta')} variant="gold" onPress={() => router.push('/shops/register')} />
        }
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color={theme.dune} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.dune} />}
          ListEmptyComponent={
            <EmptyState
              icon="shopping-bag"
              title={t('shops.mine.emptyTitle')}
              body={t('shops.mine.emptyHint')}
              actionLabel={t('shops.mine.emptyCta')}
              onAction={() => router.push('/shops/register')}
            />
          }
          renderItem={({ item }) => {
            const img = item.imageUrl ? resolveImageUrl(item.imageUrl, API_URL) ?? item.imageUrl : null;
            return (
              <Pressable style={styles.card} onPress={() => router.push(`/shops/${item.id}/manage`)}>
                {img ? (
                  <Image source={{ uri: img }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <Text style={styles.thumbGlyph}>ⵣ</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>
                    {t(TYPE_KEYS[item.shopType] ?? 'shops.typeIndividual')}
                    {item._count?.products != null
                      ? ` · ${t('shops.mine.productsCount', { count: item._count.products })}`
                      : ''}
                  </Text>
                  <Text style={[styles.badge, !item.isActive && styles.badgeOff]}>
                    {item.isActive ? t('shops.mine.statusActive') : t('shops.mine.statusPaused')}
                  </Text>
                </View>
                <Button
                  label={t('shops.mine.manage')}
                  variant="ghost"
                  onPress={() => router.push(`/shops/${item.id}/manage`)}
                />
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, paddingBottom: 120 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: theme.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: theme.border,
    padding: space.md,
    marginBottom: space.md,
  },
  thumb: { width: 64, height: 64, borderRadius: radii.md },
  thumbEmpty: {
    backgroundColor: theme.canvasSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGlyph: { fontFamily: fonts.display, fontSize: 24, color: theme.dune },
  name: { ...typo.body, fontFamily: fonts.bodyBold, fontSize: 17 },
  meta: { ...typo.caption, marginTop: 4 },
  badge: { ...typo.label, color: theme.oasis, marginTop: 8 },
  badgeOff: { color: theme.flare },
  error: { ...typo.caption, color: theme.flare, marginHorizontal: space.lg, marginTop: 8 },
});
