import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  corridorsForScope,
  getTransportHub,
  type TransportRouteScope,
  hubLabel,
} from '@lefrig/shared';
import { fetchApi, unwrapPaginated } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, radii } from '@/lib/theme';
import { AppIcon, type FeatherIconName } from '@/components/AppIcon';
import { HubPickerSheet } from '@/components/transport/HubPickerSheet';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';

type DriverRow = {
  id: string;
  vehicleType: string | null;
  seatsCapacity: number;
  rating: number;
  user: { displayName: string; phone: string | null };
};

const TRIP_MODE_KEYS: {
  id: 'shared_ride' | 'person' | 'package';
  labelKey: string;
  descKey: string;
  icon: FeatherIconName;
}[] = [
  { id: 'shared_ride', labelKey: 'transport.tripModes.shared', descKey: 'transport.tripModes.sharedDesc', icon: 'users' },
  { id: 'person', labelKey: 'transport.tripModes.private', descKey: 'transport.tripModes.privateDesc', icon: 'user' },
  { id: 'package', labelKey: 'transport.tripModes.package', descKey: 'transport.tripModes.packageDesc', icon: 'package' },
];

export default function TransportScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const { scope: scopeParam } = useLocalSearchParams<{ scope?: string }>();
  const { authFetch } = useAuthApi();
  const initialScope: TransportRouteScope =
    scopeParam === 'international' ? 'international' : 'local';

  const [routeScope, setRouteScope] = useState<TransportRouteScope>(initialScope);
  const [originHub, setOriginHub] = useState('rabouni');
  const [destHub, setDestHub] = useState('nouakchott');
  const [seats, setSeats] = useState(1);
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState('');
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [tripCount, setTripCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tripMode, setTripMode] = useState<'shared_ride' | 'person' | 'package'>('shared_ride');
  const [pickerFor, setPickerFor] = useState<'origin' | 'dest' | null>(null);

  const scopeCorridors = useMemo(() => corridorsForScope(routeScope), [routeScope]);

  useEffect(() => {
    if (routeScope === 'international') {
      setOriginHub('madrid');
      setDestHub('rabouni');
    } else {
      setOriginHub('rabouni');
      setDestHub('nouakchott');
    }
  }, [routeScope]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = `originHubSlug=${originHub}&destinationHubSlug=${destHub}&limit=10`;
      const [trips, driverList] = await Promise.all([
        fetchApi<{ data: unknown[] }>(`/transport?${params}`).catch(() => ({ data: [] })),
        fetchApi<DriverRow[]>(`/transport/drivers?${params}`).catch(() => []),
      ]);
      setTripCount(unwrapPaginated(trips as never).length);
      setDrivers(driverList);
    } finally {
      setLoading(false);
    }
  }, [originHub, destHub]);

  useEffect(() => {
    load();
  }, [load]);

  const publish = async () => {
    if (originHub === destHub) {
      Alert.alert(t('transport.routeIncomplete'), t('transport.routeIncomplete'));
      return;
    }
    setSubmitting(true);
    try {
      await authFetch('/transport', {
        method: 'POST',
        body: JSON.stringify({
          type: tripMode,
          originHubSlug: originHub,
          destinationHubSlug: destHub,
          seatsRequested: seats,
          description: note.trim() || `${hubLabel(originHub)} → ${hubLabel(destHub)}`,
          contactPhone: phone.trim() || undefined,
        }),
      });
      Alert.alert(t('transport.tripPublished'), t('transport.tripPublished'));
      setNote('');
      load();
    } catch {
      Alert.alert(t('common.error'), t('transport.sessionError'));
    } finally {
      setSubmitting(false);
    }
  };

  const swap = () => {
    setOriginHub(destHub);
    setDestHub(originHub);
  };

  const origin = getTransportHub(originHub);
  const dest = getTransportHub(destHub);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.heroEyebrow}>{t('transport.kicker')}</Text>
            <Text style={styles.heroAr}>{t('nav.transport')}</Text>
          </View>
          <View style={styles.scopeSwitch}>
            {(['local', 'international'] as const).map((s) => (
              <Pressable
                key={s}
                style={[styles.scopeTab, routeScope === s && styles.scopeTabOn]}
                onPress={() => setRouteScope(s)}
              >
                <Text style={[styles.scopeTabText, routeScope === s && styles.scopeTabTextOn]}>
                  {s === 'local' ? t('transport.tabLocal') : t('transport.tabEurope')}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.routeCard}>
          <View style={styles.routeRows}>
            <Pressable style={styles.routeRow} onPress={() => setPickerFor('origin')}>
              <View style={styles.dotOrigin} />
              <View style={styles.routeCopy}>
                <Text style={styles.routeLabel}>{t('transport.from')}</Text>
                <Text style={styles.routeValue} numberOfLines={1}>
                  {origin ? `${origin.flag} ${pickName(locale, origin)}` : t('transport.pickOrigin')}
                </Text>
              </View>
              <AppIcon name="chevron-down" size={16} color={theme.inkSoft} />
            </Pressable>

            <View style={styles.routeDivider}>
              <View style={styles.routeLine} />
            </View>

            <Pressable style={styles.routeRow} onPress={() => setPickerFor('dest')}>
              <View style={styles.dotDest} />
              <View style={styles.routeCopy}>
                <Text style={styles.routeLabel}>{t('transport.to')}</Text>
                <Text style={styles.routeValue} numberOfLines={1}>
                  {dest ? `${dest.flag} ${pickName(locale, dest)}` : t('transport.pickDest')}
                </Text>
              </View>
              <AppIcon name="chevron-down" size={16} color={theme.inkSoft} />
            </Pressable>
          </View>

          <Pressable style={styles.swapBtn} onPress={swap} hitSlop={8}>
            <AppIcon name="repeat" size={16} color={theme.oasisDeep} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.corrRow}>
          {scopeCorridors.map((c) => {
            const active = originHub === c.origin && destHub === c.destination;
            return (
              <Pressable
                key={c.labelEs}
                style={[styles.corrChip, active && styles.corrChipOn]}
                onPress={() => {
                  setOriginHub(c.origin);
                  setDestHub(c.destination);
                }}
              >
                <AppIcon name="zap" size={12} color={active ? theme.pearl : theme.dune} />
                <Text style={[styles.corrText, active && styles.corrTextOn]}>{c.labelEs}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.modeRow}>
          {TRIP_MODE_KEYS.map((m) => {
            const on = tripMode === m.id;
            return (
              <Pressable
                key={m.id}
                style={[styles.modeCard, on && styles.modeCardOn]}
                onPress={() => setTripMode(m.id)}
              >
                <View style={[styles.modeIcon, on && styles.modeIconOn]}>
                  <AppIcon name={m.icon} size={20} color={on ? theme.pearl : theme.oasisDeep} />
                </View>
                <Text style={[styles.modeLabel, on && styles.modeLabelOn]}>{t(m.labelKey)}</Text>
                <Text style={styles.modeDesc}>{t(m.descKey)}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailInfo}>
              <AppIcon name={tripMode === 'package' ? 'box' : 'users'} size={16} color={theme.inkMuted} />
              <Text style={styles.detailLabel}>{tripMode === 'package' ? t('transport.parcels') : t('transport.seatsLabel')}</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                style={[styles.stepBtn, seats <= 1 && styles.stepBtnOff]}
                onPress={() => setSeats((s) => Math.max(1, s - 1))}
              >
                <AppIcon name="minus" size={16} color={seats <= 1 ? theme.inkSoft : theme.ink} />
              </Pressable>
              <Text style={styles.stepValue}>{seats}</Text>
              <Pressable
                style={[styles.stepBtn, seats >= 8 && styles.stepBtnOff]}
                onPress={() => setSeats((s) => Math.min(8, s + 1))}
              >
                <AppIcon name="plus" size={16} color={seats >= 8 ? theme.inkSoft : theme.ink} />
              </Pressable>
            </View>
          </View>

          <View style={styles.detailSeparator} />

          <View style={styles.inputRow}>
            <AppIcon name="phone" size={16} color={theme.inkMuted} />
            <TextInput
              style={styles.inputInner}
              value={phone}
              onChangeText={setPhone}
              placeholder={`${t('auth.phonePlaceholder')} (${t('common.optional')})`}
              placeholderTextColor={theme.inkSoft}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.detailSeparator} />

          <View style={styles.inputRow}>
            <AppIcon name="edit-3" size={16} color={theme.inkMuted} />
            <TextInput
              style={styles.inputInner}
              value={note}
              onChangeText={setNote}
              placeholder={`${t('publish.contactNote')} (${t('common.optional')})`}
              placeholderTextColor={theme.inkSoft}
            />
          </View>
        </View>

        <Pressable
          style={[styles.publishBtn, submitting && styles.disabled]}
          onPress={publish}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={theme.pearl} />
          ) : (
            <>
              <AppIcon name="navigation" size={18} color={theme.pearl} />
              <Text style={styles.publishText}>{t('transport.searchDriver')}</Text>
            </>
          )}
        </Pressable>

        <View style={styles.trustLine}>
          <AppIcon name="shield" size={12} color={theme.inkMuted} />
          <Text style={styles.hint}>{t('transport.noPaymentsHint')}</Text>
        </View>

        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>{t('transport.driversOnRoute')}</Text>
          {!loading ? (
            <View style={styles.resultBadge}>
              <Text style={styles.resultBadgeText}>{drivers.length}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.resultSub}>
          {hubLabel(originHub)} → {hubLabel(destHub)}
          {tripCount > 0 ? ` · ${tripCount} viajero${tripCount === 1 ? '' : 's'} esperando` : ''}
        </Text>

        {loading ? (
          <ActivityIndicator color={theme.dune} style={{ marginVertical: 24 }} />
        ) : drivers.length === 0 ? (
          <View style={styles.noDrivers}>
            <View style={styles.noDriversIcon}>
              <AppIcon name="truck" size={24} color={theme.dune} />
            </View>
            <Text style={styles.noDriversTitle}>{t('transport.noDrivers')}</Text>
            <Text style={styles.noDriversSub}>{t('transport.noDriversSub')}</Text>
          </View>
        ) : (
          drivers.map((d) => {
            const initial = d.user.displayName.trim()[0]?.toUpperCase() ?? '·';
            const waPhone = d.user.phone?.replace(/[^\d+]/g, '');
            return (
              <View key={d.id} style={styles.driverCard}>
                <View style={styles.driverAvatar}>
                  <Text style={styles.driverInitial}>{initial}</Text>
                </View>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName} numberOfLines={1}>
                    {d.user.displayName}
                  </Text>
                  <Text style={styles.driverMeta} numberOfLines={1}>
                    {d.vehicleType ?? t('transport.driver.vehicle')} · {t('transport.seats', { count: d.seatsCapacity })}
                  </Text>
                  <View style={styles.ratingPill}>
                    <AppIcon name="star" size={11} color={theme.dune} />
                    <Text style={styles.ratingText}>{d.rating.toFixed(1)}</Text>
                  </View>
                </View>
                {d.user.phone ? (
                  <View style={styles.driverActions}>
                    <Pressable
                      style={styles.callBtn}
                      onPress={() => Linking.openURL(`tel:${d.user.phone}`)}
                    >
                      <AppIcon name="phone" size={17} color={theme.pearl} />
                    </Pressable>
                    {waPhone ? (
                      <Pressable
                        style={styles.waBtn}
                        onPress={() => Linking.openURL(`https://wa.me/${waPhone.replace('+', '')}`)}
                      >
                        <AppIcon name="message-circle" size={17} color={theme.oasisDeep} />
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })
        )}

        <Pressable style={styles.banner} onPress={() => router.push('/transport/tindouf')}>
          <View style={[styles.bannerIcon, { backgroundColor: 'rgba(168,132,45,0.12)' }]}>
            <AppIcon name="map-pin" size={20} color={theme.dune} />
          </View>
          <View style={styles.bannerCopy}>
            <Text style={styles.bannerTitle}>{t('transport.tindoufShuttle')}</Text>
            <Text style={styles.bannerSub}>{t('transport.tindoufSub')}</Text>
          </View>
          <AppIcon name="chevron-right" size={18} color={theme.inkSoft} />
        </Pressable>

        <Pressable style={styles.banner} onPress={() => router.push('/transport/register')}>
          <View style={[styles.bannerIcon, { backgroundColor: 'rgba(45,138,98,0.1)' }]}>
            <AppIcon name="truck" size={20} color={theme.oasisDeep} />
          </View>
          <View style={styles.bannerCopy}>
            <Text style={styles.bannerTitle}>{t('transport.driveWithLefrig')}</Text>
            <Text style={styles.bannerSub}>{t('transport.driver.trustLine')}</Text>
          </View>
          <AppIcon name="chevron-right" size={18} color={theme.inkSoft} />
        </Pressable>
      </ScrollView>

      <HubPickerSheet
        visible={pickerFor === 'origin'}
        title={t('transport.pickOriginTitle')}
        scope={routeScope}
        selectedSlug={originHub}
        onSelect={setOriginHub}
        onClose={() => setPickerFor(null)}
      />
      <HubPickerSheet
        visible={pickerFor === 'dest'}
        title={t('transport.pickDestTitle')}
        scope={routeScope}
        selectedSlug={destHub}
        onSelect={setDestHub}
        onClose={() => setPickerFor(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.canvas,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 4,
  },
  heroEyebrow: { fontSize: 10, fontWeight: '800', color: theme.dune, letterSpacing: 2 },
  heroAr: { fontSize: 30, fontWeight: '900', color: theme.ink, writingDirection: 'rtl', marginTop: 2 },
  scopeSwitch: {
    flexDirection: 'row',
    backgroundColor: theme.canvasSoft,
    borderRadius: radii.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  scopeTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.pill },
  scopeTabOn: {
    backgroundColor: theme.surface,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  scopeTabText: { fontSize: 13, fontWeight: '700', color: theme.inkMuted },
  scopeTabTextOn: { color: theme.ink, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 120 },

  routeCard: {
    backgroundColor: theme.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  routeRows: { flex: 1 },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  dotOrigin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.oasis,
    borderWidth: 3,
    borderColor: 'rgba(45,138,98,0.25)',
  },
  dotDest: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: theme.flare,
    borderWidth: 3,
    borderColor: 'rgba(196,92,58,0.25)',
  },
  routeCopy: { flex: 1 },
  routeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.inkSoft,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  routeValue: { fontSize: 16, fontWeight: '800', color: theme.ink, marginTop: 2 },
  routeDivider: { paddingLeft: 23 },
  routeLine: {
    width: 2,
    height: 18,
    backgroundColor: theme.borderStrong,
    borderRadius: 1,
    marginVertical: -12,
  },
  swapBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(45,138,98,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45,138,98,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  corrRow: { gap: 8, paddingVertical: 14, paddingRight: 8 },
  corrChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  corrChipOn: { backgroundColor: theme.dune, borderColor: theme.dune },
  corrText: { fontSize: 12.5, fontWeight: '700', color: theme.ink },
  corrTextOn: { color: theme.pearl },

  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  modeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: radii.lg,
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  modeCardOn: {
    borderColor: theme.oasisDeep,
    backgroundColor: 'rgba(45,138,98,0.06)',
    shadowColor: theme.oasisDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  modeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(45,138,98,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modeIconOn: { backgroundColor: theme.oasisDeep },
  modeLabel: { fontSize: 13, fontWeight: '800', color: theme.inkMuted },
  modeLabelOn: { color: theme.oasisDeep },
  modeDesc: { fontSize: 10, color: theme.inkSoft, marginTop: 2 },

  detailCard: {
    backgroundColor: theme.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailLabel: { fontSize: 14, fontWeight: '700', color: theme.ink },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.canvasSoft,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnOff: { opacity: 0.4 },
  stepValue: { fontSize: 17, fontWeight: '800', color: theme.ink, minWidth: 22, textAlign: 'center' },
  detailSeparator: { height: 1, backgroundColor: theme.border },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  inputInner: { flex: 1, paddingVertical: 12, fontSize: 14, color: theme.ink, fontWeight: '500' },

  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.oasisDeep,
    paddingVertical: 17,
    borderRadius: radii.lg,
    shadowColor: theme.oasisDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  publishText: { fontWeight: '800', color: theme.pearl, fontSize: 16.5 },
  disabled: { opacity: 0.7 },
  trustLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 22,
  },
  hint: { color: theme.inkMuted, fontSize: 12 },

  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultTitle: { fontSize: 17, fontWeight: '800', color: theme.ink, letterSpacing: -0.3 },
  resultBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(45,138,98,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  resultBadgeText: { fontSize: 12, fontWeight: '800', color: theme.oasisDeep },
  resultSub: { fontSize: 12.5, color: theme.inkMuted, marginTop: 3, marginBottom: 12 },

  noDrivers: {
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 20,
    borderRadius: radii.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
    gap: 6,
    marginBottom: 8,
  },
  noDriversIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(168,132,45,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  noDriversTitle: { fontSize: 15, fontWeight: '800', color: theme.ink },
  noDriversSub: { fontSize: 12.5, color: theme.inkMuted, textAlign: 'center', maxWidth: 250 },

  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: theme.surface,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(45,138,98,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInitial: { fontSize: 19, fontWeight: '800', color: theme.oasisDeep },
  driverInfo: { flex: 1 },
  driverName: { fontWeight: '800', fontSize: 15.5, color: theme.ink },
  driverMeta: { color: theme.inkMuted, marginTop: 2, fontSize: 12.5 },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(168,132,45,0.1)',
  },
  ratingText: { fontSize: 11.5, fontWeight: '800', color: theme.dune },
  driverActions: { gap: 8 },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.oasisDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(45,138,98,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45,138,98,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 10,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCopy: { flex: 1 },
  bannerTitle: { fontWeight: '800', color: theme.ink, fontSize: 14.5 },
  bannerSub: { color: theme.inkMuted, fontSize: 12, marginTop: 2 },
});
