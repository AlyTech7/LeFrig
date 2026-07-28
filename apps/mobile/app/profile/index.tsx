import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon, type FeatherIconName } from '@/components/AppIcon';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';
import { clearLegacySession, getLegacyUser, type LegacyUser } from '@/lib/legacySession';
import { useAuthApi } from '@/lib/useAuthApi';

type HubPayload = {
  driverStatus: 'none' | 'basic' | 'pending' | 'verified' | 'rejected';
  stats: {
    listingsActive: number;
    ordersAsBuyer: number;
    shops: number;
    transportOpen: number;
    unreadNotifications: number;
  };
  user: {
    displayName: string;
    reputationScore: number;
    avatarUrl?: string | null;
    camp: { nameEs: string } | null;
  };
};

type LinkItem = {
  route: string;
  icon: FeatherIconName;
  titleKey: string;
  sub: string;
  badge?: string | number;
  tone?: 'default' | 'oasis' | 'flare';
};

const EMPTY_STATS: HubPayload['stats'] = {
  listingsActive: 0,
  ordersAsBuyer: 0,
  shops: 0,
  transportOpen: 0,
  unreadNotifications: 0,
};

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LinkRow({
  item,
  onPress,
  last,
}: {
  item: LinkItem;
  onPress: () => void;
  last?: boolean;
}) {
  const t = useT();
  const iconColor =
    item.tone === 'oasis' ? theme.oasisDeep : item.tone === 'flare' ? theme.flare : theme.dune;

  return (
    <Pressable
      style={({ pressed }) => [styles.linkRow, last && styles.linkRowLast, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t(item.titleKey)}
    >
      <View style={[styles.linkIcon, item.tone === 'oasis' && styles.linkIconOasis]}>
        <AppIcon name={item.icon} size={17} color={iconColor} />
      </View>
      <View style={styles.linkCopy}>
        <Text style={styles.linkTitle}>{t(item.titleKey)}</Text>
        <Text style={styles.linkSub} numberOfLines={1}>
          {item.sub}
        </Text>
      </View>
      {item.badge != null && item.badge !== 0 && item.badge !== '' ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      ) : null}
      <AppIcon name="chevron-right" size={16} color={theme.inkSoft} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { authFetch, syncUser, isSignedIn } = useAuthApi();
  const router = useRouter();
  const t = useT();
  const { dir } = useLocale();
  const [legacyUser, setLegacyUser] = useState<LegacyUser | null>(null);
  const [hub, setHub] = useState<HubPayload | null>(null);
  const [hubLoading, setHubLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const loadHub = useCallback(async () => {
    if (!isSignedIn) {
      setHub(null);
      setLoadError(false);
      return;
    }
    setHubLoading(true);
    setLoadError(false);
    try {
      await syncUser().catch(() => null);
      const data = await authFetch<HubPayload>('/users/me/hub');
      setHub(data);
    } catch {
      setHub(null);
      setLoadError(true);
    } finally {
      setHubLoading(false);
    }
  }, [authFetch, isSignedIn, syncUser]);

  useEffect(() => {
    getLegacyUser().then(setLegacyUser);
  }, [isSignedIn]);

  useEffect(() => {
    void loadHub();
  }, [loadHub]);

  const displayName =
    hub?.user.displayName ??
    user?.fullName ??
    user?.firstName ??
    (legacyUser?.phone ? t('home.guestUser', { suffix: legacyUser.phone.slice(-4) }) : t('profile.guest'));
  const email = user?.primaryEmailAddress?.emailAddress;
  const phone = user?.primaryPhoneNumber?.phoneNumber ?? legacyUser?.phone ?? undefined;
  const authed = isSignedIn || !!legacyUser;
  const driverStatus = hub?.driverStatus ?? 'none';
  const stats = hub?.stats ?? EMPTY_STATS;
  const avatarUri = hub?.user.avatarUrl || user?.imageUrl || undefined;
  const initial = (displayName[0] ?? 'ⵣ').toUpperCase();
  const rep = hub ? Math.round(hub.user.reputationScore) : null;

  const driverSub =
    driverStatus === 'verified'
      ? t('me.modules.driverSubVerified')
      : driverStatus === 'pending'
        ? t('me.modules.driverSubPending')
        : driverStatus === 'basic'
          ? t('me.modules.driverSubBasic')
          : driverStatus === 'rejected'
            ? t('me.modules.driverSubRejected')
            : t('me.modules.driverSubNone');

  const activityLinks: LinkItem[] = useMemo(
    () => [
      {
        route: '/orders',
        icon: 'package',
        titleKey: 'me.modules.orders',
        sub: t('me.modules.ordersSub'),
        badge: stats.ordersAsBuyer || undefined,
      },
      {
        route: '/marketplace/mine',
        icon: 'tag',
        titleKey: 'me.modules.sales',
        sub: t('me.modules.salesSub'),
        badge: stats.listingsActive || undefined,
      },
      {
        route: '/shops/mine',
        icon: 'shopping-bag',
        titleKey: 'me.modules.shops',
        sub: t('me.modules.shopsSub'),
        badge: stats.shops || undefined,
      },
      {
        route: '/transport',
        icon: 'truck',
        titleKey: 'me.modules.transport',
        sub: t('me.modules.transportSub'),
        badge: stats.transportOpen || undefined,
      },
    ],
    [stats, t],
  );

  const communityLinks: LinkItem[] = useMemo(
    () => [
      {
        route: '/messages',
        icon: 'message-circle',
        titleKey: 'me.modules.messages',
        sub: t('me.modules.messagesSub'),
      },
      {
        route: '/notifications',
        icon: 'bell',
        titleKey: 'me.modules.notifications',
        sub:
          stats.unreadNotifications > 0
            ? t('me.modules.notificationsSub', { count: stats.unreadNotifications })
            : t('me.modules.notificationsNone'),
        badge: stats.unreadNotifications || undefined,
        tone: stats.unreadNotifications > 0 ? 'flare' : 'default',
      },
      {
        route: '/favorites',
        icon: 'heart',
        titleKey: 'me.modules.favorites',
        sub: t('me.modules.favoritesSub'),
      },
      {
        route: '/cash',
        icon: 'dollar-sign',
        titleKey: 'me.modules.cash',
        sub: t('me.modules.cashSub'),
      },
    ],
    [stats.unreadNotifications, t],
  );

  const heroMotion = {
    opacity: enter,
    transform: [
      {
        translateY: enter.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#f7f1e4', theme.canvas, theme.canvas]}
        locations={[0, 0.32, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.orbA} pointerEvents="none" />
      <View style={styles.orbB} pointerEvents="none" />

      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={heroMotion}>
            <Text style={styles.kicker}>Lefrig</Text>
            <Text style={[styles.brandAr, dir === 'rtl' && styles.rtl]} accessibilityRole="header">
              حسابي
            </Text>
            <Text style={[styles.title, dir === 'rtl' && styles.rtl]}>{t('me.title')}</Text>
            <View style={styles.rule} />
            <Text style={[styles.lead, dir === 'rtl' && styles.rtl]}>{t('me.subtitle')}</Text>
          </Animated.View>

          {!authed ? (
            <View style={styles.guest}>
              <Text style={styles.guestBody}>{t('me.signInPrompt')}</Text>
              <Pressable style={styles.primaryCta} onPress={() => router.replace('/sign-in')}>
                <Text style={styles.primaryCtaText}>{t('nav.signIn')}</Text>
              </Pressable>
              <Pressable style={styles.ghostCta} onPress={() => router.replace('/sign-up')}>
                <Text style={styles.ghostCtaText}>{t('profile.createAccount')}</Text>
              </Pressable>
            </View>
          ) : hubLoading && !hub ? (
            <ActivityIndicator color={theme.dune} style={{ marginTop: 36 }} />
          ) : (
            <Animated.View
              style={{
                opacity: enter,
                transform: [
                  {
                    translateY: enter.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              }}
            >
              {loadError ? (
                <View style={styles.warn}>
                  <Text style={styles.warnText}>{t('me.loadError')}</Text>
                  <Pressable onPress={() => void loadHub()} hitSlop={8}>
                    <Text style={styles.warnRetry}>{t('common.retry')}</Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.identity}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                ) : (
                  <LinearGradient
                    colors={['rgba(168,132,45,0.22)', 'rgba(45,138,98,0.16)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>{initial}</Text>
                  </LinearGradient>
                )}

                <View style={styles.identityCopy}>
                  <Text style={[styles.name, dir === 'rtl' && styles.rtl]} numberOfLines={2}>
                    {displayName}
                  </Text>
                  <View style={styles.metaRow}>
                    {hub?.user.camp ? (
                      <Text style={styles.meta}>{hub.user.camp.nameEs}</Text>
                    ) : null}
                    {hub?.user.camp && (phone || email) ? <Text style={styles.metaDot}>·</Text> : null}
                    {phone ? <Text style={styles.meta}>{phone}</Text> : null}
                    {!phone && email ? <Text style={styles.meta}>{email}</Text> : null}
                  </View>
                  {rep != null ? (
                    <Text style={styles.rep}>
                      {t('me.reputation', { score: rep })}
                    </Text>
                  ) : (
                    <Text style={styles.rep}>{t('profile.activeAccount')}</Text>
                  )}
                </View>
              </View>

              <View style={styles.stats}>
                <Stat value={stats.ordersAsBuyer} label={t('me.modules.orders')} />
                <View style={styles.statDivider} />
                <Stat value={stats.listingsActive} label={t('me.modules.sales')} />
                <View style={styles.statDivider} />
                <Stat value={stats.shops} label={t('me.modules.shops')} />
              </View>

              <Text style={styles.sectionLabel}>{t('profile.groups.activity')}</Text>
              <View style={styles.section}>
                {activityLinks.map((item, i) => (
                  <LinkRow
                    key={item.route}
                    item={item}
                    last={i === activityLinks.length - 1}
                    onPress={() => router.push(item.route as never)}
                  />
                ))}
              </View>

              <Pressable
                style={({ pressed }) => [styles.driverRow, pressed && styles.pressed]}
                onPress={() => router.push('/transport/garage')}
              >
                <View style={styles.driverLeft}>
                  <View
                    style={[
                      styles.driverDot,
                      driverStatus === 'verified' && styles.driverDotOk,
                      driverStatus === 'pending' && styles.driverDotWait,
                      driverStatus === 'rejected' && styles.driverDotBad,
                    ]}
                  />
                  <View style={styles.driverCopy}>
                    <Text style={styles.driverTitle}>{t('me.modules.driver')}</Text>
                    <Text style={styles.driverSub} numberOfLines={2}>
                      {t(`profile.driverStatus.${driverStatus}`)} · {driverSub}
                    </Text>
                  </View>
                </View>
                <AppIcon name="arrow-right" size={16} color={theme.dune} />
              </Pressable>

              <Text style={styles.sectionLabel}>{t('profile.groups.community')}</Text>
              <View style={styles.section}>
                {communityLinks.map((item, i) => (
                  <LinkRow
                    key={item.route}
                    item={item}
                    last={i === communityLinks.length - 1}
                    onPress={() => router.push(item.route as never)}
                  />
                ))}
              </View>

              <Text style={styles.sectionLabel}>{t('account.section')}</Text>
              <View style={styles.section}>
                {[
                  {
                    route: '/profile/personal',
                    icon: 'user' as const,
                    titleKey: 'account.personal',
                    sub: t('account.personalSub'),
                  },
                  {
                    route: '/profile/security',
                    icon: 'shield' as const,
                    titleKey: 'account.security',
                    sub: t('account.securitySub'),
                  },
                  {
                    route: '/profile/privacy',
                    icon: 'lock' as const,
                    titleKey: 'account.privacy',
                    sub: t('account.privacySub'),
                  },
                ].map((item, i, arr) => (
                  <LinkRow
                    key={item.route}
                    item={item}
                    last={i === arr.length - 1}
                    onPress={() => router.push(item.route as never)}
                  />
                ))}
              </View>
            </Animated.View>
          )}

          <Text style={styles.sectionLabel}>{t('profile.language')}</Text>
          <Text style={styles.langHint}>{t('profile.languageHint')}</Text>
          <LanguageSwitcher variant="tabs" />

          {authed ? (
            <Pressable
              style={styles.signOut}
              onPress={async () => {
                await clearLegacySession();
                try {
                  await signOut();
                } catch {
                  /* legacy only */
                }
                router.replace('/sign-in');
              }}
            >
              <Text style={styles.signOutText}>{t('nav.signOut')}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  safe: { flex: 1 },
  orbA: {
    position: 'absolute',
    top: -90,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(168,132,45,0.08)',
  },
  orbB: {
    position: 'absolute',
    top: 180,
    left: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(45,138,98,0.05)',
  },
  content: { paddingHorizontal: space.lg, paddingBottom: 130, paddingTop: 4 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  pressed: { opacity: 0.86 },

  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: theme.dune,
  },
  brandAr: {
    fontFamily: fonts.display,
    fontSize: 38,
    color: theme.ink,
    marginTop: 2,
    writingDirection: 'rtl',
    lineHeight: 46,
  },
  title: {
    fontFamily: fonts.bodyMed,
    fontSize: 15,
    color: theme.inkMuted,
    marginTop: -2,
  },
  rule: {
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.dune,
    marginTop: 12,
    marginBottom: 8,
  },
  lead: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: theme.inkSoft,
    lineHeight: 20,
    marginBottom: 22,
  },

  guest: { gap: 12, marginTop: 8 },
  guestBody: { fontFamily: fonts.body, fontSize: 15, color: theme.inkMuted, lineHeight: 22 },
  primaryCta: {
    backgroundColor: theme.ink,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryCtaText: { fontFamily: fonts.bodyBold, fontSize: 15, color: theme.pearl },
  ghostCta: { paddingVertical: 12, alignItems: 'center' },
  ghostCtaText: { fontFamily: fonts.bodyBold, fontSize: 14, color: theme.dune },

  warn: {
    marginBottom: 16,
    paddingVertical: 10,
    gap: 6,
  },
  warnText: { fontFamily: fonts.body, fontSize: 13, color: theme.inkMuted, lineHeight: 18 },
  warnRetry: { fontFamily: fonts.bodyBold, fontSize: 13, color: theme.dune },

  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 22,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(168,132,45,0.28)',
  },
  avatarText: { fontFamily: fonts.display, fontSize: 28, color: theme.ink },
  identityCopy: { flex: 1, minWidth: 0, gap: 4 },
  name: {
    fontFamily: fonts.displaySemi,
    fontSize: 24,
    letterSpacing: -0.5,
    color: theme.ink,
    lineHeight: 28,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  meta: { fontFamily: fonts.body, fontSize: 13, color: theme.inkSoft },
  metaDot: { fontFamily: fonts.body, fontSize: 13, color: theme.inkSoft },
  rep: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: theme.dune,
    marginTop: 4,
    letterSpacing: 0.2,
  },

  stats: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 28,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.borderStrong,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 26,
    letterSpacing: -0.6,
    color: theme.ink,
  },
  statLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.inkSoft,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: theme.borderStrong,
    marginVertical: 4,
  },

  sectionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: theme.dune,
    marginBottom: 10,
    marginTop: 4,
  },
  section: { marginBottom: 22 },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  linkRowLast: { borderBottomWidth: 0 },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(168,132,45,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkIconOasis: { backgroundColor: 'rgba(45,138,98,0.1)' },
  linkCopy: { flex: 1, minWidth: 0 },
  linkTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: theme.ink, letterSpacing: -0.2 },
  linkSub: { fontFamily: fonts.body, fontSize: 12, color: theme.inkSoft, marginTop: 2 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: theme.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 11, color: theme.pearl },

  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 16,
    marginBottom: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.borderStrong,
  },
  driverLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  driverDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.inkSoft,
  },
  driverDotOk: { backgroundColor: theme.oasis },
  driverDotWait: { backgroundColor: theme.dune },
  driverDotBad: { backgroundColor: theme.flare },
  driverCopy: { flex: 1, minWidth: 0 },
  driverTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: theme.ink },
  driverSub: { fontFamily: fonts.body, fontSize: 12, color: theme.inkSoft, marginTop: 2, lineHeight: 17 },

  langHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: theme.inkSoft,
    marginBottom: 12,
    marginTop: -4,
  },
  signOut: {
    marginTop: 28,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: theme.flare,
  },
});
