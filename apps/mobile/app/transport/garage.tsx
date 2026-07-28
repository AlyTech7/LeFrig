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
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { Screen, Hero, Button, EmptyState } from '@/components/ui';
import { useAuthApi } from '@/lib/useAuthApi';
import { useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts } from '@/lib/ui';

type DriverStatus = 'none' | 'basic' | 'pending' | 'verified' | 'rejected';

type HubDriver = {
  driverStatus: DriverStatus;
  driver: {
    vehicleType: string | null;
    vehiclePlate: string | null;
    seatsCapacity: number;
    rating: number;
    totalTrips: number;
    contactPhone?: string | null;
    coverageMode?: string | null;
    coverageZones?: string[];
    coverageScope?: string | null;
    coverageOriginHubSlug?: string | null;
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

function statusTone(status: DriverStatus): { bg: string; fg: string } {
  if (status === 'verified') return { bg: theme.successSoft, fg: theme.success };
  if (status === 'basic') return { bg: theme.infoSoft, fg: theme.info };
  if (status === 'pending') return { bg: theme.warningSoft, fg: theme.warning };
  if (status === 'rejected') return { bg: theme.dangerSoft, fg: theme.danger };
  return { bg: theme.sand, fg: theme.inkMuted };
}

function statusTitleKey(status: DriverStatus) {
  if (status === 'verified') return 'me.driver.statusVerified' as const;
  if (status === 'pending') return 'me.driver.statusPending' as const;
  if (status === 'basic') return 'me.driver.statusBasic' as const;
  if (status === 'rejected') return 'me.driver.statusRejected' as const;
  return 'me.driver.statusNone' as const;
}

function coverageSummary(
  driver: HubDriver['driver'],
  t: (k: string, p?: Record<string, string | number>) => string,
): string | null {
  if (!driver?.coverageMode) return null;
  if (driver.coverageMode === 'zone') {
    const zones = (driver.coverageZones ?? []).map((z) => t(`transport.zones.${z}` as 'transport.zones.wilaya')).join(', ');
    return `${driver.coverageOriginHubSlug ?? '—'} → ${zones || '—'}`;
  }
  if (driver.coverageMode === 'flexible') {
    return t(
      driver.coverageScope === 'international'
        ? 'transport.driver.scopeInternational'
        : 'transport.driver.scopeLocal',
    );
  }
  if (driver.frequentRoutes?.length) {
    return driver.frequentRoutes
      .slice(0, 2)
      .map((r) => `${r.origin.nameEs} → ${r.destination.nameEs}`)
      .join(' · ');
  }
  return t('transport.driver.modeCorridors');
}

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

  const claim = async (tripId: string) => {
    setClaimingId(tripId);
    setClaimMsg('');
    try {
      await authFetch(`/transport/${tripId}/claim`, { method: 'POST', body: '{}' });
      setClaimMsg(t('me.driver.claimSuccess'));
      await load();
    } catch (err) {
      setClaimMsg(err instanceof Error ? err.message : t('me.driver.claimError'));
    } finally {
      setClaimingId(null);
    }
  };

  const status = hub?.driverStatus ?? 'none';
  const canOperate = status === 'basic' || status === 'pending' || status === 'verified';
  const tone = statusTone(status);
  const cover = coverageSummary(hub?.driver ?? null, t);

  return (
    <Screen edges={['top']}>
      <Hero kicker={t('me.modules.driver')} title={t('me.driver.title')} subtitle={t('me.driver.subtitle')} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={theme.dune}
          />
        }
      >
        {loading ? (
          <ActivityIndicator color={theme.dune} style={{ marginTop: 24 }} />
        ) : loadError ? (
          <EmptyState
            icon="alert-circle"
            title={t('common.error')}
            actionLabel={t('common.retry')}
            onAction={() => load()}
          />
        ) : status === 'none' ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{t('me.driver.statusNone')}</Text>
            <Text style={styles.panelBody}>{t('me.driver.statusNoneBody')}</Text>
            <Button label={t('me.driver.registerCta')} onPress={() => router.push('/transport/register')} />
          </View>
        ) : (
          <>
            <View style={styles.panel}>
              <View style={[styles.badge, { backgroundColor: tone.bg }]}>
                <Text style={[styles.badgeText, { color: tone.fg }]}>{t(statusTitleKey(status))}</Text>
              </View>
              <Text style={styles.vehicle}>
                {hub?.driver?.vehicleType ?? '—'} · {hub?.driver?.vehiclePlate ?? '—'}
              </Text>
              <Text style={styles.meta}>
                {t('me.driver.seats')}: {hub?.driver?.seatsCapacity ?? 0} · {t('me.driver.rating')}:{' '}
                {(hub?.driver?.rating ?? 0).toFixed(1)} · {t('me.driver.trips')}: {hub?.driver?.totalTrips ?? 0}
              </Text>
              {cover ? (
                <Text style={styles.meta}>
                  {t('me.driver.coverage')}: {cover}
                </Text>
              ) : null}
              {hub?.driver?.contactPhone ? (
                <Text style={styles.meta}>
                  {t('me.driver.phone')}: {hub.driver.contactPhone}
                </Text>
              ) : null}
              {status === 'basic' || status === 'rejected' ? (
                <View style={{ marginTop: 12 }}>
                  <Button
                    label={t('me.driver.verifyCta')}
                    variant="ghost"
                    onPress={() => router.push('/transport/register')}
                  />
                </View>
              ) : (
                <View style={{ marginTop: 12 }}>
                  <Button
                    label={t('me.driver.editProfile')}
                    variant="ghost"
                    onPress={() => router.push('/transport/register')}
                  />
                </View>
              )}
            </View>

            {canOperate ? (
              <>
                <Text style={styles.section}>{t('me.driver.openBoard')}</Text>
                {openBoard.length === 0 ? (
                  <Text style={styles.empty}>{t('me.driver.noOpenTrips')}</Text>
                ) : (
                  openBoard.map((trip) => (
                    <View key={trip.id} style={styles.tripCard}>
                      <Pressable style={{ flex: 1 }} onPress={() => router.push(`/transport/${trip.id}`)}>
                        <Text style={styles.tripRoute}>
                          {trip.originLabel ?? trip.originHubSlug ?? '—'} →{' '}
                          {trip.destinationLabel ?? trip.destinationHubSlug ?? '—'}
                        </Text>
                        <Text style={styles.tripMeta}>{trip.requesterName ?? '—'}</Text>
                      </Pressable>
                      <Pressable
                        style={styles.claimBtn}
                        disabled={claimingId === trip.id}
                        onPress={() => claim(trip.id)}
                      >
                        {claimingId === trip.id ? (
                          <ActivityIndicator color={theme.canvas} size="small" />
                        ) : (
                          <Text style={styles.claimText}>{t('me.driver.claimCta')}</Text>
                        )}
                      </Pressable>
                    </View>
                  ))
                )}
                {claimMsg ? <Text style={styles.claimMsg}>{claimMsg}</Text> : null}

                <Text style={styles.section}>{t('me.driver.myTrips')}</Text>
                {trips.length === 0 ? (
                  <Text style={styles.empty}>{t('me.driver.noOpenTrips')}</Text>
                ) : (
                  trips.map((trip) => (
                    <Pressable
                      key={trip.id}
                      style={styles.tripCard}
                      onPress={() => router.push(`/transport/${trip.id}`)}
                    >
                      <Text style={styles.tripRoute}>
                        {trip.originLabel ?? trip.originHubSlug ?? '—'} →{' '}
                        {trip.destinationLabel ?? trip.destinationHubSlug ?? '—'}
                      </Text>
                      <Text style={styles.tripMeta}>{trip.status}</Text>
                      <AppIcon name="chevron-right" size={16} color={theme.stone} />
                    </Pressable>
                  ))
                )}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 0 },
  panel: {
    marginTop: 8,
    padding: 18,
    borderRadius: radii.lg,
    backgroundColor: theme.sand,
    borderWidth: 1,
    borderColor: theme.line,
    gap: 8,
  },
  panelTitle: { fontFamily: fonts.displaySemi, fontSize: 20, color: theme.ink },
  panelBody: { fontFamily: fonts.body, fontSize: 14, color: theme.inkMuted, lineHeight: 20, marginBottom: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 12 },
  vehicle: { fontFamily: fonts.displaySemi, fontSize: 18, color: theme.ink },
  meta: { fontFamily: fonts.body, fontSize: 13, color: theme.inkMuted },
  section: {
    marginTop: 22,
    marginBottom: 10,
    fontFamily: fonts.displaySemi,
    fontSize: 18,
    color: theme.ink,
  },
  empty: { fontFamily: fonts.body, fontSize: 14, color: theme.stone, marginBottom: 8 },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    marginBottom: 8,
    borderRadius: radii.md,
    backgroundColor: theme.sand,
    borderWidth: 1,
    borderColor: theme.line,
  },
  tripRoute: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 14, color: theme.ink },
  tripMeta: { fontFamily: fonts.body, fontSize: 12, color: theme.stone },
  claimBtn: {
    backgroundColor: theme.dune,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.sm,
    minWidth: 72,
    alignItems: 'center',
  },
  claimText: { fontFamily: fonts.bodySemi, fontSize: 12, color: theme.canvas },
  claimMsg: { marginTop: 8, fontFamily: fonts.body, fontSize: 13, color: theme.inkMuted },
});
