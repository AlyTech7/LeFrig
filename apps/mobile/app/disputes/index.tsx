import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { useT } from '@/lib/locale';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, gradients } from '@/lib/theme';

type DisputeEvidence = { id: string; type: string; content?: string; createdAt: string };
type Dispute = {
  id: string;
  reason: string;
  description: string;
  status: string;
  resolution?: string;
  createdAt: string;
  evidence: DisputeEvidence[];
};

const REASON_KEYS: Record<string, string> = {
  not_received: 'disputes.reasons.notReceived',
  not_as_described: 'disputes.reasons.wrongItem',
  payment_issue: 'payment.cash',
  fraud: 'moderation.reasons.scam',
  harassment: 'report.offensive',
  other: 'disputes.reasons.other',
};

export default function DisputesScreen() {
  const router = useRouter();
  const t = useT();
  const { authFetch } = useAuthApi();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authFetch<Dispute[]>('/disputes')
      .then(setDisputes)
      .catch(() => setDisputes([]))
      .finally(() => setLoading(false));
  }, [authFetch]);

  const addEvidence = async (disputeId: string) => {
    if (note.trim().length < 5) return;
    setSaving(true);
    try {
      await authFetch(`/disputes/${disputeId}/evidence`, {
        method: 'POST',
        body: JSON.stringify({ type: 'note', content: note.trim() }),
      });
      const updated = await authFetch<Dispute>(`/disputes/${disputeId}`);
      setDisputes((prev) => prev.map((d) => (d.id === disputeId ? updated : d)));
      setNote('');
    } catch {
      Alert.alert(t('common.error'), t('report.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.hero]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <AppIcon name="arrow-left" size={20} color={theme.text} />
            <Text style={styles.backText}>{t('nav.profile')}</Text>
          </Pressable>
          <Text style={styles.title}>{t('disputes.title')}</Text>
          <Text style={styles.sub}>{t('disputes.sub')}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={theme.gold} style={{ marginTop: 40 }} />
        ) : disputes.length === 0 ? (
          <View style={styles.emptyWrap}>
            <AppIcon name="shield" size={32} color={theme.textDarkMuted} />
            <Text style={styles.empty}>{t('disputes.empty')}</Text>
            <Pressable onPress={() => router.push('/orders')}>
              <Text style={styles.link}>{t('orders.title')} →</Text>
            </Pressable>
          </View>
        ) : (
          disputes.map((d) => (
            <Pressable key={d.id} style={styles.card} onPress={() => setExpanded(expanded === d.id ? null : d.id)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{REASON_KEYS[d.reason] ? t(REASON_KEYS[d.reason]) : d.reason}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{d.status}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>
                {new Date(d.createdAt).toLocaleDateString('es-ES')} · {d.id.slice(0, 8).toUpperCase()}
              </Text>
              <Text style={styles.cardDesc} numberOfLines={expanded === d.id ? undefined : 2}>
                {d.description}
              </Text>

              {expanded === d.id && (
                <View style={styles.expanded}>
                  {d.resolution ? <Text style={styles.resolution}>{d.resolution}</Text> : null}
                  {(d.evidence ?? []).map((ev) => (
                    <View key={ev.id} style={styles.evidence}>
                      <Text style={styles.evidenceText}>{ev.content ?? ev.type}</Text>
                    </View>
                  ))}
                  {d.status !== 'resolved' && d.status !== 'closed' && (
                    <View style={styles.noteRow}>
                      <TextInput
                        style={styles.noteInput}
                        value={note}
                        onChangeText={setNote}
                        placeholder={t('disputes.addNote')}
                        placeholderTextColor={theme.gray500}
                      />
                      <Pressable
                        style={[styles.noteBtn, (saving || note.trim().length < 5) && styles.btnDisabled]}
                        onPress={() => addEvidence(d.id)}
                        disabled={saving || note.trim().length < 5}
                      >
                        <Text style={styles.noteBtnText}>{saving ? '…' : t('common.save')}</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  header: { paddingBottom: 20 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 8 },
  backText: { color: theme.text, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '900', color: theme.text, paddingHorizontal: 20, marginTop: 8 },
  sub: { fontSize: 14, color: theme.textMuted, paddingHorizontal: 20, marginTop: 4 },
  content: { padding: 20, paddingBottom: 100 },
  emptyWrap: { alignItems: 'center', marginTop: 48, gap: 12 },
  empty: { color: theme.textDarkMuted, fontSize: 16 },
  link: { color: theme.gold, fontWeight: '700', marginTop: 8 },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: theme.textDark, flex: 1 },
  badge: { backgroundColor: 'rgba(232,184,109,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: theme.gold, fontWeight: '700', fontSize: 11 },
  cardMeta: { fontSize: 12, color: theme.textDarkMuted, marginTop: 6 },
  cardDesc: { fontSize: 14, color: theme.textDarkMuted, marginTop: 10, lineHeight: 20 },
  expanded: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  resolution: { color: theme.emeraldDeep, fontWeight: '600', marginBottom: 12 },
  evidence: { backgroundColor: 'rgba(0,0,0,0.03)', padding: 10, borderRadius: 8, marginBottom: 8 },
  evidenceText: { fontSize: 13, color: theme.textDark },
  noteRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  noteInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.textDark,
    backgroundColor: theme.cream,
  },
  noteBtn: { backgroundColor: theme.emeraldDeep, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
  noteBtnText: { color: '#fff', fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});
