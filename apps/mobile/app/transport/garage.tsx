import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { useAuthApi } from '@/lib/useAuthApi';
import { useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

type HubDriver = {
  driverStatus: 'none' | 'pending' | 'verified';
  driver: {
    vehicleType: string | null;
    vehiclePlate: string | null;
    seatsCapacity: number;
    rating: number;
    totalTrips: number;
    frequentRoutes: {
      id: string;
      frequency: string;
      origin: { nameEs: string };
      destination: { nameEs: string };
    }[];
  } | null;
};

type OpenTrip = {
  id: string;
  status: string;
  originLabel?: string | null;
  destinationLabel?: string | null;
  originHubSlug?: string | null;
  destinationHubSlug?: string | null;
  requesterName?: string | null;
};

type PaginatedTrips = { data: OpenTrip[] };

export default function DriverGarageScreen() {
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthApi();
  const t = useT();
  const [hub, setHub] = useState<HubDriver | null>(null);
  const [trips, setTrips] = useState<OpenTrip[]>([]);
  const [openBoard, setOpenBoard] = useState<OpenTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimMsg, setClaimMsg] = useState('');
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    setLoadError(false);
    try {
      const [h, rawMine, rawOpen] = await Promise.all([
        authFetch<HubDriver>('/users/me/hub'),
        authFetch<OpenTrip[] | PaginatedTrips>('/transport/my').catch(() => [] as OpenTrip[]),
        authFetch<PaginatedTrips>('/transport?status=requested&limit=20').catch(() => ({
          data: [] as OpenTrip[],
        })),
      ]);
      setHub(h);
      setTrips(Array.isArray(rawMine) ? rawMine : rawMine.data ?? []);
      setOpenBoard(Array.isArray(rawOpen) ? rawOpen : rawOpen.data ?? []);
    } catch {
      setHub(null);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authFetch, isSignedIn]);

  useEffect(() => {
    load();
  }, [load]);

  const claimTrip = async (tripId: string) => {
    setClaimingId(tripId);
    setClaimMsg('');
    try {
      await authFetch(`/transport/${tripId}/claim`, { method: 'PATCH' });
      setClaimMsg(t('me.driver.claimSuccess'));
      await load();
    } catch {
      setClaimMsg(t('me.driver.claimError'));
    } finally {
      setClaimingId(null);
    }
  };

  const status = hub?.driverStatus ?? 'none';
  const driver = hub?.driver;
  const claimable =
    status === 'verified'
      ? openBoard.filter((tr) => tr.status === 'requested' || tr.status === 'open')
      : [];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <AppIcon name="arrow-left" size={22} color={theme.ink} />
        </Pressable>
        <Text style={styles.title}>{t('me.driver.title')}</Text>
        <Text style={styles.sub}>{t('me.driver.subtitle')}</Text>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={theme.gold}
          />
        }
      >
        {!isSignedIn ? (
          <Pressable style={styles.cta} onPress={() => router.push('/sign-in')}>
            <Text style={styles.ctaText}>{t('me.signInPrompt')}</Text>
          </Pressable>
        ) : loading ? (
          <ActivityIndicator color={theme.gold} style={{ marginTop: 40 }} />
        ) : loadError ? (
          <Text style={styles.factMuted}>{t('errors.apiUnavailable')}</Text>
        ) : (
          <>
            <View
              style={[
                styles.banner,
                status === 'verified' && styles.bannerVerified,
                status === 'pending' && styles.bannerPending,
              ]}
            >
              <Text style={styles.bannerTitle}>
                {status === 'verified'
                  ? t('me.driver.statusVerified')
                  : status === 'pending'
                    ? t('me.driver.statusPending')
                    : t('me.driver.statusNone')}
              </Text>
              <Text style={styles.bannerBody}>
                {status === 'verified'
                  ? t('me.driver.statusVerifiedBody')
                  : status === 'pending'
                    ? t('me.driver.statusPendingBody')
                    : t('me.driver.statusNoneBody')}
              </Text>
            </View>

            {driver ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>{t('me.driver.vehicle')}</Text>
                <Text style={styles.fact}>
                  {driver.vehicleType ?? '—'} · {driver.vehiclePlate ?? '—'} · {driver.seatsCapacity}{' '}
                  {t('me.driver.seats').toLowerCase()}
                </Text>
                <Text style={styles.factMuted}>
                  {t('me.driver.rating')}: {Number(driver.rating).toFixed(1)} · {t('me.driver.trips')}:{' '}
                  {driver.totalTrips}
                </Text>
              </View>
            ) : null}

            {driver ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>{t('me.driver.routes')}</Text>
                {driver.frequentRoutes.length === 0 ? (
                  <Text style={styles.factMuted}>{t('me.driver.noRoutes')}</Text>
                ) : (
                  driver.frequentRoutes.map((r) => (
                    <Text key={r.id} style={styles.route}>
                      {r.origin.nameEs} → {r.destination.nameEs}
                    </Text>
                  ))
                )}
              </View>
            ) : null}

            {status === 'verified' ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>{t('me.driver.openBoard')}</Text>
                {claimMsg ? <Text style={styles.factMuted}>{claimMsg}</Text> : null}
                {claimable.length === 0 ? (
                  <Text style={styles.factMuted}>{t('me.driver.noOpenTrips')}</Text>
                ) : (
                  claimable.map((tr) => (
                    <View key={tr.id} style={styles.claimRow}>
                      <Text style={styles.route}>
                        {(tr.originLabel ?? tr.originHubSlug) ?? '?'} →{' '}
                        {(tr.destinationLabel ?? tr.destinationHubSlug) ?? '?'}
                      </Text>
                      <Pressable
                        style={styles.claimBtn}
                        disabled={claimingId === tr.id}
                        onPress={() => void claimTrip(tr.id)}
                      >
                        <Text style={styles.claimBtnText}>
                          {claimingId === tr.id ? t('me.driver.claiming') : t('me.driver.claimCta')}
                        </Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            ) : null}

            {trips.length > 0 ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>{t('me.driver.myTrips')}</Text>
                {trips.slice(0, 8).map((tr) => (
                  <Text key={tr.id} style={styles.route}>
                    {(tr.originLabel ?? tr.originHubSlug) ?? '?'} →{' '}
                    {(tr.destinationLabel ?? tr.destinationHubSlug) ?? '?'} · {tr.status}
                  </Text>
                ))}
              </View>
            ) : null}

            <Pressable
              style={styles.cta}
              onPress={() => router.push('/transport/register' as never)}
            >
              <Text style={styles.ctaText}>
                {status === 'none' ? t('me.driver.registerCta') : t('me.driver.editProfile')}
              </Text>
            </Pressable>
            <Pressable style={styles.ghost} onPress={() => router.push('/transport' as never)}>
              <Text style={styles.ghostText}>{t('me.driver.openTransport')}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  back: { marginBottom: 8, width: 36 },
  title: { fontSize: 22, fontWeight: '800', color: theme.ink },
  sub: { fontSize: 13, color: theme.inkMuted, marginTop: 4 },
  content: { padding: 16, paddingBottom: 100, gap: 12 },
  banner: {
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 6,
  },
  bannerVerified: {
    backgroundColor: 'rgba(45,138,98,0.08)',
    borderColor: 'rgba(45,138,98,0.3)',
  },
  bannerPending: {
    backgroundColor: 'rgba(168,132,45,0.1)',
    borderColor: 'rgba(168,132,45,0.35)',
  },
  bannerTitle: { fontSize: 17, fontWeight: '800', color: theme.ink },
  bannerBody: { fontSize: 14, color: theme.inkMuted, lineHeight: 20 },
  panel: {
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 8,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.dune,
  },
  fact: { fontSize: 15, fontWeight: '700', color: theme.ink },
  factMuted: { fontSize: 13, color: theme.inkMuted },
  route: { fontSize: 14, fontWeight: '600', color: theme.ink, flex: 1 },
  claimRow: { gap: 8, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
  claimBtn: {
    alignSelf: 'flex-start',
    backgroundColor: theme.dune,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  claimBtnText: { color: theme.pearl, fontWeight: '800', fontSize: 13 },
  cta: {
    marginTop: 4,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: theme.dune,
    alignItems: 'center',
  },
  ctaText: { color: theme.pearl, fontWeight: '800', fontSize: 15 },
  ghost: {
    padding: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    backgroundColor: theme.surface,
  },
  ghostText: { color: theme.ink, fontWeight: '700', fontSize: 14 },
});
