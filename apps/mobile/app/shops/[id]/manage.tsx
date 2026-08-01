import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DEFAULT_PHONE_COUNTRY, resolveImageUrl } from '@lefrig/shared';
import { PhoneField } from '@/components/PhoneField';
import { Hero, Button, SegmentTabs, EmptyState } from '@/components/ui';
import { SingleImagePicker } from '@/components/ui/SingleImagePicker';
import { useAuthApi } from '@/lib/useAuthApi';
import { useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { type as typo, space, ui, fonts } from '@/lib/ui';
import { API_URL } from '@/lib/api';

type Product = {
  id: string;
  name: string;
  price: number | string;
  stock?: number;
  description?: string;
  imageUrl?: string;
};

type ShopInfo = {
  id: string;
  name: string;
  description?: string | null;
  shopType: string;
  phone: string;
  whatsapp?: string | null;
  imageUrl?: string | null;
  acceptsCash: boolean;
  isActive: boolean;
};

const SHOP_TYPES = ['individual', 'restaurant', 'cooperative', 'association', 'workshop', 'pharmacy'] as const;
const TYPE_KEYS: Record<string, string> = {
  individual: 'shops.typeIndividual',
  restaurant: 'shops.typeRestaurant',
  cooperative: 'shops.typeCooperative',
  association: 'shops.typeAssociation',
  workshop: 'shops.typeWorkshop',
  pharmacy: 'shops.typePharmacy',
};

export default function ShopManageScreen() {
  const { id: shopId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { authFetch, syncUser, isSignedIn, isLoaded, getAccessToken } = useAuthApi();
  const [tab, setTab] = useState<'profile' | 'products'>('products');
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shopType, setShopType] = useState('individual');
  const [phone, setPhone] = useState<string>(DEFAULT_PHONE_COUNTRY.dial);
  const [whatsapp, setWhatsapp] = useState('');
  const [acceptsCash, setAcceptsCash] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('0');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    setError('');
    try {
      await syncUser();
      const s = await authFetch<ShopInfo>(`/shops/${shopId}`);
      setShop(s);
      setName(s.name);
      setDescription(s.description ?? '');
      setShopType(s.shopType || 'individual');
      setPhone(s.phone || DEFAULT_PHONE_COUNTRY.dial);
      setWhatsapp(s.whatsapp ?? '');
      setAcceptsCash(s.acceptsCash);
      setIsActive(s.isActive);
      setCoverUrl(s.imageUrl ?? null);
      const prods = await authFetch<Product[]>(`/shops/${shopId}/products`);
      setProducts(Array.isArray(prods) ? prods : []);
    } catch {
      setError(t('shops.manage.noPermission'));
    } finally {
      setLoading(false);
    }
  }, [authFetch, shopId, syncUser, t]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }
    void load();
  }, [isLoaded, isSignedIn, load, router]);

  const saveProfile = async () => {
    setSaving(true);
    setError('');
    try {
      await authFetch(`/shops/${shopId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          shopType,
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || undefined,
          acceptsCash,
          isActive,
          imageUrl: coverUrl || undefined,
        }),
      });
      Alert.alert(t('common.success'), t('shops.manage.profileSaved'));
      await load();
    } catch {
      setError(t('shops.manage.profileError'));
    } finally {
      setSaving(false);
    }
  };

  const addProduct = async () => {
    if (!prodName.trim() || !prodPrice) return;
    setSaving(true);
    try {
      await authFetch(`/shops/${shopId}/products`, {
        method: 'POST',
        body: JSON.stringify({
          name: prodName.trim(),
          description: prodDesc.trim() || undefined,
          price: Number(prodPrice),
          stock: Number(prodStock) || 0,
          imageUrl: prodImage || undefined,
        }),
      });
      setProdName('');
      setProdPrice('');
      setProdStock('0');
      setProdDesc('');
      setProdImage(null);
      Alert.alert(t('common.success'), t('shops.manage.added'));
      await load();
    } catch {
      Alert.alert(t('common.error'), t('shops.manage.addError'));
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = (productId: string) => {
    Alert.alert(t('common.remove'), t('shops.manage.confirmRemove'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await authFetch(`/shops/${shopId}/products/${productId}`, { method: 'DELETE' });
            setProducts((p) => p.filter((x) => x.id !== productId));
          } catch {
            Alert.alert(t('common.error'), t('shops.manage.removeError'));
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[ui.screen, styles.center]}>
        <ActivityIndicator color={theme.dune} size="large" />
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={ui.screen}>
        <Hero title={t('shops.manage.title')} />
        <EmptyState icon="alert-circle" title={error || t('shops.manage.noPermission')} />
      </View>
    );
  }

  return (
    <View style={ui.screen}>
      <Hero title={shop.name} subtitle={t('shops.manage.catalogDefault')} kicker={t('shops.manage.badge')} />
      <View style={styles.tabs}>
        <SegmentTabs
          tabs={[
            { id: 'products', label: t('shops.manage.tabProducts') },
            { id: 'profile', label: t('shops.manage.tabProfile') },
          ]}
          value={tab}
          onChange={(id) => setTab(id as 'profile' | 'products')}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ScrollView contentContainerStyle={styles.body}>
        {tab === 'profile' ? (
          <>
            <SingleImagePicker
              label={t('shops.studio.shopHint')}
              url={coverUrl}
              onChange={setCoverUrl}
              getToken={getAccessToken}
            />
            <Text style={styles.label}>{t('shops.studio.nameLabel')}</Text>
            <TextInput style={ui.input} value={name} onChangeText={setName} />
            <Text style={styles.label}>{t('shops.register.description')}</Text>
            <TextInput
              style={[ui.input, styles.area]}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <Text style={styles.label}>{t('shops.studio.whatType')}</Text>
            <View style={styles.chips}>
              {SHOP_TYPES.map((type) => (
                <Pressable
                  key={type}
                  style={[styles.typeChip, shopType === type && styles.typeChipOn]}
                  onPress={() => setShopType(type)}
                >
                  <Text style={[styles.typeChipText, shopType === type && styles.typeChipTextOn]}>
                    {t(TYPE_KEYS[type])}
                  </Text>
                </Pressable>
              ))}
            </View>
            <PhoneField label={t('shops.studio.phone')} value={phone} onChange={setPhone} />
            <View style={{ height: 8 }} />
            <PhoneField
              label={t('shops.studio.whatsappOptional')}
              value={whatsapp || DEFAULT_PHONE_COUNTRY.dial}
              onChange={setWhatsapp}
            />
            <View style={styles.switchRow}>
              <Text style={typo.body}>{t('shops.tagCash')}</Text>
              <Switch value={acceptsCash} onValueChange={setAcceptsCash} trackColor={{ true: theme.oasis }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={typo.body}>{isActive ? t('shops.manage.activeBadge') : t('shops.manage.pausedBadge')}</Text>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: theme.oasis }} />
            </View>
            <Button
              label={t('shops.manage.saveProfile')}
              variant="gold"
              fullWidth
              loading={saving}
              onPress={() => void saveProfile()}
              style={{ marginTop: space.lg }}
            />
          </>
        ) : (
          <>
            <Text style={styles.section}>{t('shops.manage.addProduct')}</Text>
            <Text style={styles.hint}>{t('shops.manage.addHint')}</Text>
            <SingleImagePicker url={prodImage} onChange={setProdImage} getToken={getAccessToken} />
            <TextInput
              style={ui.input}
              placeholder={t('shops.manage.namePlaceholder')}
              value={prodName}
              onChangeText={setProdName}
              placeholderTextColor={theme.inkSoft}
            />
            <View style={styles.row2}>
              <TextInput
                style={[ui.input, { flex: 1 }]}
                placeholder="DZD"
                keyboardType="decimal-pad"
                value={prodPrice}
                onChangeText={setProdPrice}
                placeholderTextColor={theme.inkSoft}
              />
              <TextInput
                style={[ui.input, { flex: 1 }]}
                placeholder={t('shops.manage.stockLabel', { count: 0 }).replace(': 0', '')}
                keyboardType="number-pad"
                value={prodStock}
                onChangeText={setProdStock}
                placeholderTextColor={theme.inkSoft}
              />
            </View>
            <TextInput
              style={[ui.input, styles.area]}
              placeholder={t('shops.manage.descPlaceholder')}
              value={prodDesc}
              onChangeText={setProdDesc}
              multiline
              placeholderTextColor={theme.inkSoft}
            />
            <Button
              label={t('shops.manage.addToCatalog')}
              variant="oasis"
              fullWidth
              loading={saving}
              onPress={() => void addProduct()}
            />

            <Text style={[styles.section, { marginTop: space.xl }]}>{t('shops.manage.yourCatalog')}</Text>
            {products.length === 0 ? (
              <EmptyState icon="package" title={t('shops.manage.emptyTitle')} body={t('shops.manage.emptyHint')} />
            ) : (
              products.map((p) => {
                const img = p.imageUrl ? resolveImageUrl(p.imageUrl, API_URL) ?? p.imageUrl : null;
                return (
                  <View key={p.id} style={styles.prod}>
                    {img ? (
                      <Image source={{ uri: img }} style={styles.prodImg} />
                    ) : (
                      <View style={[styles.prodImg, styles.thumbEmpty]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.prodName}>{p.name}</Text>
                      <Text style={styles.prodMeta}>
                        {p.price} · {t('shops.manage.stockLabel', { count: p.stock ?? 0 })}
                      </Text>
                    </View>
                    <Button label={t('shops.manage.remove')} variant="danger" onPress={() => removeProduct(p.id)} />
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  tabs: { paddingHorizontal: space.lg, paddingTop: space.sm },
  body: { padding: space.lg, paddingBottom: 140, gap: space.sm },
  label: { ...typo.label, marginTop: space.md, marginBottom: 6 },
  hint: { ...typo.caption, marginBottom: 8 },
  section: { ...typo.title, fontSize: 18, marginBottom: space.sm },
  area: { minHeight: 88, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space.sm },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  typeChipOn: {
    borderColor: theme.dune,
    backgroundColor: 'rgba(168,132,45,0.08)',
  },
  typeChipText: { fontFamily: fonts.bodySemi, fontSize: 13, color: theme.inkMuted },
  typeChipTextOn: { color: theme.ink, fontFamily: fonts.bodyBold },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: theme.canvasSoft,
  },
  row2: { flexDirection: 'row', gap: 10 },
  prod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    marginBottom: 10,
  },
  prodImg: { width: 52, height: 52, borderRadius: 10 },
  thumbEmpty: { backgroundColor: theme.canvasSoft },
  prodName: { ...typo.body, fontFamily: fonts.bodyBold },
  prodMeta: { ...typo.caption, marginTop: 2 },
  error: { ...typo.caption, color: theme.flare, marginHorizontal: space.lg },
});
