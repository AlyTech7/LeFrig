import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { ListingSummary } from '@lefrig/shared';
import { buildGlobalSearchHref } from '@lefrig/shared';
import { HomeSearchBar } from '@/components/home/HomeSearchBar';
import { SectionHeader } from '@/components/SectionHeader';
import { HomeAtlas } from '@/components/home/HomeAtlas';
import { HomeFeaturedListings } from '@/components/home/HomeFeaturedListings';
import { HomeCommunityBanner } from '@/components/home/HomeCommunityBanner';
import { AppIcon, type FeatherIconName } from '@/components/AppIcon';
import { useUser } from '@clerk/clerk-expo';
import { useAuthApi } from '@/lib/useAuthApi';
import { demoListingsPage, fetchWithMeta, mapListingsResponse } from '@/lib/api';
import { getQueueCount } from '@/lib/offline';
import { getLegacyUser } from '@/lib/legacySession';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii, TRUST_PILLS, QUICK_LINKS } from '@/lib/theme';

const TRUST_ICONS: FeatherIconName[] = ['dollar-sign', 'book-open', 'tag', 'users'];

function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const userId = user?.id;
  const clerkFirstName = user?.firstName;
  const { syncUser } = useAuthApi();
  const { dir } = useLocale();
  const t = useT();
  const [greeting, setGreeting] = useState('');
  const [name, setName] = useState('');
  const [offlineCount, setOfflineCount] = useState(0);
  const [search, setSearch] = useState('');
  const [listings, setListings] = useState<ListingSummary[]>([]);

  const avatarInitials = useMemo(() => initialsFrom(name), [name]);
  const firstName = useMemo(() => name.split(/\s+/)[0] ?? name, [name]);

  useEffect(() => {
    syncUser()
      .then((res) => {
        if (res?.user && typeof res.user === 'object' && 'displayName' in res.user) {
          const u = res.user as { displayName: string };
          setName(u.displayName);
        }
      })
      .catch(() => undefined);

    getLegacyUser().then((legacy) => {
      if (legacy?.phone) {
        setName((prev) =>
          !prev || prev === t('home.guest')
            ? t('home.guestUser', { suffix: legacy.phone!.slice(-4) })
            : prev,
        );
      }
    });

    if (clerkFirstName) setName(clerkFirstName);

    getQueueCount().then(setOfflineCount);
    const h = new Date().getHours();
    setGreeting(
      h < 12 ? t('home.greetingMorning') : h < 18 ? t('home.greetingAfternoon') : t('home.greetingEvening'),
    );
  }, [syncUser, userId, clerkFirstName, t]);

  useEffect(() => {
    if (!name) setName(t('home.guest'));
  }, [name, t]);

  useEffect(() => {
    fetchWithMeta('/listings?limit=6', demoListingsPage).then((res) => {
      const page = res.fromFallback ? demoListingsPage : mapListingsResponse(res.data as never);
      setListings(page.data.slice(0, 5));
    });
  }, []);

  const submitSearch = () => {
    const trimmed = search.trim();
    if (trimmed) {
      router.push(buildGlobalSearchHref('all', trimmed) as never);
    } else {
      router.push('/marketplace');
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        stickyHeaderIndices={[0]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Cabecera ── */}
        <View style={styles.headerSticky}>
          <LinearGradient colors={[theme.canvas, theme.canvasSoft, theme.canvas]} style={styles.headerBg}>
            <SafeAreaView edges={['top']}>
              <View style={styles.headerTop}>
                <View style={styles.brandBlock}>
                  <View style={styles.brandRow}>
                    <LinearGradient colors={[theme.duneBright, theme.dune]} style={styles.brandMark}>
                      <Text style={styles.brandGlyph}>ⵣ</Text>
                    </LinearGradient>
                    <View>
                      <View style={styles.brandTitleRow}>
                        <Text style={styles.brandName}>LEFRIG</Text>
                        <View style={styles.livePill}>
                          <View style={styles.liveDot} />
                          <Text style={styles.liveText}>{t('common.live')}</Text>
                        </View>
                      </View>
                      <Text style={styles.greeting}>
                        {greeting}, <Text style={styles.greetingName}>{firstName}</Text>
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.tagline, dir === 'rtl' && styles.rtl]}>{t('home.taglineShort')}</Text>
                </View>

                <View style={styles.headerActions}>
                  <Pressable style={styles.iconBtn} onPress={() => router.push('/notifications')}>
                    <AppIcon name="bell" size={18} color={theme.ink} />
                    <View style={styles.notifDot} />
                  </Pressable>
                  <Pressable style={styles.iconBtn} onPress={() => router.push('/messages')}>
                    <AppIcon name="message-circle" size={18} color={theme.ink} />
                  </Pressable>
                  <Pressable style={styles.avatar} onPress={() => router.push('/profile')}>
                    <LinearGradient colors={[theme.oasisDeep, theme.oasis]} style={styles.avatarGradient}>
                      <Text style={styles.avatarText}>{avatarInitials}</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>

              <HomeSearchBar
                value={search}
                onChangeText={setSearch}
                onSubmit={submitSearch}
                onPress={() => router.push('/marketplace')}
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trustRow}>
                {TRUST_PILLS.map((pill, i) => (
                  <View key={pill.labelKey} style={styles.trustPill}>
                    <AppIcon name={TRUST_ICONS[i] ?? 'shield'} size={12} color={theme.oasisDeep} />
                    <Text style={[styles.trustText, dir === 'rtl' && styles.rtl]}>{t(pill.labelKey)}</Text>
                  </View>
                ))}
              </ScrollView>

              {offlineCount > 0 ? (
                <View style={styles.offlineBadge}>
                  <AppIcon name="cloud-off" size={14} color={theme.dune} />
                  <Text style={styles.offlineText}>{t('home.offlineQueue', { count: offlineCount })}</Text>
                </View>
              ) : null}
            </SafeAreaView>
          </LinearGradient>
        </View>

        <View style={styles.body}>
          <HomeAtlas
            onDeptPress={(id) => router.push(`/atlas/${id}`)}
            onSeeAll={() => router.push('/marketplace')}
          />

          {/* ── Listados ── */}
          <View style={styles.sectionRow}>
            <SectionHeader eyebrow={t('home.recentEyebrow')} title={t('home.recent')} />
            <Pressable style={styles.seeAllBtn} onPress={() => router.push('/marketplace')}>
              <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
              <AppIcon name="arrow-right" size={14} color={theme.dune} />
            </Pressable>
          </View>
          <HomeFeaturedListings
            listings={listings}
            onPress={(id) => router.push(`/marketplace/${id}`)}
            onSeeAll={() => router.push('/marketplace')}
          />

          {/* ── Comunidad ── */}
          <View style={styles.spacer} />
          <HomeCommunityBanner
            onDiaspora={() => router.push('/diaspora')}
            onCommunity={() => router.push('/community')}
          />

          {/* ── Acceso rápido ── */}
          <SectionHeader
            eyebrow={t('home.yourSpaceEyebrow')}
            title={t('home.yourSpace')}
            subtitle={t('home.yourSpaceSub')}
          />
          <View style={styles.quickGrid}>
            {QUICK_LINKS.map((item) => (
              <Pressable
                key={item.href}
                style={({ pressed }) => [styles.quickCard, pressed && styles.quickPressed]}
                onPress={() => router.push(item.href as never)}
              >
                <View style={styles.quickIconWrap}>
                  <AppIcon name={item.icon} size={19} color={theme.oasisDeep} />
                </View>
                <Text style={styles.quickLabel}>{t(item.labelKey)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.footer}>{t('home.footer')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  scroll: { paddingBottom: 112 },
  headerSticky: { zIndex: 10 },
  headerBg: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  brandBlock: { flex: 1, paddingRight: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.dune,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  brandGlyph: { fontSize: 18, color: theme.pearl, fontWeight: '800' },
  brandTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 11, fontWeight: '900', color: theme.dune, letterSpacing: 3.5 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(45,138,98,0.1)',
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.oasis },
  liveText: { fontSize: 9, fontWeight: '800', color: theme.oasisDeep, letterSpacing: 0.3 },
  greeting: { fontSize: 13.5, color: theme.inkMuted, fontWeight: '600', marginTop: 3 },
  greetingName: { color: theme.ink, fontWeight: '800' },
  tagline: {
    fontSize: 12,
    color: theme.dune,
    fontWeight: '700',
    marginTop: 8,
    marginLeft: 56,
    opacity: 0.9,
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.flare,
    borderWidth: 1.5,
    borderColor: theme.surface,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(45,138,98,0.35)',
  },
  avatarGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '800', color: theme.pearl },
  trustRow: { paddingHorizontal: 20, paddingTop: 12, gap: 8, paddingBottom: 2 },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  trustText: { fontSize: 10, fontWeight: '700', color: theme.dune },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: 'rgba(168,132,45,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(168,132,45,0.22)',
  },
  offlineText: { fontSize: 12, color: theme.dune, fontWeight: '600' },
  body: { paddingHorizontal: 20, paddingTop: 22 },
  atlasIntro: {
    marginTop: 28,
    marginBottom: 16,
    paddingBottom: 4,
  },
  atlasIntroTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: theme.ink,
    letterSpacing: -1,
    lineHeight: 42,
  },
  atlasIntroEs: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.dune,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  atlasIntroSub: { fontSize: 13.5, color: theme.inkMuted, marginTop: 4, fontWeight: '500' },
  trendingHead: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 },
  hotBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.flare,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginLeft: -4,
  },
  trendingRow: { paddingRight: 8, marginBottom: 4 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, paddingLeft: 8 },
  seeAll: { fontSize: 13, fontWeight: '800', color: theme.dune },
  spacer: { height: 8 },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  quickCard: {
    width: '31%',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: radii.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 2,
  },
  quickPressed: { opacity: 0.92, transform: [{ scale: 0.97 }] },
  quickIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(45,138,98,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 11.5, fontWeight: '700', color: theme.ink, textAlign: 'center' },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.inkSoft,
    marginTop: 20,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
