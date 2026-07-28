import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
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
import { demoListingsPage, fetchWithMeta, mapListingsResponse, ALLOW_DEMO_FALLBACK } from '@/lib/api';
import { getQueueCount } from '@/lib/offline';
import { getLegacyUser } from '@/lib/legacySession';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';

const HUB_RAIL: { href: string; icon: FeatherIconName; labelKey: string }[] = [
  { href: '/orders', icon: 'package', labelKey: 'me.modules.orders' },
  { href: '/marketplace/mine', icon: 'tag', labelKey: 'me.modules.sales' },
  { href: '/shops/mine', icon: 'shopping-bag', labelKey: 'me.modules.shops' },
  { href: '/transport/garage', icon: 'truck', labelKey: 'me.modules.driver' },
];

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

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(14)).current;

  const avatarInitials = useMemo(() => initialsFrom(name), [name]);
  const firstName = useMemo(() => {
    const raw = name.split(/\s+/)[0] ?? name;
    return raw.length > 14 ? `${raw.slice(0, 13)}…` : raw;
  }, [name]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 520, useNativeDriver: true }),
    ]).start();
  }, [fade, rise]);

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
      if (res.fromFallback && !ALLOW_DEMO_FALLBACK) {
        setListings([]);
        return;
      }
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
      <LinearGradient
        colors={['#f7f2e8', theme.canvas, '#f3efe6']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <SafeAreaView edges={['top']}>
          <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>
            <View style={styles.topBar}>
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>{t('common.live')}</Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable style={styles.iconBtn} onPress={() => router.push('/notifications')} hitSlop={6}>
                  <AppIcon name="bell" size={18} color={theme.ink} />
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => router.push('/messages')} hitSlop={6}>
                  <AppIcon name="message-circle" size={18} color={theme.ink} />
                </Pressable>
                <Pressable style={styles.avatar} onPress={() => router.push('/profile')}>
                  <Text style={styles.avatarText}>{avatarInitials || 'ⵣ'}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.hero}>
              <Text style={styles.brand} accessibilityRole="header">
                Lefrig
              </Text>
              <View style={styles.brandRule} />
              <Text style={[styles.headline, dir === 'rtl' && styles.rtl]} numberOfLines={1}>
                {greeting}, {firstName}
              </Text>
              <Text style={[styles.lead, dir === 'rtl' && styles.rtl]}>{t('home.taglineShort')}</Text>
            </View>

            <HomeSearchBar
              value={search}
              onChangeText={setSearch}
              onSubmit={submitSearch}
              onPress={() => router.push('/marketplace')}
            />

            {offlineCount > 0 ? (
              <View style={styles.offlineBadge}>
                <AppIcon name="cloud-off" size={14} color={theme.dune} />
                <Text style={styles.offlineText}>{t('home.offlineQueue', { count: offlineCount })}</Text>
              </View>
            ) : null}
          </Animated.View>
        </SafeAreaView>

        <View style={styles.body}>
          <HomeAtlas
            onDeptPress={(id) => router.push(`/atlas/${id}`)}
            onSeeAll={() => router.push('/marketplace')}
          />

          {/* Rail de cuenta — fuera del hero, sin pills */}
          <View style={styles.rail}>
            {HUB_RAIL.map((item) => (
              <Pressable
                key={item.href}
                style={({ pressed }) => [styles.railItem, pressed && styles.railPressed]}
                onPress={() => router.push(item.href as never)}
              >
                <View style={styles.railIcon}>
                  <AppIcon name={item.icon} size={18} color={theme.dune} />
                </View>
                <Text style={styles.railLabel} numberOfLines={1}>
                  {t(item.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>

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

          <View style={styles.spacer} />
          <HomeCommunityBanner onCommunity={() => router.push('/community')} />

          <Text style={styles.footer}>{t('home.footer')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  scroll: { paddingBottom: 120 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: 4,
    marginBottom: 8,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.oasis },
  liveText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: theme.oasisDeep,
    letterSpacing: 0.4,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.oasisDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 13, color: theme.pearl },
  hero: {
    paddingHorizontal: space.lg,
    paddingTop: 4,
    paddingBottom: 6,
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: 46,
    lineHeight: 50,
    letterSpacing: -1.4,
    color: theme.ink,
  },
  brandRule: {
    width: 36,
    height: 2,
    backgroundColor: theme.dune,
    marginTop: 12,
    marginBottom: 2,
    borderRadius: 1,
  },
  headline: {
    marginTop: 12,
    fontFamily: fonts.bodyMed,
    fontSize: 17,
    lineHeight: 24,
    color: theme.inkMuted,
  },
  lead: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: theme.dune,
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: space.lg,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: theme.warningSoft,
  },
  offlineText: { fontFamily: fonts.bodySemi, fontSize: 12, color: theme.dune },
  body: { paddingHorizontal: space.lg, paddingTop: 18 },
  rail: {
    flexDirection: 'row',
    marginTop: 6,
    marginBottom: 22,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  railItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  railPressed: { opacity: 0.7 },
  railIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(168,132,45,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  railLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: theme.inkMuted,
    textAlign: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 28, paddingLeft: 8 },
  seeAll: { fontFamily: fonts.bodyBold, fontSize: 13, color: theme.dune },
  spacer: { height: 10 },
  footer: {
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 12,
    color: theme.inkSoft,
    marginTop: 28,
    marginBottom: 8,
  },
});
