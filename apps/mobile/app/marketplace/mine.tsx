import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { resolveImageUrl } from '@lefrig/shared';
import { Hero, Button, EmptyState, SegmentTabs } from '@/components/ui';
import { useAuthApi } from '@/lib/useAuthApi';
import { useT } from '@/lib/locale';
import { API_URL } from '@/lib/api';
import { theme, radii } from '@/lib/theme';
import { type as typo, space, ui } from '@/lib/ui';

type MineListing = {
  id: string;
  title: string;
  price: number | string;
  currency?: string;
  status: string;
  images?: string[];
};

const TABS = [
  { id: 'all', labelKey: 'common.all' },
  { id: 'active', labelKey: 'marketplace.mine.statusActive' },
  { id: 'paused', labelKey: 'marketplace.mine.statusPaused' },
  { id: 'sold', labelKey: 'marketplace.mine.statusSold' },
] as const;

export default function MarketplaceMineScreen() {
  const t = useT();
  const router = useRouter();
  const { authFetch, isSignedIn, isLoaded, syncUser } = useAuthApi();
  const [listings, setListings] = useState<MineListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await syncUser();
      const mine = await authFetch<MineListing[]>('/listings/mine');
      setListings(Array.isArray(mine) ? mine : []);
    } catch {
      setError(t('marketplace.mine.loadError'));
      setListings([]);
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

  const setStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await authFetch(`/listings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      setToast(t('marketplace.mine.updated'));
      setTimeout(() => setToast(''), 2500);
    } catch {
      setError(t('marketplace.mine.updateError'));
    } finally {
      setBusyId(null);
    }
  };

  const filtered = tab === 'all' ? listings : listings.filter((l) => l.status === tab);

  const tabs = TABS.map((x) => ({
    id: x.id,
    label: t(x.labelKey),
  }));

  return (
    <View style={ui.screen}>
      <Hero
        title={t('marketplace.mine.title')}
        subtitle={t('marketplace.mine.lead')}
        kicker={t('marketplace.mine.badge')}
        right={
          <Button
            label={t('marketplace.mine.publish')}
            variant="gold"
            onPress={() => router.push('/marketplace/create')}
          />
        }
      />

      <View style={styles.tabs}>
        <SegmentTabs tabs={tabs} value={tab} onChange={setTab} />
      </View>

      {toast ? <Text style={styles.toast}>{toast}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={theme.dune} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.dune} />}
          ListEmptyComponent={
            <EmptyState
              icon="shopping-bag"
              title={t('marketplace.mine.emptyTitle')}
              body={t('marketplace.mine.emptyHint')}
              actionLabel={t('marketplace.mine.emptyCta')}
              onAction={() => router.push('/marketplace/create')}
            />
          }
          renderItem={({ item }) => {
            const img = item.images?.[0]
              ? resolveImageUrl(item.images[0], API_URL) ?? item.images[0]
              : null;
            const busy = busyId === item.id;
            return (
              <Pressable style={styles.card} onPress={() => router.push(`/marketplace/${item.id}`)}>
                {img ? (
                  <Image source={{ uri: img }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]} />
                )}
                <View style={styles.meta}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.price}>
                    {item.price} {item.currency ?? 'DZD'}
                  </Text>
                  <Text style={styles.status}>
                    {t(
                      item.status === 'active'
                        ? 'marketplace.mine.statusActive'
                        : item.status === 'paused'
                          ? 'marketplace.mine.statusPaused'
                          : item.status === 'sold'
                            ? 'marketplace.mine.statusSold'
                            : 'marketplace.mine.statusDraft',
                    )}
                  </Text>
                  <View style={styles.actions}>
                    {item.status === 'active' ? (
                      <Button
                        label={t('marketplace.mine.pause')}
                        variant="ghost"
                        loading={busy}
                        onPress={() => void setStatus(item.id, 'paused')}
                      />
                    ) : null}
                    {item.status === 'paused' ? (
                      <Button
                        label={t('marketplace.mine.resume')}
                        variant="oasis"
                        loading={busy}
                        onPress={() => void setStatus(item.id, 'active')}
                      />
                    ) : null}
                    {item.status !== 'sold' ? (
                      <Button
                        label={t('marketplace.mine.markSold')}
                        variant="ghost"
                        loading={busy}
                        onPress={() => void setStatus(item.id, 'sold')}
                      />
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { paddingHorizontal: space.lg, paddingTop: space.sm },
  list: { padding: space.lg, paddingBottom: 120, gap: space.md },
  card: {
    flexDirection: 'row',
    gap: space.md,
    backgroundColor: theme.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: theme.border,
    padding: space.sm,
    marginBottom: space.md,
  },
  thumb: { width: 88, height: 88, borderRadius: radii.md },
  thumbEmpty: { backgroundColor: theme.canvasSoft },
  meta: { flex: 1, minWidth: 0 },
  title: { ...typo.body, fontFamily: 'DMSans_700Bold', fontSize: 15 },
  price: { ...typo.caption, color: theme.dune, marginTop: 4, fontWeight: '800' },
  status: { ...typo.label, marginTop: 6, color: theme.oasis },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  toast: {
    marginHorizontal: space.lg,
    marginTop: 8,
    ...typo.caption,
    color: theme.oasisDeep,
    fontWeight: '700',
  },
  error: {
    marginHorizontal: space.lg,
    marginTop: 8,
    ...typo.caption,
    color: theme.flare,
  },
});
