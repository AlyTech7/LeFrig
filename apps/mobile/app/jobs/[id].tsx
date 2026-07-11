import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchWithMeta, mapApiJob, type JobItem } from '@/lib/api';
import { theme, gradients } from '@/lib/theme';
import { AppIcon } from '@/components/AppIcon';
import { useT } from '@/lib/locale';

const CATEGORY_KEYS: Record<string, string> = {
  skilled: 'jobs.categories.construction',
  daily: 'jobs.categories.general',
  professional: 'jobs.categories.education',
  other: 'jobs.categories.other',
};

const fallback: JobItem = {
  id: 'demo',
  title: 'Técnico solar',
  salary: '8.000 MRU',
  type: 'Oferta de trabajo',
  jobType: 'offer',
  category: 'skilled',
  campName: 'Tindouf',
  description: 'Instalación de paneles en viviendas del campamento.',
  posterName: 'ONG Saharaui',
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const [job, setJob] = useState<JobItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchWithMeta<Record<string, unknown>>(`/jobs/${id}`, fallback as unknown as Record<string, unknown>).then(
      (res) => {
        const mapped =
          res.fromFallback
            ? fallback
            : 'campName' in res.data
              ? (res.data as unknown as JobItem)
              : mapApiJob(res.data);
        setJob(mapped);
        setLoading(false);
      },
    );
  }, [id]);

  if (loading || !job) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={theme.gold} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.hero]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <AppIcon name="arrow-left" size={20} color={theme.text} />
            <Text style={styles.backText}>{t('jobs.title')}</Text>
          </Pressable>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.salary}>{job.salary}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{job.type}</Text>
          </View>
          <View style={[styles.badge, styles.badgeMuted]}>
            <Text style={styles.badgeTextMuted}>{job.campName}</Text>
          </View>
          {job.category ? (
            <View style={[styles.badge, styles.badgeMuted]}>
              <Text style={styles.badgeTextMuted}>{CATEGORY_KEYS[job.category] ? t(CATEGORY_KEYS[job.category]) : job.category}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.desc}>{job.description ?? t('jobs.noDescription')}</Text>

        {job.posterName ? (
          <Text style={styles.meta}>{t('jobs.postedBy')} {job.posterName}</Text>
        ) : null}

        {job.contactPhone ? (
          <Pressable style={styles.phoneBtn} onPress={() => Linking.openURL(`tel:${job.contactPhone}`)}>
            <AppIcon name="phone" size={18} color={theme.gold} />
            <Text style={styles.phoneText}>{job.contactPhone}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  safe: { flex: 1, backgroundColor: theme.cream },
  header: { paddingBottom: 28 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 8 },
  backText: { color: theme.text, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: theme.text, paddingHorizontal: 20, marginTop: 12 },
  salary: { fontSize: 20, fontWeight: '700', color: theme.gold, paddingHorizontal: 20, marginTop: 6 },
  content: { padding: 20 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  badge: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeMuted: { backgroundColor: 'rgba(0,0,0,0.04)' },
  badgeText: { color: theme.emeraldDeep, fontWeight: '600', fontSize: 13 },
  badgeTextMuted: { color: theme.textDarkMuted, fontWeight: '600', fontSize: 13 },
  desc: { fontSize: 16, lineHeight: 24, color: theme.textDarkMuted },
  meta: { fontSize: 15, color: theme.textDarkMuted, marginTop: 20 },
  phoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: theme.obsidian,
  },
  phoneText: { color: theme.gold, fontWeight: '700', fontSize: 16 },
});
