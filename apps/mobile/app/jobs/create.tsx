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
import type { CampSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { fetchWithMeta } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, gradients } from '@/lib/theme';

const JOB_TYPE_KEYS = [
  { value: 'offer', labelKey: 'jobs.offer' },
  { value: 'seeking', labelKey: 'jobs.seek' },
];

const CATEGORY_KEYS = [
  { value: 'skilled', labelKey: 'jobs.categories.construction' },
  { value: 'daily', labelKey: 'jobs.categories.general' },
  { value: 'professional', labelKey: 'jobs.categories.education' },
  { value: 'other', labelKey: 'jobs.categories.other' },
];

export default function CreateJobScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const { authFetch, syncUser, isSignedIn } = useAuthApi();
  const [camps, setCamps] = useState<CampSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    jobType: 'offer',
    category: 'skilled',
    title: '',
    description: '',
    salary: '',
    contactPhone: '',
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
      await authFetch('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          campId: form.campId,
          jobType: form.jobType,
          category: form.category,
          title: form.title.trim(),
          description: form.description.trim(),
          salary: form.salary ? Number(form.salary) : undefined,
          contactPhone: form.contactPhone.trim() || undefined,
        }),
      });
      Alert.alert(t('common.success'), t('jobs.create.success'), [
        { text: 'OK', onPress: () => router.replace('/jobs') },
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
            <Text style={styles.backText}>{t('jobs.title')}</Text>
          </Pressable>
          <Text style={styles.title}>{t('jobs.create.title')}</Text>
          <Text style={styles.sub}>{t('jobs.boardSubtitle')}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>{t('publish.stepCategory')}</Text>
        <View style={styles.chipsRow}>
          {JOB_TYPE_KEYS.map((jt) => (
            <Pressable
              key={jt.value}
              style={[styles.chip, form.jobType === jt.value && styles.chipActive]}
              onPress={() => setForm({ ...form, jobType: jt.value })}
            >
              <Text style={[styles.chipText, form.jobType === jt.value && styles.chipTextActive]}>{t(jt.labelKey)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>{t('jobs.create.category')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {CATEGORY_KEYS.map((c) => (
            <Pressable
              key={c.value}
              style={[styles.chip, form.category === c.value && styles.chipActive]}
              onPress={() => setForm({ ...form, category: c.value })}
            >
              <Text style={[styles.chipText, form.category === c.value && styles.chipTextActive]}>{t(c.labelKey)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.label}>{t('jobs.create.jobTitle')}</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={(title) => setForm({ ...form, title })}
          placeholder="Ej. Técnico solar"
          placeholderTextColor={theme.textDarkMuted}
        />

        <Text style={styles.label}>{t('jobs.create.description')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={(description) => setForm({ ...form, description })}
          multiline
          placeholder="Detalla la oferta o tu experiencia"
          placeholderTextColor={theme.textDarkMuted}
        />

        <Text style={styles.label}>{t('jobs.create.salary')} ({t('common.optional')})</Text>
        <TextInput
          style={styles.input}
          value={form.salary}
          onChangeText={(salary) => setForm({ ...form, salary })}
          keyboardType="numeric"
          placeholder="8000"
          placeholderTextColor={theme.textDarkMuted}
        />

        <Text style={styles.label}>{t('auth.phonePlaceholder')} ({t('common.optional')})</Text>
        <TextInput
          style={styles.input}
          value={form.contactPhone}
          onChangeText={(contactPhone) => setForm({ ...form, contactPhone })}
          keyboardType="phone-pad"
          placeholder="+222..."
          placeholderTextColor={theme.textDarkMuted}
        />

        <Text style={styles.label}>{t('jobs.create.camp')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {camps.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.chip, form.campId === c.id && styles.chipActive]}
              onPress={() => setForm({ ...form, campId: c.id })}
            >
              <Text style={[styles.chipText, form.campId === c.id && styles.chipTextActive]}>{pickName(locale, c)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable style={[styles.cta, submitting && styles.ctaDisabled]} onPress={submit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={theme.text} />
          ) : (
            <Text style={styles.ctaText}>{t('jobs.create.submit')}</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  header: { paddingBottom: 24 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 8 },
  backText: { color: theme.text, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: theme.text, paddingHorizontal: 20, marginTop: 12 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', paddingHorizontal: 20, marginTop: 4 },
  form: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '700', color: theme.textDarkMuted, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 14,
    fontSize: 16,
    color: theme.textDark,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  chipsScroll: { marginBottom: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { borderColor: theme.gold, backgroundColor: 'rgba(212,175,55,0.12)' },
  chipText: { fontSize: 14, color: theme.textDarkMuted, fontWeight: '600' },
  chipTextActive: { color: theme.obsidian },
  cta: {
    backgroundColor: theme.emeraldDeep,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 28,
    minHeight: 56,
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: { color: theme.text, fontSize: 17, fontWeight: '700' },
});
