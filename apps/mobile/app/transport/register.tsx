import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  DEFAULT_PHONE_COUNTRY,
  TRANSPORT_HUBS,
  TRANSPORT_HUB_ZONES,
  isValidPhoneE164,
  pickLocalized,
  type TransportHubZone,
} from '@lefrig/shared';
import { PhoneField } from '@/components/PhoneField';
import { CountryFlag } from '@/components/CountryFlag';
import { Hero, Button, StudioSteps, EmptyState } from '@/components/ui';
import { SingleImagePicker } from '@/components/ui/SingleImagePicker';
import { useAuthApi } from '@/lib/useAuthApi';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { type as typo, space, ui } from '@/lib/ui';

type Step = 1 | 2 | 3 | 4;
type CoverageMode = 'zone' | 'corridors' | 'flexible';
type VehicleType = 'car' | 'pickup' | 'van' | 'truck' | 'motorcycle';
type CorridorPair = { originHubSlug: string; destinationHubSlug: string };

const VEHICLES: { id: VehicleType; icon: string }[] = [
  { id: 'car', icon: '🚗' },
  { id: 'pickup', icon: '🛻' },
  { id: 'van', icon: '🚐' },
  { id: 'truck', icon: '🚛' },
  { id: 'motorcycle', icon: '🏍️' },
];

const ORIGIN_PICKS = TRANSPORT_HUBS.filter((h) => h.popular).slice(0, 16);

export default function DriverRegisterScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const { authFetch, isSignedIn, isLoaded, syncUser, getAccessToken } = useAuthApi();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [successKind, setSuccessKind] = useState<'basic' | 'pending' | null>(null);

  const [vehicleType, setVehicleType] = useState<VehicleType>('pickup');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [seatsCapacity, setSeatsCapacity] = useState('4');

  const [coverageMode, setCoverageMode] = useState<CoverageMode>('zone');
  const [coverageOrigin, setCoverageOrigin] = useState('tindouf');
  const [coverageZones, setCoverageZones] = useState<TransportHubZone[]>(['wilaya']);
  const [corridors, setCorridors] = useState<CorridorPair[]>([
    { originHubSlug: 'tindouf', destinationHubSlug: 'rabouni' },
  ]);
  const [coverageScope, setCoverageScope] = useState<'local' | 'international'>('local');

  const [phone, setPhone] = useState<string>(DEFAULT_PHONE_COUNTRY.dial);
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappSame, setWhatsappSame] = useState(true);

  const [licenseDocUrl, setLicenseDocUrl] = useState<string | null>(null);
  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState<string | null>(null);
  const [submitForReview, setSubmitForReview] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }
    authFetch<{
      vehicleType?: string;
      vehiclePlate?: string;
      seatsCapacity?: number;
      coverageMode?: CoverageMode;
      coverageOriginHubSlug?: string;
      coverageZones?: string[];
      corridorPairs?: CorridorPair[];
      coverageScope?: 'local' | 'international';
      contactPhone?: string;
      whatsapp?: string;
      licenseDocUrl?: string;
      vehiclePhotoUrl?: string;
    }>('/transport/drivers/me')
      .then((p) => {
        if (p.vehicleType) setVehicleType(p.vehicleType as VehicleType);
        setVehiclePlate(p.vehiclePlate ?? '');
        setSeatsCapacity(String(p.seatsCapacity || 4));
        if (p.coverageMode) setCoverageMode(p.coverageMode);
        if (p.coverageOriginHubSlug) setCoverageOrigin(p.coverageOriginHubSlug);
        if (p.coverageZones?.length) setCoverageZones(p.coverageZones as TransportHubZone[]);
        if (Array.isArray(p.corridorPairs) && p.corridorPairs.length) setCorridors(p.corridorPairs);
        if (p.coverageScope) setCoverageScope(p.coverageScope);
        if (p.contactPhone) setPhone(p.contactPhone);
        if (p.whatsapp) {
          setWhatsapp(p.whatsapp);
          setWhatsappSame(p.whatsapp === p.contactPhone);
        }
        setLicenseDocUrl(p.licenseDocUrl ?? null);
        setVehiclePhotoUrl(p.vehiclePhotoUrl ?? null);
      })
      .catch(() => undefined);
  }, [authFetch, isLoaded, isSignedIn, router]);

  const phoneOk = isValidPhoneE164(phone.trim());
  const whatsappValue = whatsappSame ? phone.trim() : whatsapp.trim();
  const coverageOk = useMemo(() => {
    if (coverageMode === 'zone') return Boolean(coverageOrigin) && coverageZones.length > 0;
    if (coverageMode === 'corridors') {
      return corridors.every((c) => c.originHubSlug && c.destinationHubSlug && c.originHubSlug !== c.destinationHubSlug);
    }
    return Boolean(coverageScope);
  }, [coverageMode, coverageOrigin, coverageZones, corridors, coverageScope]);

  const canNext =
    step === 1
      ? Boolean(vehicleType) && Number(seatsCapacity) >= 1
      : step === 2
        ? coverageOk
        : step === 3
          ? phoneOk
          : !(submitForReview && !licenseDocUrl);

  const publish = async () => {
    if (!canNext) {
      Alert.alert(t('common.error'), t('transport.driver.registerValidationError'));
      return;
    }
    setLoading(true);
    try {
      await syncUser();
      await authFetch('/transport/drivers/register', {
        method: 'POST',
        body: JSON.stringify({
          vehicleType,
          vehiclePlate: vehiclePlate.trim() || undefined,
          licenseNumber: licenseNumber.trim() || undefined,
          seatsCapacity: Number(seatsCapacity) || 4,
          coverageMode,
          coverageOriginHubSlug: coverageMode === 'zone' ? coverageOrigin : undefined,
          coverageZones: coverageMode === 'zone' ? coverageZones : undefined,
          corridorPairs: coverageMode === 'corridors' ? corridors : undefined,
          coverageScope: coverageMode === 'flexible' ? coverageScope : undefined,
          contactPhone: phone.trim(),
          whatsapp: whatsappValue || undefined,
          licenseDocUrl: licenseDocUrl || undefined,
          vehiclePhotoUrl: vehiclePhotoUrl || undefined,
          submitForReview: Boolean(submitForReview && licenseDocUrl),
        }),
      });
      setSuccessKind(submitForReview && licenseDocUrl ? 'pending' : 'basic');
    } catch {
      Alert.alert(t('common.error'), t('transport.driver.registerError'));
    } finally {
      setLoading(false);
    }
  };

  if (successKind) {
    return (
      <View style={ui.screen}>
        <Hero
          title={
            successKind === 'pending'
              ? t('transport.driver.successPendingTitle')
              : t('transport.driver.successTitle')
          }
          subtitle={
            successKind === 'pending'
              ? t('transport.driver.successPendingDesc')
              : t('transport.driver.successDesc')
          }
          back={false}
        />
        <View style={styles.successBody}>
          <Button
            label={t('transport.driver.goToDriverArea')}
            variant="gold"
            fullWidth
            onPress={() => router.replace('/transport/garage')}
          />
          <Button
            label={t('transport.driver.backToTransport')}
            variant="ghost"
            fullWidth
            onPress={() => router.replace('/transport')}
          />
        </View>
      </View>
    );
  }

  const steps = [
    { n: 1, label: t('transport.driver.stepVehicle') },
    { n: 2, label: t('transport.driver.stepCoverage') },
    { n: 3, label: t('transport.driver.stepContact') },
    { n: 4, label: t('transport.driver.stepTrust') },
  ];

  return (
    <View style={ui.screen}>
      <Hero
        title={t('transport.driver.pageTitle')}
        subtitle={t('transport.driver.lead')}
        kicker={t('transport.driver.badge')}
      />
      <ScrollView contentContainerStyle={styles.body}>
        <StudioSteps steps={steps} current={step} onSelect={(n) => n <= step && setStep(n as Step)} />

        {step === 1 && (
          <>
            <Text style={styles.h2}>{t('transport.driver.vehicle')}</Text>
            <View style={styles.grid}>
              {VEHICLES.map((v) => (
                <Pressable
                  key={v.id}
                  style={[styles.choice, vehicleType === v.id && styles.choiceOn]}
                  onPress={() => setVehicleType(v.id)}
                >
                  <Text style={styles.emoji}>{v.icon}</Text>
                  <Text style={styles.choiceText}>{t(`transport.driver.vehicleTypes.${v.id}`)}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={ui.input}
              placeholder={t('transport.driver.platePlaceholder')}
              value={vehiclePlate}
              onChangeText={setVehiclePlate}
              placeholderTextColor={theme.inkSoft}
            />
            <TextInput
              style={ui.input}
              placeholder={t('transport.driver.licenseOptional')}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholderTextColor={theme.inkSoft}
            />
            <TextInput
              style={ui.input}
              placeholder={t('transport.driver.seatsAvailable')}
              keyboardType="number-pad"
              value={seatsCapacity}
              onChangeText={setSeatsCapacity}
              placeholderTextColor={theme.inkSoft}
            />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.h2}>{t('transport.driver.coverageTitle')}</Text>
            <Text style={styles.hint}>{t('transport.driver.coverageHint')}</Text>
            {(
              [
                { id: 'zone' as const, label: 'modeZone', desc: 'modeZoneDesc' },
                { id: 'corridors' as const, label: 'modeCorridors', desc: 'modeCorridorsDesc' },
                { id: 'flexible' as const, label: 'modeFlexible', desc: 'modeFlexibleDesc' },
              ] as const
            ).map((m) => (
              <Pressable
                key={m.id}
                style={[styles.mode, coverageMode === m.id && styles.choiceOn]}
                onPress={() => setCoverageMode(m.id)}
              >
                <Text style={styles.choiceText}>{t(`transport.driver.${m.label}`)}</Text>
                <Text style={styles.hint}>{t(`transport.driver.${m.desc}`)}</Text>
              </Pressable>
            ))}

            {coverageMode === 'zone' && (
              <>
                <Text style={styles.label}>{t('transport.driver.coverageOrigin')}</Text>
                <View style={styles.hubs}>
                  {ORIGIN_PICKS.map((h) => (
                    <Pressable
                      key={h.slug}
                      style={[ui.chip, coverageOrigin === h.slug && ui.chipOn]}
                      onPress={() => setCoverageOrigin(h.slug)}
                    >
                      <CountryFlag country={h.country} size={14} />
                      <Text style={[ui.chipText, coverageOrigin === h.slug && ui.chipTextOn]}>
                        {pickLocalized(h, locale)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.label}>{t('transport.driver.coverageZones')}</Text>
                <View style={styles.hubs}>
                  {TRANSPORT_HUB_ZONES.map((z) => (
                    <Pressable
                      key={z.id}
                      style={[ui.chip, coverageZones.includes(z.id) && ui.chipOn]}
                      onPress={() =>
                        setCoverageZones((prev) =>
                          prev.includes(z.id) ? prev.filter((x) => x !== z.id) : [...prev, z.id].slice(0, 6),
                        )
                      }
                    >
                      <Text style={[ui.chipText, coverageZones.includes(z.id) && ui.chipTextOn]}>
                        {t(`transport.zones.${z.id}`)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {coverageMode === 'corridors' && (
              <>
                {corridors.map((c, i) => (
                  <View key={i} style={styles.corridor}>
                    <Text style={styles.label}>{t('transport.driver.corridorOrigin')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hubs}>
                      {ORIGIN_PICKS.map((h) => (
                        <Pressable
                          key={h.slug}
                          style={[ui.chip, c.originHubSlug === h.slug && ui.chipOn]}
                          onPress={() =>
                            setCorridors((prev) =>
                              prev.map((x, j) => (j === i ? { ...x, originHubSlug: h.slug } : x)),
                            )
                          }
                        >
                          <Text style={ui.chipText}>{pickLocalized(h, locale)}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                    <Text style={styles.label}>{t('transport.driver.corridorDest')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hubs}>
                      {ORIGIN_PICKS.map((h) => (
                        <Pressable
                          key={h.slug}
                          style={[ui.chip, c.destinationHubSlug === h.slug && ui.chipOn]}
                          onPress={() =>
                            setCorridors((prev) =>
                              prev.map((x, j) => (j === i ? { ...x, destinationHubSlug: h.slug } : x)),
                            )
                          }
                        >
                          <Text style={ui.chipText}>{pickLocalized(h, locale)}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ))}
                {corridors.length < 8 ? (
                  <Button
                    label={t('transport.driver.addCorridor')}
                    variant="ghost"
                    onPress={() =>
                      setCorridors((prev) => [
                        ...prev,
                        { originHubSlug: 'tindouf', destinationHubSlug: 'rabouni' },
                      ])
                    }
                  />
                ) : null}
              </>
            )}

            {coverageMode === 'flexible' && (
              <View style={styles.row2}>
                <Pressable
                  style={[styles.choice, coverageScope === 'local' && styles.choiceOn, { flex: 1 }]}
                  onPress={() => setCoverageScope('local')}
                >
                  <Text style={styles.choiceText}>{t('transport.driver.scopeLocal')}</Text>
                </Pressable>
                <Pressable
                  style={[styles.choice, coverageScope === 'international' && styles.choiceOn, { flex: 1 }]}
                  onPress={() => setCoverageScope('international')}
                >
                  <Text style={styles.choiceText}>{t('transport.driver.scopeInternational')}</Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.h2}>{t('transport.driver.contactTitle')}</Text>
            <Text style={styles.hint}>{t('transport.driver.contactHint')}</Text>
            <PhoneField label={t('transport.driver.phone')} value={phone} onChange={setPhone} locale={locale} />
            <View style={styles.switchRow}>
              <Text style={typo.body}>{t('transport.driver.whatsappSame')}</Text>
              <Switch value={whatsappSame} onValueChange={setWhatsappSame} trackColor={{ true: theme.oasis }} />
            </View>
            {!whatsappSame ? (
              <PhoneField
                label={t('transport.driver.whatsapp')}
                value={whatsapp || DEFAULT_PHONE_COUNTRY.dial}
                onChange={setWhatsapp}
                locale={locale}
              />
            ) : null}
          </>
        )}

        {step === 4 && (
          <>
            <Text style={styles.h2}>{t('transport.driver.trustTitle')}</Text>
            <Text style={styles.hint}>{t('transport.driver.trustHint')}</Text>
            <SingleImagePicker
              label={t('transport.driver.licenseDoc')}
              url={licenseDocUrl}
              onChange={(url) => {
                setLicenseDocUrl(url);
                if (url) setSubmitForReview(true);
              }}
              getToken={getAccessToken}
            />
            <SingleImagePicker
              label={t('transport.driver.vehiclePhoto')}
              url={vehiclePhotoUrl}
              onChange={setVehiclePhotoUrl}
              getToken={getAccessToken}
            />
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={typo.body}>{t('transport.driver.submitReview')}</Text>
                <Text style={styles.hint}>{t('transport.driver.submitReviewHint')}</Text>
              </View>
              <Switch
                value={submitForReview && Boolean(licenseDocUrl)}
                disabled={!licenseDocUrl}
                onValueChange={setSubmitForReview}
                trackColor={{ true: theme.oasis }}
              />
            </View>
            {!licenseDocUrl ? <Text style={styles.hint}>{t('transport.driver.skipDocs')}</Text> : null}
          </>
        )}

        <View style={styles.nav}>
          {step > 1 ? (
            <Button label={t('transport.driver.prev')} variant="ghost" onPress={() => setStep((s) => (s - 1) as Step)} />
          ) : (
            <View />
          )}
          {step < 4 ? (
            <Button
              label={t('transport.driver.next')}
              variant="gold"
              disabled={!canNext}
              onPress={() => setStep((s) => (s + 1) as Step)}
            />
          ) : (
            <Button
              label={t('transport.driver.publish')}
              variant="gold"
              loading={loading}
              disabled={!canNext}
              onPress={() => void publish()}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, paddingBottom: 140, gap: space.sm },
  h2: { ...typo.title, fontSize: 20, marginBottom: 4 },
  hint: { ...typo.caption, marginBottom: 8 },
  label: { ...typo.label, marginTop: 10, marginBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    width: '30%',
    minWidth: 96,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: theme.borderStrong,
    backgroundColor: theme.surface,
    alignItems: 'center',
    gap: 6,
  },
  choiceOn: { borderColor: theme.dune, backgroundColor: 'rgba(168,132,45,0.1)' },
  choiceText: { ...typo.caption, fontWeight: '700', textAlign: 'center', color: theme.ink },
  emoji: { fontSize: 22 },
  mode: {
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: theme.borderStrong,
    backgroundColor: theme.surface,
    marginBottom: 8,
  },
  hubs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  corridor: {
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    marginBottom: 10,
  },
  row2: { flexDirection: 'row', gap: 10 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.lg,
    gap: 12,
  },
  successBody: { padding: space.lg, gap: 12 },
});
