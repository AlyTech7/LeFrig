import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon, type FeatherIconName } from '@/components/AppIcon';
import { theme } from '@/lib/theme';

interface Props {
  icon: FeatherIconName;
  label: string;
  sublabel?: string;
  gradient: readonly [string, string];
  onPress?: () => void;
  large?: boolean;
}

export function ActionCard({ icon, label, sublabel, gradient, onPress, large }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <LinearGradient
        colors={[gradient[0], gradient[1], 'rgba(0,0,0,0.35)']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, large && styles.cardLarge]}
      >
        <View style={styles.glow} />
        <View style={styles.topRow}>
          <View style={styles.iconRing}>
            <AppIcon name={icon} size={22} color={theme.text} />
          </View>
          <View style={styles.chevron}>
            <AppIcon name="arrow-up-right" size={16} color="rgba(255,255,255,0.55)" />
          </View>
        </View>
        <View style={styles.copy}>
          <Text style={styles.label}>{label}</Text>
          {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  pressed: { opacity: 0.94, transform: [{ scale: 0.985 }] },
  card: {
    borderRadius: 22,
    padding: 18,
    minHeight: 136,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 10,
  },
  cardLarge: { minHeight: 148 },
  glow: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconRing: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { marginTop: 14 },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    letterSpacing: -0.2,
  },
  sublabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
