import { View, Text, StyleSheet, Pressable, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { useLocale } from '@/lib/locale';
import { theme } from '@/lib/theme';

type Props = {
  title: string;
  subtitle?: string;
  backLabel?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  style?: ViewStyle;
};

export function ScreenHeader({ title, subtitle, backLabel, onBack, right, style }: Props) {
  const router = useRouter();
  const { dir, t } = useLocale();
  const resolvedBack = backLabel ?? t('common.back');

  return (
    <SafeAreaView edges={['top']} style={[styles.wrap, style]}>
      <View style={styles.topRow}>
        <Pressable style={styles.back} onPress={onBack ?? (() => router.back())} hitSlop={8}>
          <AppIcon name="arrow-left" size={20} color={theme.ink} />
          <Text style={styles.backLabel}>{resolvedBack}</Text>
        </Pressable>
        {right}
      </View>
      <Text
        style={[styles.title, dir === 'rtl' && styles.rtl]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, dir === 'rtl' && styles.rtl]}>{subtitle}</Text>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: theme.canvas,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  backLabel: { fontSize: 14, fontWeight: '600', color: theme.inkMuted },
  title: { fontSize: 26, fontWeight: '800', color: theme.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: theme.inkMuted, marginTop: 6, fontWeight: '500' },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
});
