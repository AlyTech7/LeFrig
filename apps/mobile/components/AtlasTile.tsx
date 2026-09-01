import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { MarketplaceDepartment } from '@lefrig/shared';
import { formatVaultOptions } from '@lefrig/shared';
import { accentColors, getAtlasVisual } from '@/lib/home-visuals';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts } from '@/lib/ui';

type Props = {
  dept: MarketplaceDepartment;
  index: number;
  onPress?: () => void;
  compact?: boolean;
  active?: boolean;
};

export function AtlasTile({ dept, index, onPress, compact, active }: Props) {
  const { locale, dir } = useLocale();
  const t = useT();
  const visual = getAtlasVisual(dept.id);
  const [c1, c2] = accentColors(dept.accent);
  const num = String(index + 1).padStart(2, '0');
  const name = pickName(locale, dept);

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.compactWrap, active && styles.compactActive, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={name}
      >
        <ImageBackground source={{ uri: visual.uri }} style={styles.compactMedia} imageStyle={styles.mediaRadius}>
          <LinearGradient
            colors={['rgba(8,6,4,0.05)', 'rgba(8,6,4,0.72)']}
            locations={[0.35, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.compactNum}>{num}</Text>
          {active ? <View style={styles.activeDot} /> : null}
        </ImageBackground>
        <Text style={[styles.compactName, dir === 'rtl' && styles.rtl]} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.compactCount}>
          {formatVaultOptions(locale, dept.items.length)}
        </Text>
        <LinearGradient
          colors={[c1, c2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.compactBar, active && styles.compactBarActive]}
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrapFull, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      <ImageBackground source={{ uri: visual.uri }} style={styles.bg} imageStyle={styles.mediaRadius}>
        <LinearGradient colors={['rgba(8,6,4,0.08)', theme.scrimDeep]} style={StyleSheet.absoluteFill} />
        <Text style={styles.num}>{num}</Text>
        <View style={styles.footer}>
          <Text style={[styles.name, dir === 'rtl' && styles.rtl]} numberOfLines={2}>
            {name}
          </Text>
          <Text style={styles.count}>
            {formatVaultOptions(locale, dept.items.length)}
          </Text>
          <LinearGradient
            colors={[c1, c2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bar}
          />
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },

  compactWrap: {
    width: '100%',
    marginBottom: 4,
  },
  compactActive: {},
  compactMedia: {
    width: '100%',
    aspectRatio: 1.15,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: theme.canvasSoft,
    marginBottom: 10,
    justifyContent: 'space-between',
    padding: 12,
  },
  mediaRadius: { borderRadius: radii.md },
  compactNum: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.5,
    color: 'rgba(250,248,244,0.78)',
  },
  activeDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.duneBright,
  },
  compactName: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    letterSpacing: -0.2,
    color: theme.ink,
    lineHeight: 18,
    minHeight: 36,
  },
  compactCount: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: theme.inkSoft,
    marginTop: 2,
  },
  compactBar: {
    height: 2,
    borderRadius: 1,
    width: 28,
    marginTop: 8,
    opacity: 0.55,
  },
  compactBarActive: {
    width: 40,
    opacity: 1,
  },

  wrapFull: {
    width: 168,
    height: 210,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: theme.canvasSoft,
  },
  bg: { flex: 1, padding: 14, justifyContent: 'space-between' },
  num: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.5,
    color: 'rgba(250,248,244,0.72)',
  },
  footer: { gap: 2 },
  name: {
    fontFamily: fonts.displaySemi,
    fontSize: 18,
    letterSpacing: -0.3,
    color: theme.pearl,
    lineHeight: 22,
  },
  count: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: 'rgba(250,248,244,0.55)',
    marginTop: 4,
  },
  bar: { height: 2, borderRadius: 1, marginTop: 10, width: 40 },
});
