import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { CampSummary } from '@lefrig/shared';
import { AppIcon, type FeatherIconName } from '@/components/AppIcon';
import { CampPickerSheet } from '@/components/transport/CampPickerSheet';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { fetchWithMeta } from '@/lib/api';
import { ApiError, useAuthApi } from '@/lib/useAuthApi';
import { theme, radii } from '@/lib/theme';

type VehicleType = 'car' | 'pickup' | 'van' | 'truck' | 'motorcycle';
type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

type DriverProfile = {
  vehicleType: string | null;
  vehiclePlate: string | null;
  licenseNumber: string | null;
  seatsCapacity: number;
  isVerified: boolean;
  rating: number;
  totalTrips: number;
  frequentRoutes: {
    originCampId: string;
    destinationCampId: string;
    frequency: string;
    originCamp: { nameEs: string };
    destinationCamp: { nameEs: string };
  }[];
};

const VEHICLE_TYPE_KEYS: { value: VehicleType; labelKey: string; emoji: string }[] = [
  { value: 'car', labelKey: 'transport.vehicleTypes.car', emoji: '🚗' },
  { value: 'pickup', labelKey: 'transport.vehicleTypes.car', emoji: '🛻' },
  { value: 'van', labelKey: 'transport.vehicleTypes.van', emoji: '🚐' },
  { value: 'truck', labelKey: 'transport.vehicleTypes.truck', emoji: '🚛' },
  { value: 'motorcycle', labelKey: 'transport.vehicleTypes.car', emoji: '🏍️' },
];

const FREQUENCY_KEYS: { value: Frequency; labelKey: string }[] = [
  { value: 'daily', labelKey: 'transport.frequency.daily' },
  { value: 'weekly', labelKey: 'transport.frequency.weekly' },
  { value: 'biweekly', labelKey: 'transport.frequency.weekly' },
  { value: 'monthly', labelKey: 'transport.frequency.occasional' },
];

const BENEFIT_KEYS: { icon: FeatherIconName; titleKey: string; subKey: string }[] = [
  { icon: 'dollar-sign', titleKey: 'transport.driver.trustLine', subKey: 'transport.noPaymentsHint' },
  { icon: 'users', titleKey: 'nav.community', subKey: 'transport.driver.kicker' },
  { icon: 'map', titleKey: 'transport.driver.route', subKey: 'transport.tindoufSub' },
];

export default function DriverRegisterScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const { authFetch, isSignedIn, syncUser } = useAuthApi();

  const [camps, setCamps] = useState<CampSummary[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existing, setExisting] = useState<DriverProfile | null>(null);
  const [pickerFor, setPickerFor] = useState<'origin' | 'dest' | null>(null);

  const [form, setForm] = useState({
    vehicleType: 'pickup' as VehicleType,
    vehiclePlate: '',
    licenseNumber: '',
    seatsCapacity: 4,
    originCampId: '',
    destinationCampId: '',
    frequency: 'weekly' as Frequency,
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const [campsRes, profile] = await Promise.all([
          fetchWithMeta<CampSummary[]>('/camps', []),
          isSignedIn
            ? authFetch<DriverProfile>('/transport/drivers/me').catch((err) => {
                if (err instanceof ApiError && err.status === 404) return null;
                return null;
              })
            : Promise.resolve(null),
        ]);

        if (cancelled) return;

        const list = campsRes.data;
        setCamps(list);
        setExisting(profile);

        if (profile) {
          const route = profile.frequentRoutes[0];
          setForm({
            vehicleType: (profile.vehicleType as VehicleType) ?? 'pickup',
            vehiclePlate: profile.vehiclePlate ?? '',
            licenseNumber: profile.licenseNumber ?? '',
            seatsCapacity: profile.seatsCapacity,
            originCampId: route?.originCampId ?? list[0]?.id ?? '',
            destinationCampId: route?.destinationCampId ?? list[1]?.id ?? list[0]?.id ?? '',
            frequency: (route?.frequency as Frequency) ?? 'weekly',
          });
        } else {
          setForm((f) => ({
            ...f,
            originCampId: f.originCampId || list[0]?.id || '',
            destinationCampId: f.destinationCampId || list[1]?.id || list[0]?.id || '',
          }));
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [authFetch, isSignedIn]);

  const originCamp = camps.find((c) => c.id === form.originCampId);
  const destCamp = camps.find((c) => c.id === form.destinationCampId);

  const swapRoute = () => {
    setForm((f) => ({
      ...f,
      originCampId: f.destinationCampId,
      destinationCampId: f.originCampId,
    }));
  };

  const submit = async () => {
    if (!isSignedIn) {
      Alert.alert(t('nav.signIn'), t('transport.sessionError'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('nav.signIn'), onPress: () => router.push('/sign-in') },
      ]);
      return;
    }
    if (form.originCampId === form.destinationCampId) {
      Alert.alert(t('common.error'), t('transport.routeIncomplete'));
      return;
    }
    setSubmitting(true);
    try {
      await syncUser();
      await authFetch('/transport/drivers/register', {
        method: 'POST',
        body: JSON.stringify({
          vehicleType: form.vehicleType,
          vehiclePlate: form.vehiclePlate.trim() || undefined,
          licenseNumber: form.licenseNumber.trim() || undefined,
          seatsCapacity: form.seatsCapacity,
          routes: [
            {
              originCampId: form.originCampId,
              destinationCampId: form.destinationCampId,
              frequency: form.frequency,
            },
          ],
        }),
      });
      setSuccess(true);
    } catch {
      Alert.alert(t('common.error'), t('report.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.successWrap}>
          <View style={styles.successIcon}>
            <AppIcon name="check-circle" size={48} color={theme.oasisDeep} />
          </View>
          <Text style={styles.successTitle}>{t('transport.driver.success')}</Text>
          <Text style={styles.successSub}>{t('transport.driver.trustLine')}</Text>
          <View style={styles.successSteps}>
            {[t('transport.driver.kicker'), t('common.verified'), t('transport.driversOnRoute')].map((step, i) => (
              <View key={step} style={styles.successStep}>
                <View style={styles.successStepNum}>
                  <Text style={styles.successStepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.successStepLabel}>{step}</Text>
              </View>
            ))}
          </View>
          <Pressable style={styles.successBtn} onPress={() => router.replace('/transport')}>
            <Text style={styles.successBtnText}>{t('transport.title')}</Text>
            <AppIcon name="arrow-right" size={18} color={theme.pearl} />
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
          <AppIcon name="arrow-left" size={20} color={theme.ink} />
          <Text style={styles.backText}>{t('transport.title')}</Text>
        </Pressable>
        <Text style={styles.heroEyebrow}>{t('transport.driver.kicker')}</Text>
        <Text style={styles.heroSub}>{t('transport.driver.trustLine')}</Text>

        {existing ? (
          <View style={[styles.statusBanner, existing.isVerified ? styles.statusVerified : styles.statusPending]}>
            <AppIcon
              name={existing.isVerified ? 'check-circle' : 'clock'}
              size={16}
              color={existing.isVerified ? theme.oasisDeep : theme.dune}
            />
            <Text style={styles.statusText}>
              {existing.isVerified
                ? `${t('common.verified')} · ★ ${existing.rating.toFixed(1)} · ${existing.totalTrips}`
                : t('transport.driver.trustLine')}
            </Text>
          </View>
        ) : null}
      </SafeAreaView>

      {loadingProfile ? (
        <ActivityIndicator color={theme.oasisDeep} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.benefitsRow}>
            {BENEFIT_KEYS.map((b) => (
              <View key={b.titleKey} style={styles.benefitCard}>
                <View style={styles.benefitIcon}>
                  <AppIcon name={b.icon} size={16} color={theme.oasisDeep} />
                </View>
                <Text style={styles.benefitTitle}>{t(b.titleKey)}</Text>
                <Text style={styles.benefitSub}>{t(b.subKey)}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>{t('transport.driver.vehicle')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleRow}>
            {VEHICLE_TYPE_KEYS.map((v) => {
              const on = form.vehicleType === v.value;
              return (
                <Pressable
                  key={v.value}
                  style={[styles.vehicleCard, on && styles.vehicleCardOn]}
                  onPress={() => setForm({ ...form, vehicleType: v.value })}
                >
                  <Text style={styles.vehicleEmoji}>{v.emoji}</Text>
                  <Text style={[styles.vehicleLabel, on && styles.vehicleLabelOn]}>{t(v.labelKey)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.detailCard}>
            <View style={styles.fieldRow}>
              <AppIcon name="hash" size={16} color={theme.inkMuted} />
              <TextInput
                style={styles.fieldInput}
                value={form.vehiclePlate}
                onChangeText={(vehiclePlate) => setForm({ ...form, vehiclePlate })}
                placeholder={t('transport.driver.plate')}
                placeholderTextColor={theme.inkSoft}
                autoCapitalize="characters"
              />
            </View>
            <View style={styles.fieldSep} />
            <View style={styles.fieldRow}>
              <AppIcon name="credit-card" size={16} color={theme.inkMuted} />
              <TextInput
                style={styles.fieldInput}
                value={form.licenseNumber}
                onChangeText={(licenseNumber) => setForm({ ...form, licenseNumber })}
                placeholder={`${t('transport.driver.license')} (${t('common.optional')})`}
                placeholderTextColor={theme.inkSoft}
              />
            </View>
            <View style={styles.fieldSep} />
            <View style={styles.seatsRow}>
              <View style={styles.seatsInfo}>
                <AppIcon name="users" size={16} color={theme.inkMuted} />
                <Text style={styles.seatsLabel}>{t('transport.driver.seatsAvailable')}</Text>
              </View>
              <View style={styles.stepper}>
                <Pressable
                  style={[styles.stepBtn, form.seatsCapacity <= 1 && styles.stepBtnOff]}
                  onPress={() => setForm({ ...form, seatsCapacity: Math.max(1, form.seatsCapacity - 1) })}
                >
                  <AppIcon name="minus" size={16} color={form.seatsCapacity <= 1 ? theme.inkSoft : theme.ink} />
                </Pressable>
                <Text style={styles.stepValue}>{form.seatsCapacity}</Text>
                <Pressable
                  style={[styles.stepBtn, form.seatsCapacity >= 50 && styles.stepBtnOff]}
                  onPress={() => setForm({ ...form, seatsCapacity: Math.min(50, form.seatsCapacity + 1) })}
                >
                  <AppIcon name="plus" size={16} color={form.seatsCapacity >= 50 ? theme.inkSoft : theme.ink} />
                </Pressable>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t('transport.driver.frequentRoute')}</Text>
          <Text style={styles.sectionHint}>{t('transport.noPaymentsHint')}</Text>

          <View style={styles.routeCard}>
            <View style={styles.routeRows}>
              <Pressable style={styles.routeRow} onPress={() => setPickerFor('origin')}>
                <View style={styles.dotOrigin} />
                <View style={styles.routeCopy}>
                  <Text style={styles.routeLabel}>{t('transport.from')}</Text>
                  <Text style={styles.routeValue} numberOfLines={1}>
                    {originCamp ? pickName(locale, originCamp) : t('transport.pickOrigin')}
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
                    {destCamp ? pickName(locale, destCamp) : t('transport.pickDest')}
                  </Text>
                </View>
                <AppIcon name="chevron-down" size={16} color={theme.inkSoft} />
              </Pressable>
            </View>

            <Pressable style={styles.swapBtn} onPress={swapRoute} hitSlop={8}>
              <AppIcon name="repeat" size={16} color={theme.oasisDeep} />
            </Pressable>
          </View>

          <Text style={styles.freqLabel}>{t('transport.driver.frequentRoute')}</Text>
          <View style={styles.freqRow}>
            {FREQUENCY_KEYS.map((f) => {
              const on = form.frequency === f.value;
              return (
                <Pressable
                  key={f.value}
                  style={[styles.freqChip, on && styles.freqChipOn]}
                  onPress={() => setForm({ ...form, frequency: f.value })}
                >
                  <Text style={[styles.freqText, on && styles.freqTextOn]}>{t(f.labelKey)}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.trustLine}>
            <AppIcon name="shield" size={12} color={theme.inkMuted} />
            <Text style={styles.trustText}>{t('transport.noPaymentsHint')}</Text>
          </View>

          <Pressable style={[styles.submitBtn, submitting && styles.disabled]} onPress={submit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color={theme.pearl} />
            ) : (
              <>
                <AppIcon name="truck" size={18} color={theme.pearl} />
                <Text style={styles.submitText}>
                  {existing ? t('transport.driver.updateProfile') : t('transport.driver.submit')}
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      )}

      <CampPickerSheet
        visible={pickerFor === 'origin'}
        title={t('transport.pickCampOrigin')}
        camps={camps}
        selectedId={form.originCampId}
        onSelect={(originCampId) => setForm({ ...form, originCampId })}
        onClose={() => setPickerFor(null)}
      />
      <CampPickerSheet
        visible={pickerFor === 'dest'}
        title={t('transport.pickCampDest')}
        camps={camps}
        selectedId={form.destinationCampId}
        onSelect={(destinationCampId) => setForm({ ...form, destinationCampId })}
        onClose={() => setPickerFor(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4, marginBottom: 12 },
  backText: { color: theme.inkMuted, fontWeight: '700', fontSize: 14 },
  heroEyebrow: { fontSize: 10, fontWeight: '800', color: theme.dune, letterSpacing: 2 },
  heroAr: { fontSize: 32, fontWeight: '900', color: theme.ink, writingDirection: 'rtl', marginTop: 2 },
  heroSub: { fontSize: 13.5, color: theme.inkMuted, marginTop: 6, lineHeight: 20 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  statusVerified: {
    backgroundColor: 'rgba(45,138,98,0.08)',
    borderColor: 'rgba(45,138,98,0.25)',
  },
  statusPending: {
    backgroundColor: 'rgba(168,132,45,0.08)',
    borderColor: 'rgba(168,132,45,0.25)',
  },
  statusText: { flex: 1, fontSize: 12.5, fontWeight: '600', color: theme.ink },
  content: { padding: 20, paddingBottom: 120 },

  benefitsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  benefitCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    alignItems: 'center',
  },
  benefitIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(45,138,98,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  benefitTitle: { fontSize: 11.5, fontWeight: '800', color: theme.ink, textAlign: 'center' },
  benefitSub: { fontSize: 10, color: theme.inkMuted, textAlign: 'center', marginTop: 2 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.ink, marginBottom: 4 },
  sectionHint: { fontSize: 12.5, color: theme.inkMuted, marginBottom: 12 },

  vehicleRow: { gap: 10, paddingBottom: 14, paddingRight: 8 },
  vehicleCard: {
    width: 96,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: radii.lg,
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  vehicleCardOn: {
    borderColor: theme.oasisDeep,
    backgroundColor: 'rgba(45,138,98,0.06)',
  },
  vehicleEmoji: { fontSize: 28, marginBottom: 6 },
  vehicleLabel: { fontSize: 12.5, fontWeight: '800', color: theme.inkMuted },
  vehicleLabelOn: { color: theme.oasisDeep },
  vehicleDesc: { fontSize: 10, color: theme.inkSoft, marginTop: 2 },

  detailCard: {
    backgroundColor: theme.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
    marginBottom: 22,
  },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fieldInput: { flex: 1, paddingVertical: 14, fontSize: 14, color: theme.ink, fontWeight: '500' },
  fieldSep: { height: 1, backgroundColor: theme.border },
  seatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  seatsInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  seatsLabel: { fontSize: 14, fontWeight: '700', color: theme.ink },
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

  routeCard: {
    backgroundColor: theme.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    marginBottom: 14,
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

  freqLabel: { fontSize: 13, fontWeight: '700', color: theme.inkMuted, marginBottom: 8 },
  freqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  freqChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  freqChipOn: { backgroundColor: theme.oasisDeep, borderColor: theme.oasisDeep },
  freqText: { fontSize: 12.5, fontWeight: '700', color: theme.ink },
  freqTextOn: { color: theme.pearl },

  trustLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  trustText: { flex: 1, fontSize: 12, color: theme.inkMuted, lineHeight: 17 },

  submitBtn: {
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
  submitText: { fontWeight: '800', color: theme.pearl, fontSize: 16 },
  disabled: { opacity: 0.7 },

  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(45,138,98,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: { fontSize: 26, fontWeight: '900', color: theme.ink, textAlign: 'center' },
  successSub: {
    fontSize: 14.5,
    color: theme.inkMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 300,
  },
  successSteps: { marginTop: 28, gap: 12, alignSelf: 'stretch' },
  successStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  successStepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(45,138,98,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successStepNumText: { fontSize: 13, fontWeight: '800', color: theme.oasisDeep },
  successStepLabel: { fontSize: 14, fontWeight: '600', color: theme.ink },
  successBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
    backgroundColor: theme.oasisDeep,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: radii.lg,
  },
  successBtnText: { fontWeight: '800', color: theme.pearl, fontSize: 16 },
});
