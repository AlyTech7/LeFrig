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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { useT } from '@/lib/locale';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, gradients } from '@/lib/theme';

type Product = { id: string; name: string; price: number | string; stock?: number };

export default function ShopProductsScreen() {
  const { id: shopId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { authFetch, syncUser } = useAuthApi();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', stock: '0', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', stock: '0' });

  const load = async () => {
    if (!shopId) return;
    try {
      const data = await authFetch<Product[]>(`/shops/${shopId}/products`);
      setProducts(data);
    } catch {
      Alert.alert(t('common.error'), t('report.error'), [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncUser().then(load);
  }, [shopId]);

  const addProduct = async () => {
    if (!form.name.trim() || !form.price) return;
    setSubmitting(true);
    try {
      await authFetch(`/shops/${shopId}/products`, {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          price: Number(form.price),
          stock: Number(form.stock) || 0,
        }),
      });
      setForm({ name: '', price: '', stock: '0', description: '' });
      setShowForm(false);
      await load();
    } catch {
      Alert.alert(t('common.error'), t('report.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const saveEdit = async (productId: string) => {
    setSubmitting(true);
    try {
      await authFetch(`/shops/${shopId}/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name.trim(),
          price: Number(editForm.price),
          stock: Number(editForm.stock) || 0,
        }),
      });
      setEditingId(null);
      await load();
    } catch {
      Alert.alert(t('common.error'), t('report.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const removeProduct = async (productId: string) => {
    Alert.alert(t('common.remove'), t('shops.noProducts'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await authFetch(`/shops/${shopId}/products/${productId}`, { method: 'DELETE' });
            setProducts((prev) => prev.filter((p) => p.id !== productId));
          } catch {
            Alert.alert(t('common.error'), t('report.error'));
          }
        },
      },
    ]);
  };

  if (loading) {
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
            <Text style={styles.backText}>{t('shops.myShop')}</Text>
          </Pressable>
          <Text style={styles.heroTitle}>{t('shops.myProducts')}</Text>
        </SafeAreaView>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <AppIcon name="plus" size={20} color={theme.ink} />
          <Text style={styles.addText}>{showForm ? t('common.cancel') : t('shops.productName')}</Text>
        </Pressable>

        {showForm && (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder={t('shops.productName')}
              placeholderTextColor={theme.inkMuted}
              value={form.name}
              onChangeText={(name) => setForm({ ...form, name })}
            />
            <TextInput
              style={styles.input}
              placeholder={t('shops.price')}
              placeholderTextColor={theme.inkMuted}
              keyboardType="numeric"
              value={form.price}
              onChangeText={(price) => setForm({ ...form, price })}
            />
            <TextInput
              style={styles.input}
              placeholder={t('shops.stock')}
              placeholderTextColor={theme.inkMuted}
              keyboardType="numeric"
              value={form.stock}
              onChangeText={(stock) => setForm({ ...form, stock })}
            />
            <Pressable style={styles.submit} onPress={addProduct} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={theme.ink} />
              ) : (
                <Text style={styles.submitText}>{t('shops.saveProduct')}</Text>
              )}
            </Pressable>
          </View>
        )}

        {products.length === 0 ? (
          <Text style={styles.empty}>{t('shops.noProductsYet')}</Text>
        ) : (
          products.map((p) => (
            <View key={p.id} style={styles.row}>
              {editingId === p.id ? (
                <View style={{ flex: 1, gap: 8 }}>
                  <TextInput
                    style={styles.input}
                    value={editForm.name}
                    onChangeText={(name) => setEditForm({ ...editForm, name })}
                  />
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={editForm.price}
                    onChangeText={(price) => setEditForm({ ...editForm, price })}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable style={styles.submit} onPress={() => saveEdit(p.id)}>
                      <Text style={styles.submitText}>{t('common.save')}</Text>
                    </Pressable>
                    <Pressable style={styles.cancelBtn} onPress={() => setEditingId(null)}>
                      <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{p.name}</Text>
                    <Text style={styles.price}>
                      {Number(p.price).toLocaleString()} duros
                      {p.stock != null ? ` · Stock ${p.stock}` : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setEditingId(p.id);
                      setEditForm({ name: p.name, price: String(p.price), stock: String(p.stock ?? 0) });
                    }}
                    style={{ marginRight: 12 }}
                  >
                    <AppIcon name="edit-3" size={18} color={theme.emeraldDeep} />
                  </Pressable>
                  <Pressable onPress={() => removeProduct(p.id)}>
                    <AppIcon name="trash-2" size={18} color={theme.terracotta} />
                  </Pressable>
                </>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  header: { paddingBottom: 16 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 8 },
  backText: { color: theme.text, fontWeight: '600' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: theme.text, paddingHorizontal: 20, marginTop: 8 },
  safe: { flex: 1, backgroundColor: theme.canvas },
  content: { padding: 20, paddingBottom: 100 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.dune,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  addText: { fontWeight: '800', color: theme.ink },
  form: { marginBottom: 20, gap: 10 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    color: theme.ink,
  },
  submit: {
    backgroundColor: theme.emeraldDeep,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  submitText: { color: theme.text, fontWeight: '700' },
  empty: { textAlign: 'center', color: theme.inkMuted, marginTop: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  name: { fontSize: 16, fontWeight: '600', color: theme.ink },
  price: { fontSize: 14, color: theme.emeraldDeep, marginTop: 2, fontWeight: '600' },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  cancelText: { color: theme.inkMuted, fontWeight: '600' },
});
