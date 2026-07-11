import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { useAuthApi } from '@/lib/useAuthApi';
import { useLocale, useT } from '@/lib/locale';
import { theme, gradients } from '@/lib/theme';

type Conversation = {
  id: string;
  messages: { content: string; createdAt: string }[];
  participants: { user: { displayName: string } }[];
};

export default function MessagesScreen() {
  const router = useRouter();
  const { authFetch } = useAuthApi();
  const t = useT();
  const { dir } = useLocale();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    authFetch<Conversation[]>('/messages/conversations')
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [authFetch]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.hero]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={[styles.title, dir === 'rtl' && styles.rtl]}>{t('nav.messages')}</Text>
          <Text style={[styles.sub, dir === 'rtl' && styles.rtl]}>{t('messages.sub')}</Text>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={theme.gold} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyWrap}>
              <AppIcon name="message-circle" size={40} color={theme.textDarkMuted} />
              <Text style={styles.empty}>{t('messages.empty')}</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const others = item.participants.map((p) => p.user.displayName).filter(Boolean);
          const name = others[0] ?? t('messages.chat');
          const last = item.messages[0];
          return (
            <Pressable style={styles.row} onPress={() => router.push(`/messages/${item.id}`)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{name[0]?.toUpperCase() ?? '?'}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.last} numberOfLines={1}>
                  {last?.content ?? t('messages.emptyThread')}
                </Text>
              </View>
              <AppIcon name="chevron-right" size={18} color={theme.textDarkMuted} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  header: { paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: theme.text, paddingHorizontal: 20, paddingTop: 8 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  sub: { fontSize: 14, color: theme.textMuted, paddingHorizontal: 20, marginTop: 4 },
  list: { padding: 8, paddingBottom: 100 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  empty: { textAlign: 'center', color: theme.textDarkMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 8,
    marginBottom: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(13,148,136,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: theme.emeraldDeep },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: theme.textDark },
  last: { fontSize: 14, color: theme.textDarkMuted, marginTop: 2 },
});
