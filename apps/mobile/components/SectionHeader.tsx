import { View, Text, StyleSheet } from 'react-native';
import { useLocale } from '@/lib/locale';
import { theme } from '@/lib/theme';
import { fonts } from '@/lib/ui';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export function SectionHeader({ eyebrow, title, subtitle }: Props) {
  const { dir } = useLocale();

  return (
    <View style={styles.wrap}>
      {eyebrow ? (
        <Text style={[styles.eyebrow, dir === 'rtl' && styles.rtl]}>{eyebrow}</Text>
      ) : null}
      <Text style={[styles.title, dir === 'rtl' && styles.rtl]} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, dir === 'rtl' && styles.rtl]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14, flex: 1 },
  eyebrow: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: theme.dune,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -0.6,
    color: theme.ink,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: theme.inkMuted,
    marginTop: 6,
    lineHeight: 18,
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
});
