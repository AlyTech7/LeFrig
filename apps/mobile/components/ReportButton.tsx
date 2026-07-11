import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthApi } from '@/lib/useAuthApi';
import { AppIcon } from '@/components/AppIcon';
import { useT } from '@/lib/locale';
import { theme } from '@/lib/theme';

const REASON_KEYS = [
  { value: 'scam', key: 'report.scam' },
  { value: 'inappropriate', key: 'report.inappropriate' },
  { value: 'offensive', key: 'report.offensive' },
  { value: 'spam', key: 'report.spam' },
  { value: 'other', key: 'report.other' },
] as const;

type Props = {
  targetType: 'listing' | 'user' | 'community_post' | 'shop' | 'service';
  targetId: string;
  targetUserId?: string;
  label?: string;
  compact?: boolean;
};

export function ReportButton({ targetType, targetId, targetUserId, label, compact }: Props) {
  const router = useRouter();
  const { authFetch, syncUser, isSignedIn } = useAuthApi();
  const t = useT();
  const [sent, setSent] = useState(false);
  const resolvedLabel = label ?? t('report.defaultLabel');

  const send = async (reason: string) => {
    try {
      await syncUser().catch(() => undefined);
      await authFetch('/moderation/reports', {
        method: 'POST',
        body: JSON.stringify({ targetType, targetId, targetUserId, reason }),
      });
      setSent(true);
      Alert.alert(t('moderation.report'), t('report.sent'));
    } catch {
      Alert.alert(t('common.error'), t('report.error'));
    }
  };

  const openDialog = () => {
    if (!isSignedIn) {
      Alert.alert(t('auth.signInTitle'), t('reviews.signInToRate'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('nav.signIn'), onPress: () => router.push('/sign-in') },
      ]);
      return;
    }
    Alert.alert(t('report.why'), undefined, [
      ...REASON_KEYS.map((r) => ({ text: t(r.key), onPress: () => send(r.value) })),
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);
  };

  if (sent) {
    return <Text style={styles.sentText}>{t('moderation.sent')}</Text>;
  }

  return (
    <Pressable style={[styles.btn, compact && styles.btnCompact]} onPress={openDialog} hitSlop={8}>
      <AppIcon name="flag" size={compact ? 13 : 15} color={theme.inkSoft} />
      <Text style={[styles.label, compact && styles.labelCompact]}>{resolvedLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignSelf: 'flex-start',
  },
  btnCompact: { paddingVertical: 4 },
  label: {
    fontSize: 13,
    color: theme.inkSoft,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  labelCompact: { fontSize: 12 },
  sentText: { fontSize: 13, color: theme.oasis, fontWeight: '700', paddingVertical: 8 },
});
