import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { resolveImageUrl, type ListingSummary } from '@lefrig/shared';
import { mapApiListing, API_URL } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space, ui } from '@/lib/ui';
import { Hero, EmptyState, Button } from '@/components/ui';
import { AppIcon } from '@/components/AppIcon';

export default function FavoritesScreen() {
  const router = useRouter();
  const { authFetch, isSignedIn, isLoaded } = useAuthApi();
  const t = useT();
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSignedIn) {
      setListings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const items = await authFetch<Record<string, unknown>[]>('/listings/favorites/mine');
      setListings(items.map((item) => mapApiListing(item)));
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [authFetch, isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;
    void load();
  }, [isLoaded, load]);

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await authFetch(`/listings/${id}/favorite`, { method: 'POST', body: '{}' });
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch {
      Alert.alert(t('common.error'), t('common.retry'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={ui.screen}>
      <Hero
        title={t('favorites.title')}
        subtitle={t('favorites.sub')}
        kicker={t('me.modules.favorites')}
        back={false}
      />
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={theme.dune} style={{ marginTop: 40 }} />
          ) : !isSignedIn ? (
            <EmptyState
              icon="log-in"
              title={t('me.signInPrompt')}
              actionLabel={t('nav.signIn')}
              onAction={() => router.push('/sign-in')}
            />
          ) : (
            <EmptyState
              icon="heart"
              title={t('favorites.emptyTitle')}
              body={t('favorites.emptyHint')}
              actionLabel={t('favorites.browseMarket')}
              onAction={() => router.push('/marketplace')}
            />
          )
        }
        renderItem={({ item }) => {
          const img = resolveImageUrl(item.imageUrl ?? undefined, API_URL);
          return (
            <View style={styles.card}>
              <Pressable style={styles.main} onPress={() => router.push(`/marketplace/${item.id}`)}>
                {img ? (
                  <Image source={{ uri: img }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <AppIcon name="heart" size={18} color={theme.flare} />
                  </View>
                )}
                <View style={styles.info}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.price}>
                    {item.price.toLocaleString()} {t('favorites.currency')}
                  </Text>
                </View>
              </Pressable>
              <Button
                label={t('favorites.remove')}
                variant="ghost"
                loading={busyId === item.id}
                onPress={() => void remove(item.id)}
                style={styles.removeBtn}
              />
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, paddingBottom: 110 },
  card: {
    borderRadius: radii.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  main: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  thumb: { width: 72, height: 72, borderRadius: radii.sm },
  thumbEmpty: {
    backgroundColor: theme.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  cardTitle: { fontFamily: fonts.bodySemi, fontSize: 15, color: theme.ink },
  price: { fontFamily: fonts.bodyBold, fontSize: 14, color: theme.oasisDeep, marginTop: 4 },
  removeBtn: { marginHorizontal: 12, marginBottom: 12 },
});
