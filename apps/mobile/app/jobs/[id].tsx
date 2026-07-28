import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchApi, mapApiJob, type JobItem } from '@/lib/api';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';
import { AppIcon } from '@/components/AppIcon';
import { useLocale, useT } from '@/lib/locale';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { dir } = useLocale();
  const [job, setJob] = useState<JobItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    fetchApi<Record<string, unknown>>(`/jobs/${id}`)
      .then((data) => {
        setJob('campName' in data ? (data as unknown as JobItem) : mapApiJob(data));
        Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }).start();
      })
      .catch(() => {
        setJob(null);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [fade, id]);

  if (loading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={theme.dune} size="large" />
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.errorHeader}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <AppIcon name="arrow-left" size={18} color={theme.dune} />
            <Text style={styles.backText}>{t('jobs.title')}</Text>
          </Pressable>
        </SafeAreaView>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>{t('common.error')}</Text>
          <Pressable style={styles.emptyCta} onPress={() => router.back()}>
            <Text style={styles.emptyCtaText}>{t('common.back')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const seeking = job.jobType === 'seeking';
  const meta = [job.type, job.campName].filter(Boolean).join(' · ');

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.topBar}>
          <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
            <AppIcon name="arrow-left" size={18} color={theme.dune} />
            <Text style={styles.backText}>{t('jobs.title')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fade }}>
          <Text style={styles.kicker}>{t('jobs.boardTitle')}</Text>
          <Text style={[styles.title, dir === 'rtl' && styles.rtl]}>{job.title}</Text>
          <View style={styles.rule} />

          <Text style={styles.salary}>{job.salary || t('jobs.salaryHint')}</Text>
          <Text style={styles.meta}>{meta}</Text>

          <View style={styles.typeRow}>
            <View style={[styles.typeMark, seeking && styles.typeMarkSeek]}>
              <AppIcon
                name={seeking ? 'search' : 'briefcase'}
                size={14}
                color={seeking ? theme.dune : theme.oasisDeep}
              />
            </View>
            <Text style={styles.typeText}>
              {seeking ? t('jobs.create.jobTypes.seeking') : t('jobs.create.jobTypes.offer')}
            </Text>
          </View>

          <Text style={styles.sectionLabel}>{t('jobs.create.description')}</Text>
          <Text style={[styles.desc, dir === 'rtl' && styles.rtl]}>
            {job.description?.trim() || t('jobs.noDescription')}
          </Text>

          {job.posterName ? (
            <View style={styles.posterRow}>
              <View style={styles.posterAvatar}>
                <Text style={styles.posterInitial}>
                  {job.posterName.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.posterLabel}>{t('jobs.postedBy')}</Text>
                <Text style={styles.posterName}>{job.posterName}</Text>
              </View>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      {job.contactPhone ? (
        <SafeAreaView edges={['bottom']} style={styles.ctaBar}>
          <Pressable
            style={styles.cta}
            onPress={() => Linking.openURL(`tel:${job.contactPhone}`)}
          >
            <AppIcon name="phone" size={18} color={theme.pearl} />
            <Text style={styles.ctaText}>{job.contactPhone}</Text>
          </Pressable>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.canvas },
  errorHeader: { paddingHorizontal: space.lg, paddingTop: 8 },
  topBar: { paddingHorizontal: space.lg, paddingBottom: 4 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontFamily: fonts.bodyBold, fontSize: 13, color: theme.dune },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },

  content: { paddingHorizontal: space.lg, paddingTop: 8, paddingBottom: 120 },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.dune,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    letterSpacing: -0.7,
    color: theme.ink,
    lineHeight: 36,
  },
  rule: {
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.dune,
    marginTop: 14,
    marginBottom: 16,
  },
  salary: {
    fontFamily: fonts.displaySemi,
    fontSize: 22,
    color: theme.ink,
    marginBottom: 6,
  },
  meta: { fontFamily: fonts.body, fontSize: 13, color: theme.inkSoft, marginBottom: 16 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  typeMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(45,138,98,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeMarkSeek: { backgroundColor: 'rgba(168,132,45,0.12)' },
  typeText: { fontFamily: fonts.bodyBold, fontSize: 13, color: theme.ink },

  sectionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.dune,
    marginBottom: 10,
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 26,
    color: theme.inkMuted,
    marginBottom: 28,
  },

  posterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  posterAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168,132,45,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterInitial: { fontFamily: fonts.displaySemi, fontSize: 16, color: theme.dune },
  posterLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.inkSoft,
  },
  posterName: { fontFamily: fonts.bodyBold, fontSize: 15, color: theme.ink, marginTop: 2 },

  emptyWrap: { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: theme.ink },
  emptyCta: { paddingVertical: 8 },
  emptyCtaText: { fontFamily: fonts.bodyBold, fontSize: 14, color: theme.dune },

  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.lg,
    paddingTop: 12,
    backgroundColor: 'rgba(250,248,244,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.ink,
    borderRadius: radii.md,
    paddingVertical: 15,
    minHeight: 52,
    marginBottom: 8,
  },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 15, color: theme.pearl },
});
