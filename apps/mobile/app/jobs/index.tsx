import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { fetchWithMeta, mapApiJob, type JobItem, unwrapPaginated } from '@/lib/api';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';
import { AppIcon } from '@/components/AppIcon';

type FilterMode = 'all' | 'offer' | 'seeking';

export default function JobsScreen() {
  const router = useRouter();
  const t = useT();
  const { dir } = useLocale();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterMode>('all');
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 560,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const load = useCallback(async (soft = false) => {
    if (soft) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetchWithMeta('/jobs', {
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });
      if (res.fromFallback) setJobs([]);
      else setJobs(unwrapPaginated(res.data as never).map((j) => mapApiJob(j as Record<string, unknown>)));
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === 'all') return jobs;
    return jobs.filter((j) => j.jobType === filter);
  }, [jobs, filter]);

  const filters: { id: FilterMode; label: string }[] = [
    { id: 'all', label: t('common.all') },
    { id: 'offer', label: t('jobs.create.jobTypes.offer') },
    { id: 'seeking', label: t('jobs.create.jobTypes.seeking') },
  ];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#f7f1e4', theme.canvas, theme.canvas]}
        locations={[0, 0.28, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.orb} pointerEvents="none" />

      <SafeAreaView edges={['top']}>
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: enter,
              transform: [
                {
                  translateY: enter.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={styles.kicker}>{t('jobs.boardTitle')}</Text>
              <Text style={[styles.brandAr, dir === 'rtl' && styles.rtl]} accessibilityRole="header">
                العمل
              </Text>
              <Text style={[styles.title, dir === 'rtl' && styles.rtl]}>{t('jobs.title')}</Text>
              <View style={styles.rule} />
              <Text style={[styles.lead, dir === 'rtl' && styles.rtl]}>{t('jobs.heroSub')}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.publishBtn, pressed && styles.pressed]}
              onPress={() => router.push('/jobs/create')}
            >
              <AppIcon name="plus" size={15} color={theme.pearl} strokeWidth={2.5} />
              <Text style={styles.publishBtnText}>{t('jobs.create.title')}</Text>
            </Pressable>
          </View>

          <View style={styles.filterRow}>
            {filters.map((f) => {
              const on = filter === f.id;
              return (
                <Pressable key={f.id} style={styles.filterItem} onPress={() => setFilter(f.id)}>
                  <Text style={[styles.filterText, on && styles.filterTextOn]}>{f.label}</Text>
                  <View style={[styles.filterRule, on && styles.filterRuleOn]} />
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </SafeAreaView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, filtered.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={theme.dune}
            colors={[theme.dune]}
          />
        }
        ListHeaderComponent={
          !loading && filtered.length > 0 ? (
            <View style={styles.countRow}>
              <Text style={styles.countText}>
                {filtered.length} · {t('jobs.boardTitle')}
              </Text>
              <View style={styles.countRule} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={theme.dune} style={{ marginTop: 48 }} />
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyAr}>العمل</Text>
              <Text style={styles.emptyTitle}>{t('jobs.empty')}</Text>
              <Text style={styles.emptyBody}>{t('jobs.boardSubtitle')}</Text>
              <Pressable style={styles.emptyCta} onPress={() => router.push('/jobs/create')}>
                <Text style={styles.emptyCtaText}>{t('jobs.create.submit')}</Text>
                <AppIcon name="arrow-right" size={14} color={theme.dune} />
              </Pressable>
            </View>
          )
        }
        renderItem={({ item }) => {
          const seeking = item.jobType === 'seeking';
          return (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              onPress={() => router.push(`/jobs/${item.id}`)}
            >
              <View style={[styles.mark, seeking && styles.markSeek]}>
                <AppIcon
                  name={seeking ? 'search' : 'briefcase'}
                  size={16}
                  color={seeking ? theme.dune : theme.oasisDeep}
                />
              </View>
              <View style={styles.info}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {[item.type, item.campName].filter(Boolean).join(' · ')}
                </Text>
                <Text style={styles.rowSalary}>{item.salary || t('jobs.salaryHint')}</Text>
              </View>
              <AppIcon name="chevron-right" size={16} color={theme.inkSoft} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  orb: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(168,132,45,0.07)',
  },
  hero: { paddingHorizontal: space.lg, paddingTop: 6, paddingBottom: 4 },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroCopy: { flex: 1 },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: theme.dune,
  },
  brandAr: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: theme.ink,
    marginTop: 2,
    writingDirection: 'rtl',
    lineHeight: 44,
  },
  title: { fontFamily: fonts.bodyMed, fontSize: 15, color: theme.inkMuted, marginTop: -2 },
  rule: {
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.dune,
    marginTop: 10,
    marginBottom: 8,
  },
  lead: { fontFamily: fonts.body, fontSize: 14, color: theme.inkSoft, lineHeight: 20 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: theme.ink,
    marginTop: 8,
  },
  publishBtnText: { fontFamily: fonts.bodyBold, fontSize: 12, color: theme.pearl },
  pressed: { opacity: 0.9 },

  filterRow: { flexDirection: 'row', gap: 18, marginTop: 18, marginBottom: 4 },
  filterItem: { flexShrink: 0 },
  filterText: { fontFamily: fonts.bodyMed, fontSize: 13, color: theme.inkSoft },
  filterTextOn: { fontFamily: fonts.bodyBold, color: theme.ink },
  filterRule: { height: 2, marginTop: 7, borderRadius: 1, backgroundColor: 'transparent' },
  filterRuleOn: { backgroundColor: theme.dune },

  list: { paddingHorizontal: space.lg, paddingBottom: 120, paddingTop: 8 },
  listEmpty: { flexGrow: 1 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  countText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.dune,
  },
  countRule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.borderStrong },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  mark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(45,138,98,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markSeek: { backgroundColor: 'rgba(168,132,45,0.12)' },
  info: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: theme.ink,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  rowMeta: { fontFamily: fonts.body, fontSize: 12, color: theme.inkSoft, marginTop: 3 },
  rowSalary: {
    fontFamily: fonts.displaySemi,
    fontSize: 14,
    color: theme.ink,
    marginTop: 6,
  },

  emptyWrap: { alignItems: 'center', paddingVertical: 56, gap: 6 },
  emptyAr: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: 'rgba(168,132,45,0.28)',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: fonts.displaySemi,
    fontSize: 22,
    letterSpacing: -0.4,
    color: theme.ink,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: theme.inkMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 21,
    marginTop: 4,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 8,
  },
  emptyCtaText: { fontFamily: fonts.bodyBold, fontSize: 14, color: theme.dune },
});
