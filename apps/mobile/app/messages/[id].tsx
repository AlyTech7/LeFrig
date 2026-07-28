import { useEffect, useMemo, useRef, useState } from 'react';
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
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { API_URL } from '@/lib/api';
import { streamConversation, type ChatMessage } from '@/lib/messageStream';
import { useLocale, useT } from '@/lib/locale';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';

function formatMsgTime(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(locale.startsWith('ar') ? 'ar' : 'es', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { locale, dir } = useLocale();
  const { authFetch, getAccessToken, syncUser } = useAuthApi();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myId, setMyId] = useState('');
  const [peerName, setPeerName] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState(false);
  const [focused, setFocused] = useState(false);
  const listRef = useRef<FlatList>(null);
  const fade = useRef(new Animated.Value(0)).current;

  const appendMessage = (msg: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        const sync = await syncUser();
        if (sync && typeof sync.user === 'object' && sync.user && 'id' in sync.user) {
          setMyId(String((sync.user as { id: string }).id));
        }
        const msgs = await authFetch<ChatMessage[]>(`/messages/conversations/${id}`);
        setMessages(Array.isArray(msgs) ? msgs : []);
        const other = (Array.isArray(msgs) ? msgs : []).find(
          (m) => m.sender?.id && String(m.sender.id) !== String((sync as { user?: { id?: string } })?.user?.id),
        );
        if (other?.sender?.displayName) setPeerName(other.sender.displayName);
        Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }).start();
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [authFetch, fade, id, syncUser]);

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
          await streamConversation(
            API_URL,
            id,
            token,
            (ev) => {
              if (ev.type === 'message' && ev.message) appendMessage(ev.message);
            },
            ac.signal,
          );
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

  useEffect(() => {
    if (!peerName && messages.length && myId) {
      const other = messages.find((m) => m.sender?.id && m.sender.id !== myId);
      if (other?.sender?.displayName) setPeerName(other.sender.displayName);
    }
  }, [messages, myId, peerName]);

  const title = peerName || t('messages.chat');
  const initial = (title[0] ?? '?').toUpperCase();

  const canSend = Boolean(text.trim()) && !sending;

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
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSending(false);
    }
  };

  const dayGroups = useMemo(() => {
    // Keep flat list; day separators can be added later if needed
    return messages;
  }, [messages]);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable
          style={styles.back}
          onPress={() => router.replace('/messages')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('messages.backList')}
        >
          <AppIcon name="arrow-left" size={18} color={theme.dune} />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerInitial}>{initial}</Text>
          </View>
          <View style={styles.headerCopy}>
            <Text style={[styles.headerTitle, dir === 'rtl' && styles.rtl]} numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, live ? styles.statusLive : styles.statusOff]} />
              <Text style={styles.statusText}>{live ? t('messages.live') : t('messages.offline')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerSpacer} />
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <Animated.View style={[styles.flex, { opacity: fade }]}>
          <FlatList
            ref={listRef}
            data={dayGroups}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator color={theme.dune} style={{ marginTop: 48 }} />
              ) : (
                <View style={styles.emptyThread}>
                  <Text style={styles.emptyThreadAr}>مرحبا</Text>
                  <Text style={styles.emptyThreadText}>{t('messages.emptyThread')}</Text>
                </View>
              )
            }
            renderItem={({ item, index }) => {
              const mine = Boolean(myId && item.sender?.id === myId);
              const prev = dayGroups[index - 1];
              const showSender =
                !mine && (!prev || prev.sender?.id !== item.sender?.id || Boolean(myId && prev.sender?.id === myId));
              const time = formatMsgTime(item.createdAt, locale);

              return (
                <View style={[styles.bubbleWrap, mine ? styles.alignEnd : styles.alignStart]}>
                  {showSender ? <Text style={styles.sender}>{item.sender.displayName}</Text> : null}
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                    <Text style={[styles.content, mine && styles.contentMine]}>{item.content}</Text>
                  </View>
                  {time ? (
                    <Text style={[styles.msgTime, mine && styles.msgTimeMine]}>{time}</Text>
                  ) : null}
                </View>
              );
            }}
          />
        </Animated.View>

        <SafeAreaView edges={['bottom']} style={styles.composerWrap}>
          <View style={[styles.composer, focused && styles.composerFocus]}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder={t('messages.placeholder')}
              placeholderTextColor={theme.inkSoft}
              multiline
              maxLength={2000}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            <Pressable
              style={[styles.sendBtn, !canSend && styles.sendBtnOff]}
              onPress={() => void send()}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel={t('messages.send')}
            >
              {sending ? (
                <ActivityIndicator color={theme.pearl} size="small" />
              ) : (
                <AppIcon name="send" size={17} color={theme.pearl} />
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  flex: { flex: 1 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
    backgroundColor: theme.canvas,
    gap: 8,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(168,132,45,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInitial: { fontFamily: fonts.displaySemi, fontSize: 16, color: theme.dune },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: theme.ink,
    letterSpacing: -0.2,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLive: { backgroundColor: theme.oasis },
  statusOff: { backgroundColor: theme.inkSoft },
  statusText: { fontFamily: fonts.body, fontSize: 11, color: theme.inkSoft },
  headerSpacer: { width: 40 },

  list: { paddingHorizontal: space.lg, paddingTop: 16, paddingBottom: 12, flexGrow: 1 },
  emptyThread: { alignItems: 'center', paddingTop: 64, gap: 8 },
  emptyThreadAr: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: 'rgba(168,132,45,0.28)',
    writingDirection: 'rtl',
  },
  emptyThreadText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: theme.inkMuted,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 20,
  },

  bubbleWrap: { marginBottom: 12, maxWidth: '82%' },
  alignEnd: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  alignStart: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  sender: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: theme.dune,
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: theme.ink,
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderBottomLeftRadius: 6,
  },
  content: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: theme.ink,
    lineHeight: 22,
  },
  contentMine: { color: theme.pearl },
  msgTime: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: theme.inkSoft,
    marginTop: 4,
    marginHorizontal: 4,
  },
  msgTimeMine: { textAlign: 'right' },

  composerWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
    backgroundColor: 'rgba(250,248,244,0.96)',
    paddingHorizontal: space.md,
    paddingTop: 10,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    borderRadius: radii.lg,
    backgroundColor: theme.surface,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    marginBottom: 6,
  },
  composerFocus: { borderColor: theme.dune },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 36,
    fontSize: 15,
    fontFamily: fonts.body,
    color: theme.ink,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: theme.inkSoft },
});
