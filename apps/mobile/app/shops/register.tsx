import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { CampSummary } from '@lefrig/shared';
import { DEFAULT_PHONE_COUNTRY } from '@lefrig/shared';
import { PhoneField } from '@/components/PhoneField';
import { CountryFlag } from '@/components/CountryFlag';
import { Hero, Button, StudioSteps } from '@/components/ui';
import { SingleImagePicker } from '@/components/ui/SingleImagePicker';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { fetchWithMeta } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, radii } from '@/lib/theme';
import { type as typo, space, ui, fonts } from '@/lib/ui';

type Step = 1 | 2 | 3 | 4;
type ShopType = 'individual' | 'restaurant' | 'cooperative' | 'association' | 'workshop' | 'pharmacy';

const SHOP_TYPES: { id: ShopType; labelKey: string; descKey: string }[] = [
  { id: 'individual', labelKey: 'shops.typeIndividual', descKey: 'shops.studio.typeIndividualDesc' },
  { id: 'restaurant', labelKey: 'shops.typeRestaurant', descKey: 'shops.studio.typeRestaurantDesc' },
  { id: 'pharmacy', labelKey: 'shops.typePharmacy', descKey: 'shops.studio.typePharmacyDesc' },
  { id: 'cooperative', labelKey: 'shops.typeCooperative', descKey: 'shops.studio.typeCooperativeDesc' },
  { id: 'workshop', labelKey: 'shops.typeWorkshop', descKey: 'shops.studio.typeWorkshopDesc' },
  { id: 'association', labelKey: 'shops.typeAssociation', descKey: 'shops.studio.typeAssociationDesc' },
];

function campCountry(slug: string) {
  return slug === 'tindouf' ? 'DZ' : 'EH';
}

export default function RegisterShopScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const { authFetch, syncUser, isSignedIn, isLoaded, getAccessToken } = useAuthApi();

  const [step, setStep] = useState<Step>(1);
  const [camps, setCamps] = useState<CampSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [shopType, setShopType] = useState<ShopType>('individual');
  const [campId, setCampId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState<string>(DEFAULT_PHONE_COUNTRY.dial);
  const [whatsapp, setWhatsapp] = useState('');
  const [acceptsCash, setAcceptsCash] = useState(true);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }
    fetchWithMeta<CampSummary[]>('/camps', []).then((res) => {
      setCamps(res.data);
      setCampId((prev) => prev || res.data[0]?.id || '');
    });
  }, [isLoaded, isSignedIn, router]);

  const canNext =
    step === 1
      ? !!shopType && !!campId
      : step === 2
        ? name.trim().length >= 2 && phone.trim().length >= 8
        : true;

  const submit = async () => {
    if (!name.trim() || !phone.trim() || !campId) {
      Alert.alert(t('common.error'), t('publish.completeRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await syncUser();
      const created = await authFetch<{ id: string }>('/shops', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || undefined,
          campId,
          acceptsCash,
          shopType,
          imageUrl: coverUrl || undefined,
        }),
      });
      if (created?.id) {
        router.replace(`/shops/${created.id}/manage` as never);
      } else {
        router.replace('/shops/mine' as never);
      }
    } catch {
      Alert.alert(t('common.error'), t('shops.studio.registerError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={ui.screen}>
      <Hero
        kicker={t('shops.studio.badge')}
        title={t('shops.register.title')}
        subtitle={t('shops.verifiedMarsas')}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <StudioSteps
          current={step}
          steps={[
            { n: 1, label: t('shops.studio.stepType') },
            { n: 2, label: t('shops.studio.stepShop') },
            { n: 3, label: t('shops.studio.stepPayments') },
            { n: 4, label: t('shops.studio.stepPublish') },
          ]}
          onSelect={(n) => n <= step && setStep(n as Step)}
        />

        {step === 1 ? (
          <View style={styles.block}>
            <Text style={styles.section}>{t('shops.studio.stepType')}</Text>
            {SHOP_TYPES.map((opt) => (
              <Pressable
                key={opt.id}
                style={[styles.optionRow, shopType === opt.id && styles.optionRowOn]}
                onPress={() => setShopType(opt.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, shopType === opt.id && styles.optionTitleOn]}>{t(opt.labelKey)}</Text>
                  <Text style={styles.typeDesc}>{t(opt.descKey)}</Text>
                </View>
                <View style={[styles.optionDot, shopType === opt.id && styles.optionDotOn]} />
              </Pressable>
            ))}
            <Text style={[styles.section, { marginTop: 16 }]}>{t('shops.register.camp')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.campRow}>
              {camps.map((c) => (
                <Pressable
                  key={c.id}
                  style={[styles.campChip, campId === c.id && styles.campChipOn]}
                  onPress={() => setCampId(c.id)}
                >
                  <CountryFlag country={campCountry(c.slug)} size={14} />
                  <Text style={[styles.campText, campId === c.id && styles.campTextOn]}>{pickName(locale, c)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.block}>
            <Text style={styles.label}>{t('shops.register.name')}</Text>
            <TextInput
              style={ui.input}
              value={name}
              onChangeText={setName}
              placeholder="Marsa Al-Khair"
              placeholderTextColor={theme.inkSoft}
            />
            <Text style={styles.label}>{t('shops.studio.phone')}</Text>
            <PhoneField label={t('shops.studio.phone')} value={phone} onChange={setPhone} locale={locale} />
            <Text style={styles.label}>WhatsApp ({t('common.optional')})</Text>
            <PhoneField
              label="WhatsApp"
              value={whatsapp || phone}
              onChange={setWhatsapp}
              locale={locale}
            />
            <Text style={styles.label}>
              {t('shops.register.description')} ({t('common.optional')})
            </Text>
            <TextInput
              style={[ui.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholderTextColor={theme.inkSoft}
            />
            <SingleImagePicker
              label={t('publish.coverPhoto')}
              url={coverUrl}
              onChange={setCoverUrl}
              getToken={getAccessToken}
            />
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.block}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('shops.acceptsCash')}</Text>
              <Switch
                value={acceptsCash}
                onValueChange={setAcceptsCash}
                trackColor={{ true: theme.oasisDeep }}
              />
            </View>
            <Text style={styles.hint}>{t('shops.studio.tip3')}</Text>
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.block}>
            <Text style={styles.reviewTitle}>{name || '—'}</Text>
            <Text style={styles.hint}>
              {t(SHOP_TYPES.find((x) => x.id === shopType)?.labelKey ?? 'shops.typeIndividual')} ·{' '}
              {camps.find((c) => c.id === campId) ? pickName(locale, camps.find((c) => c.id === campId)!) : '—'}
            </Text>
            <Text style={styles.hint}>{phone}</Text>
            <Text style={styles.hint}>{t('shops.studio.tip4')}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {step > 1 ? (
            <Button label={t('transport.driver.prev')} variant="ghost" onPress={() => setStep((s) => (s - 1) as Step)} />
          ) : null}
          {step < 4 ? (
            <Button
              label={t('transport.driver.next')}
              disabled={!canNext}
              onPress={() => setStep((s) => (s + 1) as Step)}
              fullWidth
            />
          ) : (
            <Button
              label={t('shops.register.submit')}
              loading={submitting}
              onPress={() => void submit()}
              fullWidth
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingBottom: 148 },
  block: { marginTop: 8, gap: 10 },
  section: { ...typo.label, color: theme.dune, marginBottom: 4 },
  label: { ...typo.label, marginTop: 8 },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  optionRowOn: {
    borderColor: theme.dune,
    backgroundColor: 'rgba(168,132,45,0.06)',
  },
  optionTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: theme.inkMuted },
  optionTitleOn: { color: theme.ink },
  typeDesc: { fontFamily: fonts.body, fontSize: 12, color: theme.inkMuted, marginTop: 2 },
  optionDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: theme.borderStrong,
  },
  optionDotOn: {
    borderColor: theme.dune,
    backgroundColor: theme.dune,
  },
  campRow: { gap: 8, paddingRight: 8 },
  campChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  campChipOn: { borderColor: theme.dune, backgroundColor: 'rgba(168,132,45,0.08)' },
  campText: { fontFamily: fonts.bodySemi, fontSize: 13, color: theme.inkMuted },
  campTextOn: { color: theme.ink },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: theme.sand,
    borderWidth: 1,
    borderColor: theme.border,
  },
  switchLabel: { ...typo.body, flex: 1, paddingRight: 12 },
  hint: { ...typo.caption, lineHeight: 20 },
  reviewTitle: { fontFamily: fonts.displaySemi, fontSize: 22, color: theme.ink },
  actions: { marginTop: 24, marginBottom: 16, gap: 10 },
});
