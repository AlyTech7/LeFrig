import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchWithMeta, API_URL } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, gradients } from '@/lib/theme';
import { AppIcon } from '@/components/AppIcon';
import { useT } from '@/lib/locale';
import { resolveImageUrl } from '@lefrig/shared';

type ShopDetail = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  verified?: boolean;
  acceptsCash?: boolean;
  acceptsFiado?: boolean;
  camp?: { nameEs: string };
  owner?: { id: string; displayName: string };
  products?: { id: string; name: string; price: number | string }[];
};

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { authFetch, isSignedIn, syncUser } = useAuthApi();
  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    fetchWithMeta<ShopDetail>(`/shops/${id}`, { id, name: 'Tienda', camp: { nameEs: 'Campamento' }, products: [] }).then(
      (res) => {
        setShop(res.data);
        setLoading(false);
      },
    );
    authFetch<{ id: string }[]>('/shops/mine')
      .then((mine) => setIsOwner(mine.some((s) => s.id === id)))
      .catch(() => setIsOwner(false));
  }, [id, authFetch]);

  const toggleProduct = (productId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const placeOrder = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    const products = (shop?.products ?? []).filter((p) => selected.has(p.id));
    if (products.length === 0) {
      Alert.alert(t('shops.products'), t('publish.completeRequired'));
      return;
    }
    setOrdering(true);
    try {
      await syncUser();
      await authFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          shopId: shop!.id,
          items: products.map((p) => ({ productId: p.id, quantity: 1 })),
          paymentMethod: 'cash',
          notes: 'Pedido desde mobile Lefrig',
        }),
      });
      router.push('/orders');
    } catch {
      Alert.alert(t('common.error'), t('report.error'));
    } finally {
      setOrdering(false);
    }
  };

  const contactOwner = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    if (!shop?.owner?.id) {
      Alert.alert(t('footer.contact'), t('marketplaceExtra.contactCoordinate'));
      return;
    }
    setContacting(true);
    try {
      await syncUser();
      await authFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: shop.owner.id,
          content: `Hola, me interesa tu tienda: ${shop.name}`,
          refId: shop.id,
          type: 'shop',
        }),
      });
      router.push('/messages');
    } catch {
      Alert.alert(t('common.error'), t('messages.empty'));
    } finally {
      setContacting(false);
    }
  };

  if (loading || !shop) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={theme.dune} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.hero]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <AppIcon name="arrow-left" size={20} color={theme.text} />
            <Text style={styles.backText}>{t('shops.title')}</Text>
          </Pressable>
          <View style={styles.headerRow}>
            {shop.imageUrl ? (
              <Image source={{ uri: resolveImageUrl(shop.imageUrl, API_URL) ?? shop.imageUrl }} style={styles.coverImg} />
            ) : (
              <View style={styles.iconWrap}>
                <AppIcon name="shopping-bag" size={28} color={theme.dune} />
              </View>
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.name}>{shop.name}</Text>
              <Text style={styles.camp}>
                {shop.camp?.nameEs ?? t('shops.campFallback')}
                {shop.verified ? ` · ${t('shops.verified')}` : ''}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {shop.description ? <Text style={styles.desc}>{shop.description}</Text> : null}

        <View style={styles.badges}>
          {shop.acceptsCash !== false && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t('common.cash')}</Text>
            </View>
          )}
        </View>

        <Text style={styles.section}>{t('shops.catalog')}</Text>
        {(shop.products ?? []).length === 0 ? (
          <Text style={styles.empty}>{t('shops.noProducts')}</Text>
        ) : (
          shop.products!.map((p) => {
            const active = selected.has(p.id);
            return (
              <Pressable key={p.id} style={[styles.product, active && styles.productActive]} onPress={() => toggleProduct(p.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.productPrice}>{Number(p.price).toLocaleString()} MRU</Text>
                </View>
                {active && <AppIcon name="check" size={18} color={theme.emeraldDeep} />}
              </Pressable>
            );
          })
        )}

        {isOwner && (
          <Pressable style={styles.manageBtn} onPress={() => router.push(`/shops/${id}/manage` as never)}>
            <AppIcon name="edit-3" size={18} color={theme.dune} />
            <Text style={styles.manageText}>{t('shops.manageMyShop')}</Text>
          </Pressable>
        )}

        <Pressable style={[styles.orderBtn, ordering && styles.btnDisabled]} onPress={placeOrder} disabled={ordering}>
          {ordering ? (
            <ActivityIndicator color={theme.text} />
          ) : (
            <Text style={styles.orderText}>{t('shops.orderSelected')}</Text>
          )}
        </Pressable>

        <Pressable style={[styles.contactBtn, contacting && styles.btnDisabled]} onPress={contactOwner} disabled={contacting}>
          {contacting ? (
            <ActivityIndicator color={theme.dune} />
          ) : (
            <>
              <AppIcon name="message-circle" size={18} color={theme.dune} />
              <Text style={styles.contactText}>{t('shops.contactShop')}</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  safe: { flex: 1, backgroundColor: theme.canvas },
  header: { paddingBottom: 24 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 8 },
  backText: { color: theme.text, fontWeight: '600' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 12, gap: 14 },
  iconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  coverImg: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)' },
  headerInfo: { flex: 1 },
  name: { fontSize: 24, fontWeight: '800', color: theme.text },
  camp: { fontSize: 14, color: theme.inkMuted, marginTop: 4 },
  content: { padding: 20, paddingBottom: 100 },
  desc: { fontSize: 15, color: theme.inkMuted, lineHeight: 22, marginBottom: 16 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  badge: { backgroundColor: 'rgba(52,211,153,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeMuted: { backgroundColor: 'rgba(0,0,0,0.04)' },
  badgeText: { color: theme.emeraldDeep, fontWeight: '600', fontSize: 13 },
  badgeTextMuted: { color: theme.inkMuted, fontWeight: '600', fontSize: 13 },
  section: { fontSize: 16, fontWeight: '800', color: theme.ink, marginBottom: 12 },
  empty: { color: theme.inkMuted, marginBottom: 20 },
  product: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 8,
  },
  productActive: { borderColor: theme.emeraldDeep, backgroundColor: 'rgba(13,148,136,0.06)' },
  productName: { fontSize: 16, fontWeight: '600', color: theme.ink },
  productPrice: { fontSize: 14, color: theme.emeraldDeep, marginTop: 2, fontWeight: '600' },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,184,109,0.4)',
    backgroundColor: 'rgba(232,184,109,0.08)',
  },
  manageText: { color: theme.dune, fontWeight: '700', fontSize: 16 },
  orderBtn: {
    backgroundColor: theme.emeraldDeep,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    minHeight: 56,
    justifyContent: 'center',
  },
  orderText: { color: theme.text, fontSize: 17, fontWeight: '700' },
  contactBtn: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(232,184,109,0.35)',
  },
  contactText: { color: theme.dune, fontWeight: '700', fontSize: 16 },
  btnDisabled: { opacity: 0.7 },
});
