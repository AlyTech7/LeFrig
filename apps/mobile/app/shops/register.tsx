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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { CampSummary } from '@lefrig/shared';
import { DEFAULT_PHONE_COUNTRY } from '@lefrig/shared';
import { PhoneField } from '@/components/PhoneField';
import { AppIcon } from '@/components/AppIcon';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { fetchWithMeta } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, gradients } from '@/lib/theme';

export default function RegisterShopScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const { authFetch, syncUser, isSignedIn } = useAuthApi();
  const [camps, setCamps] = useState<CampSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    phone: DEFAULT_PHONE_COUNTRY.dial,
    campId: '',
    acceptsCash: true,
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
    if (!form.name.trim() || !form.phone.trim() || !form.campId) {
      Alert.alert(t('common.error'), t('publish.completeRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await syncUser();
      await authFetch('/shops', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          phone: form.phone.trim(),
          campId: form.campId,
          acceptsCash: form.acceptsCash,
          shopType: 'individual',
        }),
      });
      Alert.alert(t('common.success'), t('shops.register.success'), [
        { text: 'OK', onPress: () => router.replace('/shops') },
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
            <Text style={styles.backText}>{t('shops.title')}</Text>
          </Pressable>
          <Text style={styles.title}>{t('shops.register.title')}</Text>
          <Text style={styles.sub}>{t('shops.verifiedMarsas')}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>{t('shops.register.name')}</Text>
        <TextInput style={styles.input} value={form.name} onChangeText={(name) => setForm({ ...form, name })} placeholder="Marsa Al-Khair" placeholderTextColor={theme.textDarkMuted} />

        <Text style={styles.label}>{t('auth.phonePlaceholder')}</Text>
        <PhoneField
          label={t('shops.studio.phone')}
          value={form.phone}
          onChange={(phone) => setForm({ ...form, phone })}
          locale={locale}
        />

        <Text style={styles.label}>{t('shops.register.description')} ({t('common.optional')})</Text>
        <TextInput style={[styles.input, styles.textArea]} value={form.description} onChangeText={(description) => setForm({ ...form, description })} multiline placeholderTextColor={theme.textDarkMuted} />

        <Text style={styles.label}>{t('shops.register.camp')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {camps.map((c) => (
            <Pressable key={c.id} style={[styles.chip, form.campId === c.id && styles.chipActive]} onPress={() => setForm({ ...form, campId: c.id })}>
              <Text style={[styles.chipText, form.campId === c.id && styles.chipTextActive]}>{pickName(locale, c)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('shops.acceptsCash')}</Text>
          <Switch value={form.acceptsCash} onValueChange={(acceptsCash) => setForm({ ...form, acceptsCash })} trackColor={{ true: theme.emeraldDeep }} />
        </View>

        <Pressable style={[styles.cta, submitting && styles.ctaDisabled]} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={theme.text} /> : <Text style={styles.ctaText}>{t('shops.register.submit')}</Text>}
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
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 14, fontSize: 16, color: theme.textDark },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', backgroundColor: '#fff', marginRight: 8, marginBottom: 8 },
  chipActive: { borderColor: theme.gold, backgroundColor: 'rgba(212,175,55,0.12)' },
  chipText: { fontSize: 14, color: theme.textDarkMuted, fontWeight: '600' },
  chipTextActive: { color: theme.obsidian },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: theme.textDark },
  cta: { backgroundColor: theme.emeraldDeep, borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 28, minHeight: 56, justifyContent: 'center' },
  ctaDisabled: { opacity: 0.7 },
  ctaText: { color: theme.text, fontSize: 17, fontWeight: '700' },
});
