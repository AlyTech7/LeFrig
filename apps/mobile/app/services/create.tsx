import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  SERVICE_CATEGORIES,
  DEFAULT_CURRENCY,
  type CampSummary,
  type CurrencyCode,
} from '@lefrig/shared';
import { CountryFlag } from '@/components/CountryFlag';
import { ListingPhotoPicker, type PhotoSlot } from '@/components/ListingPhotoPicker';
import { AttributeSelect } from '@/components/AttributeSelect';
import { CurrencySelect } from '@/components/CurrencySelect';
import { StudioSteps } from '@/components/ui';
import { AppIcon } from '@/components/AppIcon';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { fetchWithMeta } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { uploadListingImageFromUri } from '@/lib/uploads';
import { prepareListingPhoto } from '@/lib/image-prep';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';

type Step = 1 | 2 | 3 | 4;

function campCountry(slug: string) {
  return slug === 'tindouf' ? 'DZ' : 'EH';
}

export default function CreateServiceScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const { authFetch, syncUser, isSignedIn, isLoaded, getAccessToken } = useAuthApi();

  const [step, setStep] = useState<Step>(1);
  const [camps, setCamps] = useState<CampSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [categorySlug, setCategorySlug] = useState('electrician');
  const [campIds, setCampIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [contactNote, setContactNote] = useState('');

  const tradeOptions = useMemo(
    () =>
      SERVICE_CATEGORIES.map((c) => ({
        value: c.slug,
        labelEs: c.nameEs,
        labelAr: c.nameAr,
      })),
    [],
  );

  const selectedTrade =
    SERVICE_CATEGORIES.find((c) => c.slug === categorySlug) ?? SERVICE_CATEGORIES[0];

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }
    fetchWithMeta<CampSummary[]>('/camps', []).then((res) => {
      setCamps(res.data);
      setCampIds((prev) => (prev.length ? prev : ([res.data[0]?.id].filter(Boolean) as string[])));
    });
  }, [isLoaded, isSignedIn, router]);

  const uploadPhoto = useCallback(
    async (slot: PhotoSlot) => {
      try {
        const token = await getAccessToken();
        if (!token) throw new Error(t('uploader.signInToUpload'));
        const prepared = await prepareListingPhoto(slot.localUri);
        const result = await uploadListingImageFromUri(prepared.uri, token, `svc-${slot.id}.jpg`);
        setPhotos((prev) =>
          prev.map((p) => (p.id === slot.id ? { ...p, remoteUrl: result.url, uploading: false } : p)),
        );
      } catch (e) {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === slot.id
              ? {
                  ...p,
                  uploading: false,
                  error: e instanceof Error ? e.message : t('uploader.uploadError'),
                }
              : p,
          ),
        );
      }
    },
    [getAccessToken, t],
  );

  const imageUrls = photos.filter((p) => p.remoteUrl).map((p) => p.remoteUrl!);
  const hasUploading = photos.some((p) => p.uploading);
  const priceFromNum = Number(priceFrom);
  const priceToNum = Number(priceTo);

  const fullDescription = useMemo(() => {
    const parts = [description.trim()];
    if (contactNote.trim()) parts.push(t('publish.contactPrefix', { note: contactNote.trim() }));
    return parts.filter(Boolean).join('\n\n');
  }, [contactNote, description, t]);

  const toggleCamp = (id: string) => {
    setCampIds((prev) => {
      if (prev.includes(id)) return prev.length > 1 ? prev.filter((x) => x !== id) : prev;
      return [...prev, id];
    });
  };

  const canNext =
    step === 1
      ? !!categorySlug && campIds.length > 0
      : step === 2
        ? title.trim().length >= 3 && description.trim().length >= 15 && imageUrls.length >= 1 && !hasUploading
        : step === 3
          ? priceFromNum > 0 && (!priceTo || priceToNum >= priceFromNum)
          : true;

  const publish = async () => {
    if (!canNext) {
      Alert.alert(t('common.error'), t('publish.completeRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await syncUser();
      const created = await authFetch<{ id: string }>('/services', {
        method: 'POST',
        body: JSON.stringify({
          categorySlug,
          title: title.trim(),
          description: fullDescription,
          priceFrom: priceFromNum,
          priceTo: priceTo ? priceToNum : undefined,
          currency,
          campIds,
          images: imageUrls,
        }),
      });
      if (created?.id) router.replace(`/services/${created.id}` as never);
      else router.replace('/services');
    } catch {
      Alert.alert(t('common.error'), t('marketplace.publishError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#f7f1e4', theme.canvas, theme.canvas]}
        locations={[0, 0.22, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Pressable style={styles.backLink} onPress={() => router.back()}>
              <AppIcon name="arrow-left" size={18} color={theme.dune} />
              <Text style={styles.backText}>{t('services.studio.back')}</Text>
            </Pressable>

            <Text style={styles.kicker}>{t('services.studio.badge')}</Text>
            <Text style={styles.brandAr}>{t('services.brandAr')}</Text>
            <Text style={styles.title}>{t('services.create.title')}</Text>
            <View style={styles.rule} />
            <Text style={styles.lead}>{t('services.studio.lead')}</Text>

            <StudioSteps
              current={step}
              steps={[
                { n: 1, label: t('services.studio.stepTrade') },
                { n: 2, label: t('services.studio.stepProfile') },
                { n: 3, label: t('services.studio.stepPrice') },
                { n: 4, label: t('services.studio.stepPublish') },
              ]}
              onSelect={(n) => n <= step && setStep(n as Step)}
            />

            {step === 1 ? (
              <View style={styles.block}>
                <AttributeSelect
                  label={t('services.create.category')}
                  required
                  value={categorySlug}
                  options={tradeOptions}
                  searchable
                  onChange={setCategorySlug}
                />
                <Text style={styles.section}>{t('services.studio.whichCamps')}</Text>
                <Text style={styles.hintMuted}>{t('services.studio.multiCamp')}</Text>
                <View style={styles.wrap}>
                  {camps.map((c) => {
                    const on = campIds.includes(c.id);
                    return (
                      <Pressable
                        key={c.id}
                        style={[styles.campChip, on && styles.campChipOn]}
                        onPress={() => toggleCamp(c.id)}
                      >
                        <CountryFlag country={campCountry(c.slug)} size={14} />
                        <Text style={[styles.campText, on && styles.campTextOn]}>
                          {pickName(locale, c)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={styles.hint}>{t('services.studio.tip1')}</Text>
              </View>
            ) : null}

            {step === 2 ? (
              <View style={styles.block}>
                <Text style={styles.label}>{t('services.studio.titleLabel')}</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder={t('services.studio.titlePlaceholder', {
                    trade: pickName(locale, selectedTrade),
                  })}
                  placeholderTextColor={theme.inkSoft}
                />
                <Text style={styles.label}>{t('services.studio.profileHint')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  placeholder={t('services.studio.descPlaceholder')}
                  placeholderTextColor={theme.inkSoft}
                />
                <ListingPhotoPicker photos={photos} onChange={setPhotos} onUpload={uploadPhoto} />
                <Text style={styles.hint}>{t('services.studio.tip2')}</Text>
              </View>
            ) : null}

            {step === 3 ? (
              <View style={styles.block}>
                <Text style={styles.label}>{t('services.studio.priceFrom')}</Text>
                <TextInput
                  style={styles.input}
                  value={priceFrom}
                  onChangeText={setPriceFrom}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.inkSoft}
                />
                <Text style={styles.label}>{t('services.studio.priceTo')}</Text>
                <TextInput
                  style={styles.input}
                  value={priceTo}
                  onChangeText={setPriceTo}
                  keyboardType="numeric"
                  placeholderTextColor={theme.inkSoft}
                />
                <CurrencySelect
                  value={currency}
                  onChange={setCurrency}
                  locale={locale}
                  label={t('common.currency')}
                />
                <Text style={styles.label}>{t('services.studio.contactOptional')}</Text>
                <TextInput
                  style={styles.input}
                  value={contactNote}
                  onChangeText={setContactNote}
                  placeholder={t('services.studio.contactPlaceholder')}
                  placeholderTextColor={theme.inkSoft}
                />
                <Text style={styles.hint}>{t('services.studio.tip3')}</Text>
              </View>
            ) : null}

            {step === 4 ? (
              <View style={styles.block}>
                <Text style={styles.reviewTitle}>{title || '—'}</Text>
                <Text style={styles.hint}>
                  {pickName(locale, selectedTrade)}
                  {' · '}
                  {camps
                    .filter((c) => campIds.includes(c.id))
                    .map((c) => pickName(locale, c))
                    .join(', ')}
                </Text>
                <Text style={styles.reviewPrice}>
                  {priceFromNum.toLocaleString()}
                  {priceTo ? ` – ${priceToNum.toLocaleString()}` : '+'} {currency}
                </Text>
                <Text style={styles.hint}>{t('services.studio.tip4')}</Text>
                <Text style={styles.trust}>{t('services.studio.trustNote')}</Text>
              </View>
            ) : null}

            <View style={{ height: 110 }} />
          </ScrollView>

          <View style={styles.ctaBar}>
            {step > 1 ? (
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => setStep((s) => (s - 1) as Step)}
                disabled={submitting}
              >
                <Text style={styles.secondaryText}>{t('transport.driver.prev')}</Text>
              </Pressable>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            {step < 4 ? (
              <Pressable
                style={[styles.primaryBtn, !canNext && styles.btnDisabled]}
                disabled={!canNext}
                onPress={() => setStep((s) => (s + 1) as Step)}
              >
                <Text style={styles.primaryText}>{t('transport.driver.next')}</Text>
                <AppIcon name="arrow-right" size={16} color={theme.pearl} />
              </Pressable>
            ) : (
              <Pressable
                style={[styles.primaryBtn, (!canNext || submitting) && styles.btnDisabled]}
                disabled={!canNext || submitting}
                onPress={() => void publish()}
              >
                {submitting ? (
                  <ActivityIndicator color={theme.pearl} />
                ) : (
                  <Text style={styles.primaryText}>{t('services.studio.publishNow')}</Text>
                )}
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: space.lg, paddingBottom: 24 },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    marginBottom: 4,
  },
  backText: { fontFamily: fonts.bodySemi, fontSize: 14, color: theme.dune },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: theme.dune,
  },
  brandAr: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: theme.ink,
    writingDirection: 'rtl',
    marginTop: 2,
    lineHeight: 40,
  },
  title: { fontFamily: fonts.bodyMed, fontSize: 15, color: theme.inkMuted, marginTop: -2 },
  rule: {
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.dune,
    marginTop: 10,
    marginBottom: 8,
  },
  lead: { fontFamily: fonts.body, fontSize: 14, color: theme.inkSoft, lineHeight: 20, marginBottom: 16 },
  block: { marginTop: 8, gap: 4 },
  section: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 0.6,
    color: theme.dune,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 0.6,
    color: theme.inkSoft,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 6,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  campChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  campChipOn: {
    borderColor: theme.dune,
    backgroundColor: 'rgba(168,132,45,0.1)',
  },
  campText: { fontFamily: fonts.bodyMed, fontSize: 13, color: theme.inkMuted },
  campTextOn: { fontFamily: fonts.bodyBold, color: theme.ink },
  input: {
    borderWidth: 1,
    borderColor: theme.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: theme.ink,
    backgroundColor: theme.surface,
    marginBottom: 8,
  },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  hint: { fontFamily: fonts.body, fontSize: 13, color: theme.inkMuted, lineHeight: 19, marginTop: 8 },
  hintMuted: { fontFamily: fonts.body, fontSize: 12, color: theme.inkSoft, marginBottom: 4 },
  reviewTitle: { fontFamily: fonts.displaySemi, fontSize: 22, color: theme.ink },
  reviewPrice: { fontFamily: fonts.displaySemi, fontSize: 18, color: theme.ink, marginTop: 8 },
  trust: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: theme.inkSoft,
    lineHeight: 19,
    marginTop: 16,
  },
  ctaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: space.lg,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
    backgroundColor: theme.canvas,
  },
  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.md,
  },
  secondaryText: { fontFamily: fonts.bodyBold, fontSize: 14, color: theme.dune },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.ink,
    borderRadius: radii.md,
    paddingVertical: 16,
  },
  primaryText: { fontFamily: fonts.bodyBold, fontSize: 15, color: theme.pearl },
  btnDisabled: { opacity: 0.55 },
});
