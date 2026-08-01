import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LISTING_CATEGORIES, DEFAULT_CURRENCY, type CurrencyCode } from '@lefrig/shared';
import {
  getListingAttributeSchema,
  categoryHasStructuredAttributes,
  areRequiredAttributesFilled,
} from '@lefrig/shared';
import { enqueueOfflineAction } from '@/lib/offline';
import { ApiError, useAuthApi } from '@/lib/useAuthApi';
import { prepareListingPhoto } from '@/lib/image-prep';
import { uploadListingImageFromUri } from '@/lib/uploads';
import { ListingPhotoPicker, type PhotoSlot } from '@/components/ListingPhotoPicker';
import { AttributeSelect } from '@/components/AttributeSelect';
import { CurrencySelect } from '@/components/CurrencySelect';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppIcon } from '@/components/AppIcon';
import { pickLabel, pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

function isNetworkError(err: unknown): boolean {
  if (err instanceof ApiError) return err.status === 0;
  if (err instanceof TypeError) return true;
  if (err instanceof Error) {
    return /failed to fetch|network request failed|networkerror/i.test(err.message);
  }
  return false;
}

export default function CreateListingScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const { authFetch, syncUser, getAccessToken } = useAuthApi();
  const [step, setStep] = useState<1 | 2>(1);
  const [category, setCategory] = useState('other');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [description, setDescription] = useState('');
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [publishing, setPublishing] = useState(false);
  const selectedCat = LISTING_CATEGORIES.find((c) => c.slug === category);
  const attrSchema = getListingAttributeSchema(category);
  const hasStructured = categoryHasStructuredAttributes(category);

  const setAttr = (key: string, value: string) => {
    setAttributes((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'brand' && value !== 'other') delete next.brandOther;
      return next;
    });
  };

  const parsedAttributes = (): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(attributes)) {
      if (!v.trim()) continue;
      const field = attrSchema?.fields.find((f) => f.key === k);
      out[k] = field?.type === 'number' ? Number(v) : v;
    }
    return out;
  };

  const uploadPhoto = useCallback(
    async (slot: PhotoSlot) => {
      try {
        await syncUser();
        const token = await getAccessToken();
        if (!token) throw new Error('auth');
        const prepared = await prepareListingPhoto(slot.localUri);
        const result = await uploadListingImageFromUri(prepared.uri, token, `photo-${slot.id}.jpg`);
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === slot.id ? { ...p, remoteUrl: result.url, uploading: false, error: undefined } : p,
          ),
        );
      } catch {
        setPhotos((prev) =>
          prev.map((p) => (p.id === slot.id ? { ...p, uploading: false, error: t('publish.uploadError') } : p)),
        );
      }
    },
    [getAccessToken, syncUser, t],
  );

  const imageUrls = photos.filter((p) => p.remoteUrl).map((p) => p.remoteUrl!);
  const photosUploading = photos.some((p) => p.uploading);

  const resolveCampId = async (): Promise<string | null> => {
    try {
      const synced = await syncUser();
      const syncedUser = synced?.user as { preferredCampId?: string; campId?: string } | undefined;
      const fromSync = syncedUser?.preferredCampId || syncedUser?.campId;
      if (fromSync) return fromSync;
    } catch {
      /* fall through */
    }
    try {
      const me = await authFetch<{ preferredCampId?: string; campId?: string }>('/users/me');
      const fromMe = me.preferredCampId || me.campId;
      if (fromMe) return fromMe;
    } catch {
      /* fall through */
    }
    const camps = await authFetch<{ id: string }[]>('/camps');
    return camps[0]?.id ?? null;
  };

  const publish = async () => {
    if (!title.trim()) {
      Alert.alert(t('marketplace.listingTitle'), t('publish.completeRequired'));
      return;
    }
    if (imageUrls.length === 0) {
      Alert.alert(t('common.error'), t('publish.photosRequired'));
      return;
    }
    if (photosUploading) {
      Alert.alert(t('common.error'), t('publish.photosUploading'));
      return;
    }
    if (hasStructured && !areRequiredAttributesFilled(category, parsedAttributes())) {
      Alert.alert(t('common.error'), t('publish.completeRequired'));
      return;
    }
    setPublishing(true);
    const desc =
      description.trim() ||
      (hasStructured ? title.trim() : `${title.trim()}. Publicado desde Lefrig móvil. Pago en efectivo al recibir.`);
    const attrs = hasStructured ? parsedAttributes() : undefined;
    const payload = {
      title: title.trim(),
      description: desc,
      price: Number(price) > 0 ? Number(price) : 100,
      currency,
      category,
      paymentMethods: ['cash'] as string[],
      images: imageUrls,
      attributes: attrs,
    };
    try {
      const campId = await resolveCampId();
      if (!campId) throw new Error('no_camp');

      await authFetch('/listings', {
        method: 'POST',
        body: JSON.stringify({ ...payload, campId }),
      });
      Alert.alert(t('common.success'), t('marketplaceExtra.publishSuccess'));
      router.back();
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        Alert.alert(t('common.error'), err.message);
        return;
      }
      if (isNetworkError(err)) {
        let campId: string | undefined;
        try {
          campId = (await resolveCampId()) ?? undefined;
        } catch {
          campId = undefined;
        }
        if (!campId) {
          Alert.alert(t('common.error'), t('common.offline'));
          return;
        }
        await enqueueOfflineAction('create_listing', {
          ...payload,
          campId,
        });
        Alert.alert(t('common.offline'), t('marketplaceExtra.publishOffline'));
        router.back();
        return;
      }
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error'));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={t('publish.title')}
        subtitle={step === 1 ? t('publish.stepCategory') : t('publish.stepPhotos')}
        backLabel={t('nav.marketplace')}
      />
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        {step === 1 ? (
          <>
            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.stepHint}>{t('publish.categoryHint')}</Text>
              <View style={styles.catGrid}>
                {LISTING_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.slug}
                    style={[styles.catTile, category === cat.slug && styles.catTileOn]}
                    onPress={() => {
                      setCategory(cat.slug);
                      setAttributes({});
                    }}
                  >
                    <Text style={styles.catIcon}>{cat.icon}</Text>
                    <Text style={styles.catName}>{pickName(locale, cat)}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <View style={styles.ctaBar}>
              <Pressable style={styles.nextBtn} onPress={() => setStep(2)}>
                <Text style={styles.nextText}>{t('common.continue')}</Text>
                <AppIcon name="arrow-right" size={18} color={theme.pearl} />
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {selectedCat ? (
                <View style={styles.selectedCat}>
                  <Text style={styles.selectedCatIcon}>{selectedCat.icon}</Text>
                  <Text style={styles.selectedCatText}>{pickName(locale, selectedCat)}</Text>
                  <Pressable onPress={() => setStep(1)}>
                    <Text style={styles.changeCat}>{t('common.clear')}</Text>
                  </Pressable>
                </View>
              ) : null}

              <ListingPhotoPicker
                photos={photos}
                onChange={setPhotos}
                onUpload={uploadPhoto}
                disabled={publishing}
              />

              {attrSchema ? (
                <View style={styles.attrBlock}>
                  <Text style={styles.attrTitle}>{t('marketplaceExtra.quickData')}</Text>
                  {attrSchema.fields
                    .filter((f) => f.key !== 'brandOther' || attributes.brand === 'other')
                    .map((field) =>
                      field.type === 'select' && field.options ? (
                        <AttributeSelect
                          key={field.key}
                          label={pickLabel(locale, field)}
                          required={field.required}
                          value={attributes[field.key] ?? ''}
                          options={field.options}
                          placeholder={t('attributes.choose')}
                          disabled={publishing}
                          searchable={
                            field.key === 'brand' ||
                            field.key === 'year' ||
                            field.key === 'propertyType' ||
                            field.key === 'bodyType' ||
                            field.key === 'fuel' ||
                            field.key === 'model'
                          }
                          onChange={(v) => setAttr(field.key, v)}
                        />
                      ) : (
                        <View key={field.key}>
                          <Text style={styles.attrLabel}>
                            {pickLabel(locale, field)}
                            {field.required ? ' *' : ''}
                          </Text>
                          <TextInput
                            style={styles.input}
                            placeholder={field.placeholder ?? pickLabel(locale, field)}
                            placeholderTextColor={theme.inkSoft}
                            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                            value={attributes[field.key] ?? ''}
                            onChangeText={(v) => setAttr(field.key, v)}
                            editable={!publishing}
                          />
                        </View>
                      ),
                    )}
                </View>
              ) : null}

              <TextInput
                style={styles.input}
                placeholder={t('publish.listingTitle')}
                placeholderTextColor={theme.inkSoft}
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={styles.input}
                placeholder={t('publish.priceLabel')}
                placeholderTextColor={theme.inkSoft}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
              <CurrencySelect value={currency} onChange={setCurrency} locale={locale} label={t('publish.currencyLabel')} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={hasStructured ? t('publish.extraNotes') : t('publish.description')}
                placeholderTextColor={theme.inkSoft}
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </ScrollView>
            <View style={styles.ctaBar}>
              <Pressable
                style={[styles.publishBtn, (publishing || photosUploading) && styles.publishDisabled]}
                onPress={publish}
                disabled={publishing || photosUploading}
              >
                {publishing ? (
                  <ActivityIndicator color={theme.pearl} />
                ) : (
                  <>
                    <AppIcon name="check" size={20} color={theme.pearl} />
                    <Text style={styles.publishText}>{t('marketplaceExtra.publishCash')}</Text>
                  </>
                )}
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 24 },
  stepHint: { fontSize: 15, color: theme.inkMuted, marginBottom: 16 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  catTile: {
    width: '47%',
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  catTileOn: { borderColor: theme.oasis, backgroundColor: 'rgba(45,138,98,0.08)' },
  catIcon: { fontSize: 22 },
  catName: { fontSize: 13, fontWeight: '700', color: theme.ink, marginTop: 6, textAlign: 'center' },
  ctaBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
    backgroundColor: 'rgba(250,248,244,0.96)',
  },
  nextBtn: {
    backgroundColor: theme.ink,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 54,
  },
  nextText: { color: theme.pearl, fontWeight: '800', fontSize: 16 },
  selectedCat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: 'rgba(168,132,45,0.1)',
  },
  selectedCatIcon: { fontSize: 20 },
  selectedCatText: { flex: 1, fontWeight: '700', color: theme.ink },
  changeCat: { color: theme.dune, fontWeight: '700', fontSize: 13 },
  attrBlock: {
    marginBottom: 16,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  attrTitle: { fontSize: 15, fontWeight: '800', color: theme.ink, marginBottom: 12 },
  attrLabel: { fontSize: 13, fontWeight: '700', color: theme.inkMuted, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radii.md,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    minHeight: 52,
    color: theme.ink,
    backgroundColor: theme.surface,
  },
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  publishBtn: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: theme.oasisDeep,
    borderRadius: radii.lg,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 56,
  },
  publishDisabled: { opacity: 0.7 },
  publishText: { color: theme.pearl, fontSize: 16, fontWeight: '800' },
});
