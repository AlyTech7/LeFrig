import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type FeatherIconName } from '@/components/AppIcon';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { clearLegacySession, getLegacyUser, type LegacyUser } from '@/lib/legacySession';
import { useAuthApi } from '@/lib/useAuthApi';

type LinkGroup = {
  titleKey: string;
  items: { labelKey: string; route: string; icon: FeatherIconName }[];
};

type HubPayload = {
  driverStatus: 'none' | 'pending' | 'verified';
  stats: {
    listingsActive: number;
    ordersAsBuyer: number;
    transportOpen: number;
    unreadNotifications: number;
  };
  user: {
    displayName: string;
    reputationScore: number;
    camp: { nameEs: string } | null;
  };
};

const LINK_GROUPS: LinkGroup[] = [
  {
    titleKey: 'profile.groups.activity',
    items: [
      { labelKey: 'nav.orders', route: '/orders', icon: 'package' },
      { labelKey: 'profile.links.driverArea', route: '/transport/garage', icon: 'truck' },
      { labelKey: 'nav.transport', route: '/transport', icon: 'map' },
      { labelKey: 'nav.messages', route: '/messages', icon: 'message-circle' },
      { labelKey: 'nav.notifications', route: '/notifications', icon: 'bell' },
      { labelKey: 'nav.favorites', route: '/favorites', icon: 'heart' },
    ],
  },
  {
    titleKey: 'profile.groups.explore',
    items: [
      { labelKey: 'nav.marketplace', route: '/marketplace', icon: 'grid' },
      { labelKey: 'nav.shops', route: '/shops', icon: 'shopping-bag' },
      { labelKey: 'nav.services', route: '/services', icon: 'zap' },
      { labelKey: 'nav.jobs', route: '/jobs', icon: 'briefcase' },
      { labelKey: 'nav.camps', route: '/camps', icon: 'map-pin' },
    ],
  },
  {
    titleKey: 'profile.groups.account',
    items: [
      { labelKey: 'profile.links.cashPin', route: '/cash', icon: 'dollar-sign' },
      { labelKey: 'nav.disputes', route: '/disputes', icon: 'shield' },
    ],
  },
  {
    titleKey: 'profile.groups.community',
    items: [
      { labelKey: 'profile.links.forum', route: '/community', icon: 'users' },
      { labelKey: 'nav.needs', route: '/needs', icon: 'help-circle' },
      { labelKey: 'profile.links.map', route: '/locations', icon: 'navigation' },
      { labelKey: 'footer.legalCenter', route: '/legal', icon: 'file-text' },
    ],
  },
];

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { authFetch, isSignedIn } = useAuthApi();
  const router = useRouter();
  const t = useT();
  const [legacyUser, setLegacyUser] = useState<LegacyUser | null>(null);
  const [hub, setHub] = useState<HubPayload | null>(null);
  const [hubLoading, setHubLoading] = useState(false);

  const loadHub = useCallback(async () => {
    if (!isSignedIn) {
      setHub(null);
      return;
    }
    setHubLoading(true);
    try {
      const data = await authFetch<HubPayload>('/users/me/hub');
      setHub(data);
    } catch {
      setHub(null);
    } finally {
      setHubLoading(false);
    }
  }, [authFetch, isSignedIn]);

  useEffect(() => {
    getLegacyUser().then(setLegacyUser);
  }, [isSignedIn]);

  useEffect(() => {
    loadHub();
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

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName[0]?.toUpperCase() ?? 'ⵣ'}</Text>
            </View>
          )}
          <Text style={styles.name}>{displayName}</Text>
          {hub?.user.camp ? <Text style={styles.meta}>{hub.user.camp.nameEs}</Text> : null}
          {phone ? (
            <View style={styles.metaRow}>
              <AppIcon name="smartphone" size={14} color={theme.dune} />
              <Text style={styles.meta}>{phone}</Text>
            </View>
          ) : null}
          {email ? (
            <View style={styles.metaRow}>
              <AppIcon name="mail" size={14} color={theme.dune} />
              <Text style={styles.meta}>{email}</Text>
            </View>
          ) : null}
          {authed ? (
            <View style={styles.badgeRow}>
              <AppIcon name="shield" size={14} color={theme.oasis} />
              <Text style={styles.rep}>
                {hub
                  ? t('me.reputation', { score: Math.round(hub.user.reputationScore) })
                  : t('profile.activeAccount')}
              </Text>
            </View>
          ) : (
            <Pressable style={styles.signInBtn} onPress={() => router.replace('/sign-in')}>
              <Text style={styles.signInText}>{t('nav.signIn')}</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      {authed ? (
        <Pressable
          style={[
            styles.driverCard,
            driverStatus === 'verified' && styles.driverCardVerified,
            driverStatus === 'pending' && styles.driverCardPending,
          ]}
          onPress={() => router.push('/transport/garage' as never)}
        >
          {hubLoading ? (
            <ActivityIndicator color={theme.gold} />
          ) : (
            <>
              <View style={styles.driverCardTop}>
                <AppIcon name="truck" size={22} color={theme.oasisDeep} />
                <Text style={styles.driverCardTitle}>{t('profile.links.driverArea')}</Text>
              </View>
              <Text style={styles.driverCardStatus}>{t(`profile.driverStatus.${driverStatus}`)}</Text>
              {hub ? (
                <Text style={styles.driverCardMeta}>
                  {t('me.modules.orders')}: {hub.stats.ordersAsBuyer}
                  {' · '}
                  {t('me.modules.sales')}: {hub.stats.listingsActive}
                  {' · '}
                  {t('nav.notifications')}: {hub.stats.unreadNotifications}
                </Text>
              ) : null}
            </>
          )}
        </Pressable>
      ) : null}

      <View style={styles.languageSection}>
        <Text style={styles.groupTitle}>{t('profile.language')}</Text>
        <Text style={styles.languageHint}>{t('profile.languageHint')}</Text>
        <LanguageSwitcher />
      </View>

      {LINK_GROUPS.map((group) => (
        <View key={group.titleKey} style={styles.group}>
          <Text style={styles.groupTitle}>{t(group.titleKey)}</Text>
          {group.items.map((l) => (
            <Pressable key={l.route} style={styles.link} onPress={() => router.push(l.route as never)}>
              <View style={styles.linkIconWrap}>
                <AppIcon name={l.icon} size={20} color={theme.oasisDeep} />
              </View>
              <Text style={styles.linkLabel}>{t(l.labelKey)}</Text>
              <AppIcon name="chevron-right" size={18} color={theme.inkSoft} />
            </Pressable>
          ))}
        </View>
      ))}

      {!authed ? (
        <Pressable style={styles.registerBtn} onPress={() => router.replace('/sign-up')}>
          <Text style={styles.registerText}>{t('profile.createAccount')}</Text>
        </Pressable>
      ) : (
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
          <AppIcon name="log-out" size={18} color={theme.flare} />
          <Text style={styles.signOutText}>{t('nav.signOut')}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  content: { paddingBottom: 100 },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.oasisDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(168,132,45,0.35)',
  },
  avatarImg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(168,132,45,0.35)',
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: theme.pearl },
  name: { fontSize: 24, fontWeight: '800', color: theme.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  meta: { fontSize: 14, color: theme.inkMuted },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  rep: { fontSize: 13, color: theme.oasis, fontWeight: '600' },
  signInBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: theme.oasisDeep,
  },
  signInText: { color: theme.pearl, fontWeight: '800', fontSize: 15 },
  driverCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 6,
  },
  driverCardVerified: {
    backgroundColor: 'rgba(45,138,98,0.08)',
    borderColor: 'rgba(45,138,98,0.3)',
  },
  driverCardPending: {
    backgroundColor: 'rgba(168,132,45,0.1)',
    borderColor: 'rgba(168,132,45,0.35)',
  },
  driverCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  driverCardTitle: { fontSize: 16, fontWeight: '800', color: theme.ink },
  driverCardStatus: { fontSize: 14, fontWeight: '700', color: theme.oasisDeep },
  driverCardMeta: { fontSize: 12, color: theme.inkMuted, marginTop: 2 },
  languageSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
    gap: 10,
  },
  languageHint: { fontSize: 13, color: theme.inkMuted, marginBottom: 4 },
  group: { paddingHorizontal: 20, paddingTop: 20 },
  groupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.dune,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: theme.surface,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  linkIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(45,138,98,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.ink },
  registerBtn: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: theme.dune,
    alignItems: 'center',
  },
  registerText: { color: theme.pearl, fontWeight: '800', fontSize: 16 },
  signOut: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: theme.flare,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutText: { color: theme.flare, fontWeight: '700', fontSize: 16 },
});
