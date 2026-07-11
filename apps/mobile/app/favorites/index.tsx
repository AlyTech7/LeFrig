import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { ListingSummary } from '@lefrig/shared';
import { mapApiListing } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { useLocale, useT } from '@/lib/locale';
import { theme, gradients } from '@/lib/theme';
import { AppIcon } from '@/components/AppIcon';

export default function FavoritesScreen() {
  const router = useRouter();
  const { authFetch } = useAuthApi();
  const t = useT();
  const { dir } = useLocale();
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch<Record<string, unknown>[]>('/listings/favorites/mine')
      .then((items) => setListings(items.map((item) => mapApiListing(item))))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [authFetch]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.hero]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={[styles.title, dir === 'rtl' && styles.rtl]}>{t('nav.favorites')}</Text>
          <Text style={[styles.sub, dir === 'rtl' && styles.rtl]}>{t('favorites.sub')}</Text>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={theme.gold} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyWrap}>
              <AppIcon name="heart" size={32} color={theme.textDarkMuted} />
              <Text style={styles.empty}>{t('favorites.empty')}</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/marketplace/${item.id}`)}>
            <AppIcon name="heart" size={18} color={theme.terracotta} />
            <View style={styles.info}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.price}>
                {item.price.toLocaleString()} {t('common.currency')}
              </Text>
            </View>
            <AppIcon name="chevron-right" size={16} color={theme.textDarkMuted} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  header: { paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: theme.text, paddingHorizontal: 20, paddingTop: 8 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  sub: { fontSize: 14, color: theme.textMuted, paddingHorizontal: 20, marginTop: 4 },
  list: { padding: 16, paddingBottom: 100 },
  emptyWrap: { alignItems: 'center', marginTop: 48, gap: 12 },
  empty: { textAlign: 'center', color: theme.textDarkMuted },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 10,
  },
  info: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.textDark },
  price: { fontSize: 14, color: theme.emeraldDeep, marginTop: 2, fontWeight: '600' },
});
