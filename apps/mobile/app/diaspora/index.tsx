import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { CampSummary } from '@lefrig/shared';
import { fetchWithMeta } from '@/lib/api';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme } from '@/lib/theme';
import { AppIcon } from '@/components/AppIcon';

const PRODUCT_KEYS = [
  { type: 'food_basket', icon: 'shopping-bag' as const, labelKey: 'diaspora.products.foodBasket', color: ['#065f46', '#34d399'] as const },
  { type: 'school', icon: 'book-open' as const, labelKey: 'diaspora.products.voucher', color: ['#1e3a5f', '#60a5fa'] as const },
  { type: 'medicine', icon: 'package' as const, labelKey: 'needs.title', color: ['#7c2d12', '#f97316'] as const },
  { type: 'solar', icon: 'zap' as const, labelKey: 'nav.services', color: ['#581c87', '#c084fc'] as const },
];

export default function DiasporaScreen() {
  const { authFetch, syncUser, isSignedIn } = useAuthApi();
  const t = useT();
  const { locale } = useLocale();
  const [step, setStep] = useState(0);
  const [camps, setCamps] = useState<CampSummary[]>([]);
  const [selected, setSelected] = useState<string[]>(['food_basket']);
  const [submitting, setSubmitting] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [form, setForm] = useState({ recipient: '', campId: '', message: '', amount: '5000' });

  const steps = [
    t('diaspora.stepRecipient'),
    t('diaspora.stepProduct'),
    t('diaspora.stepConfirm'),
    t('common.success'),
  ];

  useEffect(() => {
    fetchWithMeta<CampSummary[]>('/camps', []).then((res) => {
      setCamps(res.data);
      setForm((f) => ({ ...f, campId: f.campId || res.data[0]?.id || '' }));
    });
  }, []);

  const toggleProduct = (type: string) => {
    setSelected((prev) => (prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type]));
  };

  const confirmOrder = async () => {
    if (!isSignedIn) {
      Alert.alert(t('nav.signIn'), t('transport.sessionError'));
      return;
    }
    setSubmitting(true);
    try {
      await syncUser();
      await authFetch('/diaspora/profile', {
        method: 'PUT',
        body: JSON.stringify({
          country: 'Diaspora',
          beneficiaryName: form.recipient,
          preferredCampId: form.campId,
        }),
      });
      const order = await authFetch<{ id: string }>('/diaspora/orders', {
        method: 'POST',
        body: JSON.stringify({
          orderType: selected.join(','),
          description: `${selected.map((type) => t(PRODUCT_KEYS.find((o) => o.type === type)?.labelKey ?? 'common.all')).join(', ')}. ${form.message}`,
          budget: Number(form.amount) || undefined,
          campId: form.campId,
        }),
      });
      setOrderRef(order.id.slice(0, 8).toUpperCase());
      setStep(3);
    } catch {
      Alert.alert(t('common.error'), t('marketplace.publishError'));
    } finally {
      setSubmitting(false);
    }
  };

  const campName = pickName(locale, camps.find((c) => c.id === form.campId) ?? { nameEs: '', nameAr: '' });

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#581c87', '#7c3aed', '#a855f7']} style={styles.hero}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.heroBadge}>{t('diaspora.title').toUpperCase()}</Text>
          <Text style={styles.heroTitle}>{t('diaspora.hero')}</Text>
          <Text style={styles.heroSub}>{t('diaspora.heroSub')}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.steps}>
          {steps.map((label, i) => (
            <Pressable
              key={label}
              style={[styles.stepChip, step === i && styles.stepChipActive, i < step && styles.stepChipDone]}
              onPress={() => i < step && setStep(i)}
            >
              <Text style={[styles.stepText, (step === i || i < step) && styles.stepTextActive]}>{i + 1}</Text>
            </Pressable>
          ))}
        </View>

        {step === 0 && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{t('diaspora.stepRecipient')}</Text>
            <Text style={styles.label}>{t('community.camp')}</Text>
            <TextInput
              style={styles.input}
              value={form.recipient}
              onChangeText={(recipient) => setForm({ ...form, recipient })}
              placeholder={t('diaspora.stepRecipient')}
              placeholderTextColor={theme.textDarkMuted}
            />
            <Text style={styles.label}>{t('community.camp')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
            <Pressable
              style={[styles.cta, (!form.recipient || !form.campId) && styles.ctaDisabled]}
              onPress={() => setStep(1)}
              disabled={!form.recipient || !form.campId}
            >
              <Text style={styles.ctaText}>{t('common.continue')}</Text>
            </Pressable>
          </View>
        )}

        {step === 1 && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{t('diaspora.stepProduct')}</Text>
            {PRODUCT_KEYS.map((opt) => {
              const active = selected.includes(opt.type);
              return (
                <Pressable key={opt.type} style={[styles.card, active && styles.cardSelected]} onPress={() => toggleProduct(opt.type)}>
                  <LinearGradient colors={[...opt.color]} style={styles.cardGradient}>
                    <AppIcon name={opt.icon} size={22} color="#fff" />
                    <Text style={styles.cardTitle}>{t(opt.labelKey)}</Text>
                    {active && <AppIcon name="check" size={18} color="#fff" />}
                  </LinearGradient>
                </Pressable>
              );
            })}
            <Pressable style={[styles.cta, selected.length === 0 && styles.ctaDisabled]} onPress={() => setStep(2)} disabled={selected.length === 0}>
              <Text style={styles.ctaText}>{t('common.continue')}</Text>
            </Pressable>
          </View>
        )}

        {step === 2 && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{t('diaspora.stepConfirm')}</Text>
            <Text style={styles.label}>{t('cash.cashPlaceholder')}</Text>
            <TextInput
              style={styles.input}
              value={form.amount}
              onChangeText={(amount) => setForm({ ...form, amount })}
              keyboardType="numeric"
              placeholderTextColor={theme.textDarkMuted}
            />
            <Text style={styles.label}>{t('community.postPlaceholder')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.message}
              onChangeText={(message) => setForm({ ...form, message })}
              multiline
              placeholderTextColor={theme.textDarkMuted}
            />
            <Pressable style={[styles.cta, submitting && styles.ctaDisabled]} onPress={confirmOrder} disabled={submitting}>
              {submitting ? <ActivityIndicator color={theme.text} /> : <Text style={styles.ctaText}>{t('diaspora.stepConfirm')}</Text>}
            </Pressable>
          </View>
        )}

        {step === 3 && (
          <View style={[styles.panel, styles.successPanel]}>
            <AppIcon name="shield" size={48} color={theme.emeraldDeep} />
            <Text style={styles.successTitle}>{t('common.success')}</Text>
            <Text style={styles.successSub}>
              {form.recipient} · {campName}
            </Text>
            <Text style={styles.ref}>{t('diaspora.success', { ref: `DIA-${orderRef}` })}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  content: { padding: 20, paddingBottom: 120 },
  hero: { paddingBottom: 28 },
  heroBadge: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 2, marginBottom: 12, paddingHorizontal: 20, paddingTop: 8 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: theme.text, lineHeight: 38, paddingHorizontal: 20 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 12, lineHeight: 20, paddingHorizontal: 20 },
  steps: { flexDirection: 'row', gap: 8, marginBottom: 20, marginTop: -12 },
  stepChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepChipActive: { backgroundColor: '#581c87', borderColor: '#581c87' },
  stepChipDone: { backgroundColor: theme.emeraldDeep, borderColor: theme.emeraldDeep },
  stepText: { fontWeight: '700', color: theme.textDarkMuted },
  stepTextActive: { color: theme.text },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  panelTitle: { fontSize: 18, fontWeight: '800', color: theme.textDark, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: theme.textDarkMuted, marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: theme.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 14,
    fontSize: 16,
    color: theme.textDark,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: theme.cream,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.12)' },
  chipText: { fontSize: 14, color: theme.textDarkMuted, fontWeight: '600' },
  chipTextActive: { color: '#581c87' },
  card: { borderRadius: 16, overflow: 'hidden', marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  cardSelected: { borderColor: theme.gold },
  cardGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: theme.text },
  cta: {
    backgroundColor: theme.emeraldDeep,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    minHeight: 52,
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: theme.text, fontSize: 16, fontWeight: '700' },
  successPanel: { alignItems: 'center', paddingVertical: 32 },
  successTitle: { fontSize: 22, fontWeight: '800', color: theme.emeraldDeep, marginTop: 16 },
  successSub: { fontSize: 15, color: theme.textDarkMuted, marginTop: 8, textAlign: 'center' },
  ref: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '700',
    color: theme.gold,
    marginTop: 16,
    backgroundColor: 'rgba(232,184,109,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
