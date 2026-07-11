import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { API_URL } from '@/lib/api';
import { streamConversation, type ChatMessage } from '@/lib/messageStream';
import { useT } from '@/lib/locale';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, gradients } from '@/lib/theme';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const { authFetch, getAccessToken } = useAuthApi();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState(false);
  const listRef = useRef<FlatList>(null);

  const appendMessage = (msg: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  };

  const load = (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    authFetch<ChatMessage[]>(`/messages/conversations/${id}`)
      .then(setMessages)
      .catch(() => { if (!silent) setMessages([]); })
      .finally(() => { if (!silent) setLoading(false); });
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const ac = new AbortController();

    (async () => {
      while (!cancelled) {
        try {
          const token = await getAccessToken();
          if (!token || cancelled) break;
          setLive(true);
          await streamConversation(API_URL, id, token, (ev) => {
            if (ev.type === 'message' && ev.message) appendMessage(ev.message);
          }, ac.signal);
        } catch {
          if (cancelled) return;
          setLive(false);
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
      setLive(false);
    };
  }, [id, getAccessToken]);

  useEffect(() => {
    if (messages.length) listRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !id) return;
    setSending(true);
    try {
      const msg = await authFetch<ChatMessage>('/messages', {
        method: 'POST',
        body: JSON.stringify({ conversationId: id, content: text.trim() }),
      });
      setText('');
      appendMessage(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.hero]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>{t('messages.chat')}</Text>
            {live && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>{t('common.live')}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={theme.gold} style={{ marginTop: 40 }} />
            ) : (
              <Text style={styles.empty}>{t('messages.emptyThread')}</Text>
            )
          }
          renderItem={({ item }) => (
            <View style={styles.bubble}>
              <Text style={styles.sender}>{item.sender.displayName}</Text>
              <Text style={styles.content}>{item.content}</Text>
            </View>
          )}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={t('messages.placeholder')}
            placeholderTextColor={theme.textDarkMuted}
          />
          <Pressable style={styles.sendBtn} onPress={send} disabled={sending}>
            {sending ? (
              <ActivityIndicator color={theme.text} size="small" />
            ) : (
              <AppIcon name="send" size={18} color={theme.text} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  flex: { flex: 1 },
  header: { paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.emerald },
  liveText: { fontSize: 12, fontWeight: '700', color: theme.emerald },
  list: { padding: 16, paddingBottom: 8 },
  empty: { textAlign: 'center', color: theme.textDarkMuted, marginTop: 40 },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  sender: { fontSize: 11, fontWeight: '700', color: theme.emeraldDeep, marginBottom: 4 },
  content: { fontSize: 15, color: theme.textDark },
  inputRow: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', backgroundColor: theme.cream },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.textDark,
    backgroundColor: '#fff',
  },
  sendBtn: {
    backgroundColor: theme.emeraldDeep,
    borderRadius: 14,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
