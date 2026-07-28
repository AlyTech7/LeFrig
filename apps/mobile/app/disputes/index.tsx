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
import { useRouter } from 'expo-router';
import { Hero, Button, EmptyState } from '@/components/ui';
import { useT } from '@/lib/locale';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, radii } from '@/lib/theme';
import { fonts, space, ui } from '@/lib/ui';

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

  const reasonLabel = (reason: string) => {
    const key = `disputes.reasons.${reason}` as 'disputes.reasons.other';
    const label = t(key);
    return label === key ? reason : label;
  };

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
    <View style={ui.screen}>
      <Hero title={t('disputes.title')} subtitle={t('disputes.sub')} kicker={t('nav.disputes')} />
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={theme.dune} style={{ marginTop: 40 }} />
        ) : disputes.length === 0 ? (
          <EmptyState
            icon="shield"
            title={t('disputes.empty')}
            actionLabel={t('orders.title')}
            onAction={() => router.push('/orders')}
          />
        ) : (
          disputes.map((d) => {
            const open = expanded === d.id;
            return (
              <View key={d.id} style={styles.card}>
                <Pressable onPress={() => setExpanded(open ? null : d.id)}>
                  <Text style={styles.reason}>{reasonLabel(d.reason)}</Text>
                  <Text style={styles.desc} numberOfLines={open ? undefined : 2}>
                    {d.description}
                  </Text>
                  <Text style={styles.meta}>
                    {d.status} · {new Date(d.createdAt).toLocaleDateString('es-ES')}
                  </Text>
                </Pressable>
                {open ? (
                  <View style={styles.evidence}>
                    {(d.evidence ?? []).map((e) => (
                      <Text key={e.id} style={styles.ev}>
                        {e.content ?? e.type}
                      </Text>
                    ))}
                    <TextInput
                      style={ui.input}
                      value={note}
                      onChangeText={setNote}
                      placeholder={t('disputes.addNotePlaceholder')}
                      placeholderTextColor={theme.inkSoft}
                    />
                    <Button
                      label={t('disputes.addNote')}
                      loading={saving}
                      onPress={() => void addEvidence(d.id)}
                      fullWidth
                    />
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 48 },
  card: {
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 10,
  },
  reason: { fontFamily: fonts.bodyBold, fontSize: 15, color: theme.ink },
  desc: { fontFamily: fonts.body, fontSize: 14, color: theme.inkMuted, marginTop: 4, lineHeight: 20 },
  meta: { fontFamily: fonts.body, fontSize: 12, color: theme.inkSoft, marginTop: 8 },
  evidence: { marginTop: 12, gap: 8 },
  ev: { fontFamily: fonts.body, fontSize: 13, color: theme.ink, backgroundColor: theme.sand, padding: 8, borderRadius: 8 },
});
