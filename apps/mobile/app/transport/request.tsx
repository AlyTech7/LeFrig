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
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { CampSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { fetchWithMeta } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, gradients } from '@/lib/theme';

const TYPE_KEYS = [
  { value: 'shared_ride', labelKey: 'transport.tripModes.shared' },
  { value: 'package', labelKey: 'transport.tripModes.package' },
  { value: 'private', labelKey: 'transport.tripModes.private' },
];

export default function TransportRequestScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const isTindouf = type === 'tindouf';
  const { authFetch, syncUser, isSignedIn } = useAuthApi();
  const [camps, setCamps] = useState<CampSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: isTindouf ? 'tindouf_import' : 'shared_ride',
    originCampId: '',
    destinationCampId: '',
    description: '',
    priceEstimate: '',
  });

  useEffect(() => {
    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }
    fetchWithMeta<CampSummary[]>('/camps', []).then((res) => {
      setCamps(res.data);
      const tindouf = res.data.find((c) => c.slug === 'tindouf') ?? res.data[0];
      const dest = res.data.find((c) => c.slug === 'rabouni') ?? res.data[1] ?? res.data[0];
      setForm((f) => ({
        ...f,
        originCampId: isTindouf ? tindouf?.id ?? '' : f.originCampId || res.data[0]?.id || '',
        destinationCampId: isTindouf ? dest?.id ?? '' : f.destinationCampId || res.data[1]?.id || res.data[0]?.id || '',
        type: isTindouf ? 'tindouf_import' : f.type,
      }));
    });
  }, [isSignedIn, isTindouf, router]);

  const submit = async () => {
    if (!form.originCampId || !form.destinationCampId) {
      Alert.alert(t('common.error'), t('transport.routeIncomplete'));
      return;
    }
    setSubmitting(true);
    try {
      await syncUser();
      await authFetch('/transport', {
        method: 'POST',
        body: JSON.stringify({
          type: form.type,
          originCampId: form.originCampId,
          destinationCampId: form.destinationCampId,
          description: form.description.trim() || (isTindouf ? t('transport.tindoufCta') : t('transport.requestTitle')),
          priceEstimate: form.priceEstimate ? Number(form.priceEstimate) : undefined,
          paymentMethod: 'cash',
        }),
      });
      Alert.alert(t('common.success'), t('transport.requestSent'), [
        { text: 'OK', onPress: () => router.replace('/transport') },
      ]);
    } catch {
      Alert.alert(t('common.error'), t('report.error'));
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
            <Text style={styles.backText}>{t('transport.title')}</Text>
          </Pressable>
          <Text style={styles.title}>{isTindouf ? t('transport.tindoufTitle') : t('transport.requestTitle')}</Text>
          <Text style={styles.sub}>{t('payment.cash')}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.form}>
        {!isTindouf && (
          <>
            <Text style={styles.label}>{t('transport.type')}</Text>
            <View style={styles.chipsRow}>
              {TYPE_KEYS.map((typeOpt) => (
                <Pressable
                  key={typeOpt.value}
                  style={[styles.chip, form.type === typeOpt.value && styles.chipActive]}
                  onPress={() => setForm({ ...form, type: typeOpt.value })}
                >
                  <Text style={[styles.chipText, form.type === typeOpt.value && styles.chipTextActive]}>{t(typeOpt.labelKey)}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>{t('transport.origin')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {camps.map((c) => (
            <Pressable
              key={`o-${c.id}`}
              style={[styles.chip, form.originCampId === c.id && styles.chipActive]}
              onPress={() => setForm({ ...form, originCampId: c.id })}
            >
              <Text style={[styles.chipText, form.originCampId === c.id && styles.chipTextActive]}>{pickName(locale, c)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.label}>{t('transport.destination')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {camps.map((c) => (
            <Pressable
              key={`d-${c.id}`}
              style={[styles.chip, form.destinationCampId === c.id && styles.chipActive]}
              onPress={() => setForm({ ...form, destinationCampId: c.id })}
            >
              <Text style={[styles.chipText, form.destinationCampId === c.id && styles.chipTextActive]}>{pickName(locale, c)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.label}>{t('transport.description')} ({t('common.optional')})</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={(description) => setForm({ ...form, description })}
          multiline
          placeholderTextColor={theme.textDarkMuted}
        />

        <Text style={styles.label}>{t('transport.budget')} ({t('common.optional')})</Text>
        <TextInput
          style={styles.input}
          value={form.priceEstimate}
          onChangeText={(priceEstimate) => setForm({ ...form, priceEstimate })}
          keyboardType="numeric"
          placeholderTextColor={theme.textDarkMuted}
        />

        <Pressable style={[styles.cta, submitting && styles.ctaDisabled]} onPress={submit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={theme.text} />
          ) : (
            <Text style={styles.ctaText}>{t('transport.sendRequest')}</Text>
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
  title: { fontSize: 26, fontWeight: '800', color: theme.text, paddingHorizontal: 20, marginTop: 12 },
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
  textArea: { minHeight: 90, textAlignVertical: 'top' },
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
