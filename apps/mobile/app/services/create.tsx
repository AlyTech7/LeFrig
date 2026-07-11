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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SERVICE_CATEGORIES } from '@lefrig/shared';
import type { CampSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { fetchWithMeta } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, gradients } from '@/lib/theme';

export default function CreateServiceScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const { authFetch, syncUser, isSignedIn } = useAuthApi();
  const [camps, setCamps] = useState<CampSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    categorySlug: 'electrician',
    title: '',
    description: '',
    priceFrom: '',
    campId: '',
  });

  useEffect(() => {
    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }
    fetchWithMeta<CampSummary[]>('/camps', []).then((res) => {
      setCamps(res.data);
      setForm((f) => ({ ...f, campId: f.campId || res.data[0]?.id || '' }));
    });
  }, [isSignedIn, router]);

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.campId) {
      Alert.alert(t('common.error'), t('publish.completeRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await syncUser();
      await authFetch('/services', {
        method: 'POST',
        body: JSON.stringify({
          categorySlug: form.categorySlug,
          title: form.title.trim(),
          description: form.description.trim(),
          priceFrom: form.priceFrom ? Number(form.priceFrom) : undefined,
          campIds: [form.campId],
        }),
      });
      Alert.alert(t('common.success'), t('services.create.success'), [
        { text: 'OK', onPress: () => router.replace('/services') },
      ]);
    } catch {
      Alert.alert(t('common.error'), t('marketplace.publishError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.hero]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <AppIcon name="arrow-left" size={20} color={theme.text} />
            <Text style={styles.backText}>{t('services.title')}</Text>
          </Pressable>
          <Text style={styles.title}>{t('services.create.title')}</Text>
          <Text style={styles.sub}>{t('services.lead')}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>{t('services.create.category')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {SERVICE_CATEGORIES.map((c) => (
            <Pressable
              key={c.slug}
              style={[styles.chip, form.categorySlug === c.slug && styles.chipActive]}
              onPress={() => setForm({ ...form, categorySlug: c.slug })}
            >
              <Text style={[styles.chipText, form.categorySlug === c.slug && styles.chipTextActive]}>
                {pickName(locale, c)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.label}>{t('services.create.name')}</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Electricista certificado"
          placeholderTextColor={theme.textDarkMuted}
          value={form.title}
          onChangeText={(title) => setForm({ ...form, title })}
        />

        <Text style={styles.label}>{t('services.create.description')}</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Qué ofreces, experiencia, horarios..."
          placeholderTextColor={theme.textDarkMuted}
          value={form.description}
          onChangeText={(description) => setForm({ ...form, description })}
          multiline
        />

        <Text style={styles.label}>{t('services.create.price')}</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder={t('common.optional')}
          placeholderTextColor={theme.textDarkMuted}
          value={form.priceFrom}
          onChangeText={(priceFrom) => setForm({ ...form, priceFrom })}
        />

        {camps.length > 0 && (
          <>
            <Text style={styles.label}>{t('services.create.camp')}</Text>
            <View style={styles.campList}>
              {camps.map((c) => (
                <Pressable
                  key={c.id}
                  style={[styles.campChip, form.campId === c.id && styles.chipActive]}
                  onPress={() => setForm({ ...form, campId: c.id })}
                >
                  <Text style={[styles.chipText, form.campId === c.id && styles.chipTextActive]}>{pickName(locale, c)}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Pressable style={styles.submit} onPress={submit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={theme.obsidian} />
          ) : (
            <Text style={styles.submitText}>{t('services.create.submit')}</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  header: { paddingBottom: 24, paddingHorizontal: 20 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, marginBottom: 16 },
  backText: { color: theme.textMuted, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: theme.text },
  sub: { fontSize: 14, color: theme.textMuted, marginTop: 6 },
  form: { padding: 20, paddingBottom: 100 },
  label: { fontSize: 14, fontWeight: '700', color: theme.textDark, marginBottom: 8, marginTop: 12 },
  chipsScroll: { marginBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginRight: 8,
  },
  chipActive: { backgroundColor: theme.emeraldDeep, borderColor: theme.emeraldDeep },
  chipText: { fontSize: 13, fontWeight: '600', color: theme.textDark },
  chipTextActive: { color: theme.text },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    color: theme.textDark,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  campList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  campChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  submit: {
    marginTop: 28,
    backgroundColor: theme.gold,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  submitText: { fontWeight: '800', fontSize: 17, color: theme.obsidian },
});
