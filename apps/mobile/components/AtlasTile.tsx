import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { MarketplaceDepartment } from '@lefrig/shared';
import { accentColors, getAtlasVisual } from '@/lib/home-visuals';
import { pickName } from '@/lib/bilingual';
import { useLocale } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

type Props = {
  dept: MarketplaceDepartment;
  index: number;
  onPress?: () => void;
  compact?: boolean;
};

export function AtlasTile({ dept, index, onPress, compact }: Props) {
  const { locale, dir } = useLocale();
  const visual = getAtlasVisual(dept.id);
  const [c1, c2] = accentColors(dept.accent);
  const num = String(index + 1).padStart(2, '0');
  const name = pickName(locale, dept);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        compact ? styles.wrapCompact : styles.wrapFull,
        pressed && styles.pressed,
      ]}
    >
      <ImageBackground source={{ uri: visual.uri }} style={styles.bg} imageStyle={styles.bgImage}>
        <LinearGradient colors={['rgba(0,0,0,0.08)', theme.scrimDeep]} style={StyleSheet.absoluteFill} />
        <View style={styles.header}>
          <Text style={styles.num}>{num}</Text>
          <Text style={styles.emoji}>{dept.icon}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={[styles.name, dir === 'rtl' && styles.rtl]} numberOfLines={1}>
            {name}
          </Text>
          <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bar} />
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: theme.canvasSoft,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  wrapFull: { width: 168, height: 200 },
  wrapCompact: { width: '48%', aspectRatio: 0.82, marginBottom: 10 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  bg: { flex: 1, padding: 12, justifyContent: 'space-between' },
  bgImage: { borderRadius: radii.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  num: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.pearl,
    letterSpacing: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  emoji: { fontSize: 22 },
  footer: { gap: 2 },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.pearl,
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  bar: { height: 3, borderRadius: 2, marginTop: 8, width: '100%' },
});
