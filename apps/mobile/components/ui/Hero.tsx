import { View, Text, StyleSheet, Pressable, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { useLocale } from '@/lib/locale';
import { theme } from '@/lib/theme';
import { type as typo, space } from '@/lib/ui';

type Props = {
  title: string;
  subtitle?: string;
  kicker?: string;
  back?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  style?: ViewStyle;
};

export function Hero({ title, subtitle, kicker, back = true, onBack, right, style }: Props) {
  const router = useRouter();
  const { t, dir } = useLocale();
  const rtl = dir === 'rtl';

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.top}>
        {back ? (
          <Pressable
            style={styles.back}
            onPress={onBack ?? (() => router.back())}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <AppIcon name="arrow-left" size={18} color={theme.dune} />
            <Text style={styles.backText}>{t('common.back')}</Text>
          </Pressable>
        ) : (
          <View />
        )}
        {right}
      </View>
      {kicker ? <Text style={[styles.kicker, rtl && styles.rtl]}>{kicker}</Text> : null}
      <Text style={[styles.title, rtl && styles.rtl]} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={[styles.subtitle, rtl && styles.rtl]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.canvas,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { ...typo.caption, color: theme.dune, fontWeight: '700' },
  kicker: {
    ...typo.label,
    color: theme.dune,
    marginBottom: 6,
  },
  title: { ...typo.display, fontSize: 26 },
  subtitle: { ...typo.subtitle, marginTop: 6 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
});
