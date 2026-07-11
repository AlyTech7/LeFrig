import { View, Text, StyleSheet } from 'react-native';
import { useLocale } from '@/lib/locale';
import { theme } from '@/lib/theme';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export function SectionHeader({ eyebrow, title, subtitle }: Props) {
  const { dir } = useLocale();

  return (
    <View style={styles.wrap}>
      <View style={styles.accent} />
      <View style={styles.copy}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  accent: {
    width: 3,
    height: 44,
    borderRadius: 2,
    backgroundColor: theme.dune,
    marginTop: 2,
    shadowColor: theme.dune,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  copy: { flex: 1 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.inkMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: theme.inkMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
});
