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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { CampSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { fetchWithMeta } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';

const JOB_TYPES = [
  { value: 'offer', labelKey: 'jobs.create.jobTypes.offer' },
  { value: 'seeking', labelKey: 'jobs.create.jobTypes.seeking' },
] as const;

const CATEGORIES = [
  { value: 'skilled', labelKey: 'jobs.create.categories.skilled' },
  { value: 'daily', labelKey: 'jobs.create.categories.daily' },
  { value: 'professional', labelKey: 'jobs.create.categories.professional' },
  { value: 'other', labelKey: 'jobs.create.categories.other' },
] as const;

export default function CreateJobScreen() {
  const router = useRouter();
  const t = useT();
  const { locale, dir } = useLocale();
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
      const list = Array.isArray(res.data) ? res.data : [];
      setCamps(list);
      setForm((f) => ({ ...f, campId: f.campId || list[0]?.id || '' }));
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
      Alert.alert(t('common.error'), t('jobs.create.publishError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.hero}>
          <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
            <AppIcon name="arrow-left" size={18} color={theme.dune} />
            <Text style={styles.backText}>{t('jobs.title')}</Text>
          </Pressable>
          <Text style={styles.kicker}>{t('jobs.boardTitle')}</Text>
          <Text style={[styles.title, dir === 'rtl' && styles.rtl]} accessibilityRole="header">
            {t('jobs.create.title')}
          </Text>
          <View style={styles.rule} />
          <Text style={[styles.lead, dir === 'rtl' && styles.rtl]}>{t('jobs.create.heroSub')}</Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>{t('jobs.create.type')}</Text>
          <View style={styles.segRow}>
            {JOB_TYPES.map((jt) => {
              const on = form.jobType === jt.value;
              return (
                <Pressable key={jt.value} style={styles.segItem} onPress={() => setForm({ ...form, jobType: jt.value })}>
                  <Text style={[styles.segText, on && styles.segTextOn]}>{t(jt.labelKey)}</Text>
                  <View style={[styles.segRule, on && styles.segRuleOn]} />
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>{t('jobs.create.category')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segScroll}>
            {CATEGORIES.map((c) => {
              const on = form.category === c.value;
              return (
                <Pressable
                  key={c.value}
                  style={styles.segItem}
                  onPress={() => setForm({ ...form, category: c.value })}
                >
                  <Text style={[styles.segText, on && styles.segTextOn]}>{t(c.labelKey)}</Text>
                  <View style={[styles.segRule, on && styles.segRuleOn]} />
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.label}>{t('jobs.create.jobTitle')}</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={(title) => setForm({ ...form, title })}
            placeholder={t('jobs.create.jobTitle')}
            placeholderTextColor={theme.inkSoft}
          />

          <Text style={styles.label}>{t('jobs.create.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.description}
            onChangeText={(description) => setForm({ ...form, description })}
            multiline
            placeholder={t('jobs.create.description')}
            placeholderTextColor={theme.inkSoft}
          />

          <Text style={styles.label}>{t('jobs.create.salary')}</Text>
          <TextInput
            style={styles.input}
            value={form.salary}
            onChangeText={(salary) => setForm({ ...form, salary })}
            keyboardType="numeric"
            placeholder="8000"
            placeholderTextColor={theme.inkSoft}
          />

          <Text style={styles.label}>{t('jobs.create.contactPhone')}</Text>
          <TextInput
            style={styles.input}
            value={form.contactPhone}
            onChangeText={(contactPhone) => setForm({ ...form, contactPhone })}
            keyboardType="phone-pad"
            placeholder={t('common.phonePlaceholder')}
            placeholderTextColor={theme.inkSoft}
          />

          <Text style={styles.label}>{t('jobs.create.camp')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segScroll}>
            {camps.map((c) => {
              const on = form.campId === c.id;
              return (
                <Pressable
                  key={c.id}
                  style={styles.segItem}
                  onPress={() => setForm({ ...form, campId: c.id })}
                >
                  <Text style={[styles.segText, on && styles.segTextOn]}>{pickName(locale, c)}</Text>
                  <View style={[styles.segRule, on && styles.segRuleOn]} />
                </Pressable>
              );
            })}
          </ScrollView>
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.ctaBar}>
          <Pressable
            style={[styles.cta, submitting && styles.ctaDisabled]}
            onPress={() => void submit()}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={theme.pearl} />
            ) : (
              <>
                <AppIcon name="check" size={18} color={theme.pearl} />
                <Text style={styles.ctaText}>{t('jobs.create.submit')}</Text>
              </>
            )}
          </Pressable>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  flex: { flex: 1 },
  hero: {
    paddingHorizontal: space.lg,
    paddingTop: 4,
    paddingBottom: 8,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { fontFamily: fonts.bodyBold, fontSize: 13, color: theme.dune },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.dune,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    letterSpacing: -0.7,
    color: theme.ink,
    marginTop: 4,
  },
  rule: {
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.dune,
    marginTop: 12,
    marginBottom: 8,
  },
  lead: { fontFamily: fonts.body, fontSize: 14, color: theme.inkMuted, lineHeight: 20 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },

  form: { paddingHorizontal: space.lg, paddingBottom: 24, paddingTop: 4 },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: theme.dune,
    marginBottom: 10,
    marginTop: 18,
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fonts.body,
    color: theme.ink,
  },
  textArea: { minHeight: 110, textAlignVertical: 'top' },

  segRow: { flexDirection: 'row', gap: 18 },
  segScroll: { gap: 18, paddingRight: 8 },
  segItem: { flexShrink: 0 },
  segText: { fontFamily: fonts.bodyMed, fontSize: 14, color: theme.inkSoft },
  segTextOn: { fontFamily: fonts.bodyBold, color: theme.ink },
  segRule: { height: 2, marginTop: 7, borderRadius: 1, backgroundColor: 'transparent' },
  segRuleOn: { backgroundColor: theme.dune },

  ctaBar: {
    paddingHorizontal: space.lg,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
    backgroundColor: 'rgba(250,248,244,0.96)',
  },
  cta: {
    backgroundColor: theme.ink,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 54,
    marginBottom: 8,
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 16, color: theme.pearl },
});
