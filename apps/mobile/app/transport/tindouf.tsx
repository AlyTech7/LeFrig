import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchWithMeta } from '@/lib/api';
import { useT } from '@/lib/locale';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, gradients } from '@/lib/theme';
import { AppIcon } from '@/components/AppIcon';
import type { CampSummary } from '@lefrig/shared';

const CATEGORY_KEYS = [
  'marketplaceExtra.categories',
  'needs.title',
  'nav.marketplace',
  'diaspora.products.voucher',
  'common.all',
] as const;

export default function TindoufScreen() {
  const t = useT();
  const { authFetch } = useAuthApi();
  const [camps, setCamps] = useState<CampSummary[]>([]);
  const [selected, setSelected] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWithMeta<CampSummary[]>('/camps', []).then((res) => setCamps(res.data));
  }, []);

  const submit = async () => {
    setSubmitting(true);
    try {
      const tindouf = camps.find((c) => c.slug === 'tindouf') ?? camps[0];
      const dest = camps.find((c) => c.slug === 'rabouni') ?? camps[1] ?? camps[0];
      if (!tindouf?.id || !dest?.id) throw new Error('no camps');

      await authFetch('/transport', {
        method: 'POST',
        body: JSON.stringify({
          type: 'tindouf_import',
          originCampId: tindouf.id,
          destinationCampId: dest.id,
          description: `${t('transport.tindoufTitle')} — ${t(CATEGORY_KEYS[selected])}`,
          paymentMethod: 'cash',
        }),
      });
      Alert.alert(t('common.success'), t('transport.requestSent'));
    } catch {
      Alert.alert(t('common.error'), t('report.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#92400e', '#b45309', '#e8b86d']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.heroTitle}>{t('transport.tindoufTitle')}</Text>
          <Text style={styles.heroSub}>{t('transport.tindoufSub')}</Text>
        </SafeAreaView>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.content}>
        {CATEGORY_KEYS.map((key, i) => (
          <Pressable
            key={key}
            style={[styles.option, selected === i && styles.optionSelected]}
            onPress={() => setSelected(i)}
          >
            <Text style={styles.optionText}>{t(key)}</Text>
            {selected === i && <AppIcon name="chevron-right" size={16} color={theme.gold} />}
          </Pressable>
        ))}
        <Pressable style={styles.cta} onPress={submit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={theme.obsidian} />
          ) : (
            <Text style={styles.ctaText}>{t('transport.tindoufCta')}</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  header: { paddingBottom: 16 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: theme.text, paddingHorizontal: 20, paddingTop: 8 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', paddingHorizontal: 20, marginTop: 4 },
  content: { padding: 24, paddingBottom: 100 },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 10,
  },
  optionSelected: { borderColor: theme.gold, backgroundColor: 'rgba(232,184,109,0.08)' },
  optionText: { fontSize: 16, fontWeight: '600', color: theme.textDark },
  cta: {
    backgroundColor: theme.gold,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    minHeight: 56,
    justifyContent: 'center',
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: theme.obsidian },
});
