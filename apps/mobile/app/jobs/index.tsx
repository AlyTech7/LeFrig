import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { fetchWithMeta, mapApiJob, type JobItem, unwrapPaginated } from '@/lib/api';
import { useLocale, useT } from '@/lib/locale';
import { theme, gradients } from '@/lib/theme';
import { AppIcon } from '@/components/AppIcon';

const fallbackJobs: JobItem[] = [
  {
    id: '1',
    title: 'Mecánico',
    salary: '45.000 MRU',
    type: 'Oferta de trabajo',
    jobType: 'offer',
    category: 'skilled',
    campName: 'Smara',
  },
  {
    id: '2',
    title: 'Profesor árabe',
    salary: '38.000 MRU',
    type: 'Oferta de trabajo',
    jobType: 'offer',
    category: 'professional',
    campName: 'Rabouni',
  },
  {
    id: '3',
    title: 'Conductor transporte',
    salary: 'Por viaje',
    type: 'Busca empleo',
    jobType: 'seeking',
    category: 'daily',
    campName: 'Tindouf',
  },
];

export default function JobsScreen() {
  const router = useRouter();
  const t = useT();
  const { dir } = useLocale();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithMeta('/jobs', { data: fallbackJobs, meta: { total: 3, page: 1, limit: 20, totalPages: 1 } }).then(
      (res) => {
        const raw = unwrapPaginated(res.data as never);
        setJobs(res.fromFallback ? fallbackJobs : raw.map((j) => mapApiJob(j as Record<string, unknown>)));
        setLoading(false);
      },
    );
  }, []);

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.jobs]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={[styles.heroTitle, dir === 'rtl' && styles.rtl]}>{t('jobs.title')}</Text>
          <Text style={[styles.heroSub, dir === 'rtl' && styles.rtl]}>{t('jobs.heroSub')}</Text>
        </SafeAreaView>
      </LinearGradient>

      <Pressable style={styles.fab} onPress={() => router.push('/jobs/create')}>
        <AppIcon name="plus" size={22} color={theme.obsidian} strokeWidth={2.5} />
      </Pressable>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={theme.gold} style={{ marginTop: 40 }} />
          ) : (
            <Text style={styles.empty}>{t('jobs.empty')}</Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/jobs/${item.id}`)}>
            <View style={styles.iconWrap}>
              <AppIcon name="briefcase" size={22} color={theme.emeraldDeep} />
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.salary}>{item.salary}</Text>
              <Text style={styles.meta}>
                {item.type} · {item.campName}
              </Text>
            </View>
            <AppIcon name="chevron-right" size={18} color={theme.textDarkMuted} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  header: { paddingBottom: 20 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: theme.text, paddingHorizontal: 20, paddingTop: 8 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', paddingHorizontal: 20, marginTop: 4 },
  list: { padding: 16, paddingBottom: 100 },
  empty: { textAlign: 'center', color: theme.textDarkMuted, marginTop: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 10,
    backgroundColor: '#fff',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(13,148,136,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: theme.textDark },
  salary: { fontSize: 15, color: theme.emeraldDeep, fontWeight: '600', marginTop: 4 },
  meta: { fontSize: 13, color: theme.textDarkMuted, marginTop: 2 },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.gold,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: theme.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
