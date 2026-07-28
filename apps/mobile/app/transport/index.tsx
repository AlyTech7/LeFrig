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
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  assertRouteMatchesScope,
  corridorsForScope,
  getTransportHub,
  type TransportRouteScope,
  hubLabel,
  DEFAULT_TRANSPORT_PHONE_DIAL,
  TRANSPORT_PHONE_LOCAL_DIGITS,
  TRANSPORT_PHONE_PREFIXES,
  buildTransportContactPhone,
  sanitizeTransportLocalPhone,
  type TransportPhoneDial,
} from '@lefrig/shared';
import { fetchApi, unwrapPaginated } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';
import { AppIcon, type FeatherIconName } from '@/components/AppIcon';
import { HubPickerSheet } from '@/components/transport/HubPickerSheet';
import { CountryFlag } from '@/components/CountryFlag';
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
  const { locale, dir } = useLocale();
  const { scope: scopeParam, origin: originParam, dest: destParam } = useLocalSearchParams<{
    scope?: string;
    origin?: string;
    dest?: string;
  }>();
  const { authFetch } = useAuthApi();
  const initialScope: TransportRouteScope =
    scopeParam === 'international' ? 'international' : 'local';

  const [routeScope, setRouteScope] = useState<TransportRouteScope>(initialScope);
  const [originHub, setOriginHub] = useState(originParam || (initialScope === 'international' ? 'madrid' : 'rabouni'));
  const [destHub, setDestHub] = useState(destParam || (initialScope === 'international' ? 'rabouni' : 'tindouf'));
  const [seats, setSeats] = useState(1);
  const [note, setNote] = useState('');
  const [phoneDial, setPhoneDial] = useState<TransportPhoneDial>(DEFAULT_TRANSPORT_PHONE_DIAL);
  const [phoneLocal, setPhoneLocal] = useState('');
  const [priceEstimate, setPriceEstimate] = useState('');
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [tripCount, setTripCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tripMode, setTripMode] = useState<'shared_ride' | 'person' | 'package'>('shared_ride');
  const [pickerFor, setPickerFor] = useState<'origin' | 'dest' | null>(null);

  const scopeCorridors = useMemo(() => corridorsForScope(routeScope), [routeScope]);

  useEffect(() => {
    if (originParam || destParam) return;
    if (routeScope === 'international') {
      setOriginHub('madrid');
      setDestHub('rabouni');
    } else {
      setOriginHub('rabouni');
      setDestHub('tindouf');
    }
  }, [routeScope, originParam, destParam]);

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
      Alert.alert(t('transport.routeIncomplete'), t('transport.connect.errors.sameHub'));
      return;
    }
    const check = assertRouteMatchesScope(routeScope, originHub, destHub);
    if (!check.ok) {
      Alert.alert(
        t('common.error'),
        routeScope === 'local'
          ? t('transport.connect.errors.localScope')
          : t('transport.connect.errors.intlScope'),
      );
      return;
    }
    setSubmitting(true);
    try {
      let contactPhone: string | undefined;
      try {
        contactPhone = buildTransportContactPhone(phoneDial, phoneLocal);
      } catch {
        Alert.alert(
          t('common.error'),
          t('transport.connect.errors.phoneDigits', { count: TRANSPORT_PHONE_LOCAL_DIGITS }),
        );
        setSubmitting(false);
        return;
      }
      const price = priceEstimate.trim() ? Number(priceEstimate) : undefined;
      const created = await authFetch<{ id: string }>('/transport', {
        method: 'POST',
        body: JSON.stringify({
          type: tripMode,
          scope: routeScope,
          originHubSlug: originHub,
          destinationHubSlug: destHub,
          seatsRequested: seats,
          description: note.trim() || `${hubLabel(originHub)} → ${hubLabel(destHub)}`,
          contactPhone,
          priceEstimate: price && Number.isFinite(price) && price > 0 ? price : undefined,
        }),
      });
      setPublishedId(created.id);
      Alert.alert(t('transport.tripPublished'), t('transport.tripPublished'));
      setNote('');
      setPriceEstimate('');
      setPhoneLocal('');
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
  const rtl = dir === 'rtl';

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#f7f2e8', theme.canvas, '#f3efe6']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <SafeAreaView edges={['top']}>
          <View style={styles.hero}>
            <Text style={styles.kicker}>{t('transport.kicker')}</Text>
            <Text style={[styles.title, rtl && styles.rtl]} accessibilityRole="header">
              {t('nav.transport')}
            </Text>
            <View style={styles.brandRule} />

            <View style={styles.scopeRow}>
              {(['local', 'international'] as const).map((s) => {
                const on = routeScope === s;
                return (
                  <Pressable key={s} onPress={() => setRouteScope(s)} style={styles.scopeTab}>
                    <Text style={[styles.scopeText, on && styles.scopeTextOn]}>
                      {s === 'local' ? t('transport.tabLocal') : t('transport.tabEurope')}
                    </Text>
                    {on ? <View style={styles.scopeUnderline} /> : <View style={styles.scopeUnderlineGhost} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </SafeAreaView>

        {/* Ruta — bloque editorial */}
        <View style={styles.routeBlock}>
          <View style={styles.routeBody}>
            <View style={styles.routeRails}>
              <View style={[styles.dot, styles.dotOrigin]} />
              <View style={styles.railLine} />
              <View style={[styles.dot, styles.dotDest]} />
            </View>

            <View style={styles.routeCols}>
              <Pressable style={styles.routeRow} onPress={() => setPickerFor('origin')}>
                <View style={styles.routeCopy}>
                  <Text style={styles.routeLabel}>{t('transport.from')}</Text>
                  <View style={styles.routeValueRow}>
                    {origin ? <CountryFlag country={origin.country} size={15} /> : null}
                    <Text style={styles.routeValue} numberOfLines={1}>
                      {origin ? pickName(locale, origin) : t('transport.pickOrigin')}
                    </Text>
                  </View>
                </View>
                <AppIcon name="chevron-down" size={16} color={theme.inkSoft} />
              </Pressable>

              <Pressable style={styles.routeRow} onPress={() => setPickerFor('dest')}>
                <View style={styles.routeCopy}>
                  <Text style={styles.routeLabel}>{t('transport.to')}</Text>
                  <View style={styles.routeValueRow}>
                    {dest ? <CountryFlag country={dest.country} size={15} /> : null}
                    <Text style={styles.routeValue} numberOfLines={1}>
                      {dest ? pickName(locale, dest) : t('transport.pickDest')}
                    </Text>
                  </View>
                </View>
                <AppIcon name="chevron-down" size={16} color={theme.inkSoft} />
              </Pressable>
            </View>

            <Pressable style={styles.swapBtn} onPress={swap} hitSlop={8}>
              <AppIcon name="repeat" size={15} color={theme.dune} />
            </Pressable>
          </View>
        </View>

        {/* Corredores rápidos */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.corrRow}>
          {scopeCorridors.map((c) => {
            const active = originHub === c.origin && destHub === c.destination;
            return (
              <Pressable
                key={c.labelEs}
                style={styles.corrItem}
                onPress={() => {
                  setOriginHub(c.origin);
                  setDestHub(c.destination);
                }}
              >
                <Text style={[styles.corrText, active && styles.corrTextOn]}>{c.labelEs}</Text>
                {active ? <View style={styles.corrRule} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Modo de viaje */}
        <Text style={styles.sectionLabel}>{t('transport.type')}</Text>
        <View style={styles.modeList}>
          {TRIP_MODE_KEYS.map((m) => {
            const on = tripMode === m.id;
            return (
              <Pressable
                key={m.id}
                style={[styles.modeRow, on && styles.modeRowOn]}
                onPress={() => setTripMode(m.id)}
              >
                <View style={[styles.modeIcon, on && styles.modeIconOn]}>
                  <AppIcon name={m.icon} size={18} color={on ? theme.pearl : theme.dune} />
                </View>
                <View style={styles.modeCopy}>
                  <Text style={[styles.modeLabel, on && styles.modeLabelOn]}>{t(m.labelKey)}</Text>
                  <Text style={styles.modeDesc}>{t(m.descKey)}</Text>
                </View>
                <View style={[styles.modeCheck, on && styles.modeCheckOn]}>
                  {on ? <AppIcon name="check" size={12} color={theme.pearl} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Detalle */}
        <View style={styles.detailBlock}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {tripMode === 'package' ? t('transport.parcels') : t('transport.seatsLabel')}
            </Text>
            <View style={styles.stepper}>
              <Pressable
                style={[styles.stepBtn, seats <= 1 && styles.stepBtnOff]}
                onPress={() => setSeats((s) => Math.max(1, s - 1))}
              >
                <AppIcon name="minus" size={15} color={seats <= 1 ? theme.inkSoft : theme.ink} />
              </Pressable>
              <Text style={styles.stepValue}>{seats}</Text>
              <Pressable
                style={[styles.stepBtn, seats >= 8 && styles.stepBtnOff]}
                onPress={() => setSeats((s) => Math.min(8, s + 1))}
              >
                <AppIcon name="plus" size={15} color={seats >= 8 ? theme.inkSoft : theme.ink} />
              </Pressable>
            </View>
          </View>

          <View style={styles.hairline} />

          <Text style={styles.fieldLabel}>{t('transport.connect.phone')}</Text>
          <View style={styles.dialWrap}>
            {TRANSPORT_PHONE_PREFIXES.map((p) => (
              <Pressable
                key={p.dial}
                style={[styles.dialChip, phoneDial === p.dial && styles.dialChipOn]}
                onPress={() => setPhoneDial(p.dial)}
              >
                <Text style={[styles.dialChipText, phoneDial === p.dial && styles.dialChipTextOn]}>
                  {p.dial}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.phoneLocal}
            value={phoneLocal}
            onChangeText={(v) => setPhoneLocal(sanitizeTransportLocalPhone(v))}
            placeholder={t('transport.connect.phonePlaceholder')}
            placeholderTextColor={theme.inkSoft}
            keyboardType="number-pad"
            maxLength={TRANSPORT_PHONE_LOCAL_DIGITS}
          />
          <Text style={styles.phoneHint}>
            {t('transport.connect.phoneDigitsHint', { count: TRANSPORT_PHONE_LOCAL_DIGITS })}
          </Text>

          <View style={styles.hairline} />

          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder={`${t('publish.contactNote')} (${t('common.optional')})`}
            placeholderTextColor={theme.inkSoft}
          />

          <View style={styles.hairline} />

          <TextInput
            style={styles.input}
            value={priceEstimate}
            onChangeText={setPriceEstimate}
            placeholder={t('transport.connect.priceOptional')}
            placeholderTextColor={theme.inkSoft}
            keyboardType="numeric"
          />
        </View>

        {publishedId ? (
          <Pressable
            style={styles.secondaryCta}
            onPress={() => router.push(`/transport/${publishedId}` as never)}
          >
            <Text style={styles.secondaryCtaText}>{t('transport.connect.openTrip')}</Text>
            <AppIcon name="arrow-right" size={15} color={theme.dune} />
          </Pressable>
        ) : null}

        <Pressable
          style={[styles.publishBtn, submitting && styles.disabled]}
          onPress={publish}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={theme.pearl} />
          ) : (
            <>
              <AppIcon name="navigation" size={17} color={theme.pearl} />
              <Text style={styles.publishText}>{t('transport.searchDriver')}</Text>
            </>
          )}
        </Pressable>

        <View style={styles.trustLine}>
          <AppIcon name="shield" size={12} color={theme.inkSoft} />
          <Text style={styles.hint}>{t('transport.noPaymentsHint')}</Text>
        </View>

        {/* Conductores */}
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>{t('transport.driversOnRoute')}</Text>
          {!loading && drivers.length > 0 ? (
            <Text style={styles.resultCount}>{drivers.length}</Text>
          ) : null}
        </View>
        <Text style={styles.resultSub}>
          {hubLabel(originHub)} → {hubLabel(destHub)}
          {tripCount > 0 ? ` · ${tripCount} viajero${tripCount === 1 ? '' : 's'} esperando` : ''}
        </Text>

        {loading ? (
          <ActivityIndicator color={theme.dune} style={{ marginVertical: 28 }} />
        ) : drivers.length === 0 ? (
          <View style={styles.noDrivers}>
            <AppIcon name="truck" size={22} color={theme.dune} />
            <Text style={styles.noDriversTitle}>{t('transport.noDrivers')}</Text>
            <Text style={styles.noDriversSub}>{t('transport.noDriversSub')}</Text>
          </View>
        ) : (
          drivers.map((d, i) => {
            const initial = d.user.displayName.trim()[0]?.toUpperCase() ?? '·';
            const waPhone = d.user.phone?.replace(/[^\d+]/g, '');
            return (
              <View key={d.id} style={[styles.driverRow, i === 0 && styles.driverRowFirst]}>
                <View style={styles.driverAvatar}>
                  <Text style={styles.driverInitial}>{initial}</Text>
                </View>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName} numberOfLines={1}>
                    {d.user.displayName}
                  </Text>
                  <Text style={styles.driverMeta} numberOfLines={1}>
                    {d.vehicleType ?? t('transport.driver.vehicle')} ·{' '}
                    {t('transport.seats', { count: d.seatsCapacity })} · {d.rating.toFixed(1)}
                  </Text>
                </View>
                {d.user.phone ? (
                  <View style={styles.driverActions}>
                    <Pressable style={styles.callBtn} onPress={() => Linking.openURL(`tel:${d.user.phone}`)}>
                      <AppIcon name="phone" size={15} color={theme.pearl} />
                    </Pressable>
                    {waPhone ? (
                      <Pressable
                        style={styles.waBtn}
                        onPress={() => Linking.openURL(`https://wa.me/${waPhone.replace('+', '')}`)}
                      >
                        <AppIcon name="message-circle" size={15} color={theme.dune} />
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })
        )}

        <View style={styles.links}>
          <Pressable style={styles.linkRow} onPress={() => router.push('/transport/tindouf')}>
            <Text style={styles.linkTitle}>{t('transport.tindoufShuttle')}</Text>
            <AppIcon name="arrow-right" size={15} color={theme.dune} />
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/transport/garage')}>
            <Text style={styles.linkTitle}>{t('me.driver.title')}</Text>
            <AppIcon name="arrow-right" size={15} color={theme.dune} />
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/transport/register')}>
            <Text style={styles.linkTitle}>{t('transport.driveWithLefrig')}</Text>
            <AppIcon name="arrow-right" size={15} color={theme.dune} />
          </Pressable>
        </View>
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
  content: { paddingBottom: 120 },
  hero: {
    paddingHorizontal: space.lg,
    paddingTop: 8,
    paddingBottom: 4,
  },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.dune,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 36,
    letterSpacing: -1,
    color: theme.ink,
    marginTop: 6,
    lineHeight: 40,
  },
  brandRule: {
    width: 36,
    height: 2,
    backgroundColor: theme.dune,
    marginTop: 12,
    borderRadius: 1,
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  scopeRow: {
    flexDirection: 'row',
    gap: 22,
    marginTop: 18,
  },
  scopeTab: { paddingBottom: 2 },
  scopeText: {
    fontFamily: fonts.bodyMed,
    fontSize: 14,
    color: theme.inkSoft,
  },
  scopeTextOn: {
    fontFamily: fonts.bodyBold,
    color: theme.ink,
  },
  scopeUnderline: {
    height: 2,
    backgroundColor: theme.dune,
    marginTop: 8,
    borderRadius: 1,
  },
  scopeUnderlineGhost: { height: 2, marginTop: 8 },

  routeBlock: {
    marginHorizontal: space.lg,
    marginTop: 22,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.borderStrong,
  },
  routeBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeRails: {
    width: 14,
    alignItems: 'center',
    paddingVertical: 18,
    alignSelf: 'stretch',
  },
  routeCols: { flex: 1 },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotOrigin: { backgroundColor: theme.oasis },
  dotDest: { backgroundColor: theme.flare, borderRadius: 2 },
  railLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: theme.borderStrong,
    marginVertical: 4,
  },
  routeCopy: { flex: 1 },
  routeLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.inkSoft,
  },
  routeValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  routeValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: theme.ink,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  swapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },

  corrRow: {
    gap: 20,
    paddingHorizontal: space.lg,
    paddingTop: 16,
    paddingBottom: 8,
  },
  corrItem: { paddingBottom: 4 },
  corrText: {
    fontFamily: fonts.bodyMed,
    fontSize: 13,
    color: theme.inkSoft,
  },
  corrTextOn: {
    fontFamily: fonts.bodyBold,
    color: theme.dune,
  },
  corrRule: {
    height: 1.5,
    backgroundColor: theme.dune,
    marginTop: 6,
  },

  sectionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.dune,
    marginHorizontal: space.lg,
    marginTop: 18,
    marginBottom: 10,
  },
  modeList: {
    marginHorizontal: space.lg,
    gap: 8,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modeRowOn: {
    borderColor: theme.dune,
    backgroundColor: 'rgba(168,132,45,0.06)',
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(168,132,45,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconOn: { backgroundColor: theme.dune },
  modeCopy: { flex: 1 },
  modeLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: theme.inkMuted,
  },
  modeLabelOn: { color: theme.ink },
  modeDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: theme.inkSoft,
    marginTop: 2,
    lineHeight: 16,
  },
  modeCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeCheckOn: {
    backgroundColor: theme.dune,
    borderColor: theme.dune,
  },

  detailBlock: {
    marginHorizontal: space.lg,
    marginTop: 22,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: theme.borderStrong,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  detailLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: theme.ink,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: theme.canvasSoft,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnOff: { opacity: 0.35 },
  stepValue: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: theme.ink,
    minWidth: 24,
    textAlign: 'center',
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.borderStrong,
  },
  fieldLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: theme.inkMuted,
    marginTop: 14,
    marginBottom: 8,
  },
  dialWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dialChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: theme.border,
  },
  dialChipOn: {
    borderColor: theme.dune,
    backgroundColor: 'rgba(168,132,45,0.1)',
  },
  dialChipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: theme.inkMuted,
  },
  dialChipTextOn: { color: theme.ink },
  phoneLocal: {
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderStrong,
    paddingVertical: 12,
    fontFamily: fonts.bodySemi,
    fontSize: 17,
    color: theme.ink,
    letterSpacing: 1.2,
  },
  phoneHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: theme.inkSoft,
    marginTop: 6,
    marginBottom: 8,
  },
  input: {
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: theme.ink,
  },

  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: space.lg,
    marginTop: 18,
    paddingVertical: 10,
  },
  secondaryCtaText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: theme.dune,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: space.lg,
    marginTop: 14,
    backgroundColor: theme.dune,
    paddingVertical: 16,
    borderRadius: radii.md,
  },
  publishText: {
    fontFamily: fonts.bodyBold,
    color: theme.pearl,
    fontSize: 16,
  },
  disabled: { opacity: 0.7 },
  trustLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 28,
    paddingHorizontal: space.lg,
  },
  hint: {
    fontFamily: fonts.body,
    color: theme.inkSoft,
    fontSize: 12,
  },

  resultHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginHorizontal: space.lg,
  },
  resultTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -0.5,
    color: theme.ink,
  },
  resultCount: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: theme.dune,
  },
  resultSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: theme.inkMuted,
    marginHorizontal: space.lg,
    marginTop: 4,
    marginBottom: 14,
  },

  noDrivers: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: space.lg,
    gap: 8,
  },
  noDriversTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: theme.ink,
    marginTop: 4,
  },
  noDriversSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: theme.inkMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 19,
  },

  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: space.lg,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  driverRowFirst: { borderTopColor: theme.borderStrong },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168,132,45,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInitial: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: theme.dune,
  },
  driverInfo: { flex: 1 },
  driverName: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: theme.ink,
  },
  driverMeta: {
    fontFamily: fonts.body,
    color: theme.inkMuted,
    marginTop: 3,
    fontSize: 12,
  },
  driverActions: { flexDirection: 'row', gap: 8 },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.oasisDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },

  links: {
    marginHorizontal: space.lg,
    marginTop: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: theme.borderStrong,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  linkTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: theme.ink,
  },
});
