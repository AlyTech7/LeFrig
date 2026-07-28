import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { useAuthApi } from '@/lib/useAuthApi';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';

type Conversation = {
  id: string;
  messages: { content: string; createdAt: string }[];
  participants: { user: { displayName: string } }[];
};

function formatThreadTime(iso: string, locale: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const mins = Math.max(0, Math.round(diff / 60_000));
  if (mins < 60) return locale.startsWith('ar') ? `${mins} د` : `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return locale.startsWith('ar') ? `${hrs} س` : `${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 7) return locale.startsWith('ar') ? `${days} ي` : `${days}d`;
  return new Date(iso).toLocaleDateString(locale.startsWith('ar') ? 'ar' : 'es', {
    day: 'numeric',
    month: 'short',
  });
}

const AVATAR_TINTS = [
  'rgba(168,132,45,0.14)',
  'rgba(45,138,98,0.12)',
  'rgba(196,92,58,0.10)',
  'rgba(12,74,110,0.10)',
] as const;

const AVATAR_INK = [theme.dune, theme.oasisDeep, theme.flare, theme.info] as const;

export default function MessagesScreen() {
  const router = useRouter();
  const { authFetch, isSignedIn, isLoaded } = useAuthApi();
  const t = useT();
  const { locale, dir } = useLocale();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 560,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const load = useCallback(
    async (soft = false) => {
      if (!isSignedIn) {
        setConversations([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      if (soft) setRefreshing(true);
      else setLoading(true);
      try {
        const rows = await authFetch<Conversation[]>('/messages/conversations');
        setConversations(Array.isArray(rows) ? rows : []);
      } catch {
        setConversations([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authFetch, isSignedIn],
  );

  useEffect(() => {
    if (!isLoaded) return;
    void load();
  }, [isLoaded, load]);

  const heroMotion = {
    opacity: enter,
    transform: [
      {
        translateY: enter.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#f7f1e4', theme.canvas, theme.canvas]}
        locations={[0, 0.3, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.orb} pointerEvents="none" />

      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.hero, heroMotion]}>
          <Text style={styles.kicker}>{t('me.modules.messages')}</Text>
          <Text style={[styles.brandAr, dir === 'rtl' && styles.rtl]} accessibilityRole="header">
            الرسائل
          </Text>
          <Text style={[styles.title, dir === 'rtl' && styles.rtl]}>{t('messages.title')}</Text>
          <View style={styles.rule} />
          <Text style={[styles.lead, dir === 'rtl' && styles.rtl]}>{t('messages.sub')}</Text>
        </Animated.View>
      </SafeAreaView>

      {!isLoaded || (loading && conversations.length === 0) ? (
        <ActivityIndicator color={theme.dune} style={{ marginTop: 48 }} />
      ) : !isSignedIn ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyAr}>الرسائل</Text>
          <Text style={styles.emptyTitle}>{t('messages.emptyTitle')}</Text>
          <Text style={styles.emptyBody}>
            {t('nav.signIn')} {t('messages.signInSuffix')}
          </Text>
          <Pressable style={styles.emptyCta} onPress={() => router.push('/sign-in')}>
            <Text style={styles.emptyCtaText}>{t('nav.signIn')}</Text>
            <AppIcon name="arrow-right" size={14} color={theme.dune} />
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, conversations.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor={theme.dune}
              colors={[theme.dune]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyAr}>الرسائل</Text>
              <Text style={styles.emptyTitle}>{t('messages.emptyTitle')}</Text>
              <Text style={styles.emptyBody}>{t('messages.emptyHint')}</Text>
              <Pressable style={styles.emptyCta} onPress={() => router.push('/marketplace')}>
                <Text style={styles.emptyCtaText}>{t('messages.marketLink')}</Text>
                <AppIcon name="arrow-right" size={14} color={theme.dune} />
              </Pressable>
            </View>
          }
          ListHeaderComponent={
            conversations.length > 0 ? (
              <View style={styles.countRow}>
                <Text style={styles.countText}>
                  {conversations.length} · {t('messages.conversation')}
                </Text>
                <View style={styles.countRule} />
              </View>
            ) : null
          }
          renderItem={({ item, index }) => {
            const others = item.participants.map((p) => p.user.displayName).filter(Boolean);
            const name = others[0] ?? t('messages.chat');
            const last = item.messages[0];
            const tint = AVATAR_TINTS[index % AVATAR_TINTS.length]!;
            const ink = AVATAR_INK[index % AVATAR_INK.length]!;
            const time = last?.createdAt ? formatThreadTime(last.createdAt, locale) : '';

            return (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                onPress={() => router.push(`/messages/${item.id}`)}
                accessibilityRole="button"
                accessibilityLabel={name}
              >
                <View style={[styles.avatar, { backgroundColor: tint }]}>
                  <Text style={[styles.avatarText, { color: ink }]}>
                    {name[0]?.toUpperCase() ?? '?'}
                  </Text>
                </View>
                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {name}
                    </Text>
                    {time ? <Text style={styles.time}>{time}</Text> : null}
                  </View>
                  <Text style={styles.last} numberOfLines={1}>
                    {last?.content ?? t('messages.emptyThread')}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  orb: {
    position: 'absolute',
    top: -70,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(168,132,45,0.07)',
  },
  hero: {
    paddingHorizontal: space.lg,
    paddingTop: 6,
    paddingBottom: 8,
  },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: theme.dune,
  },
  brandAr: {
    fontFamily: fonts.display,
    fontSize: 36,
    letterSpacing: -0.4,
    color: theme.ink,
    marginTop: 2,
    writingDirection: 'rtl',
    lineHeight: 44,
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
    marginTop: 10,
    marginBottom: 8,
  },
  lead: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: theme.inkSoft,
    lineHeight: 20,
    marginBottom: 4,
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },

  list: { paddingHorizontal: space.lg, paddingBottom: 120, paddingTop: 8 },
  listEmpty: { flexGrow: 1 },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    marginTop: 4,
  },
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
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  pressed: { opacity: 0.72 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displaySemi, fontSize: 18 },
  info: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: theme.ink,
    letterSpacing: -0.2,
    flex: 1,
  },
  time: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: theme.inkSoft,
  },
  last: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: theme.inkMuted,
    marginTop: 3,
    lineHeight: 18,
  },

  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: 56,
    gap: 6,
  },
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
