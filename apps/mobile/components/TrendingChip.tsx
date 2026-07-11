import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CURATED_VISUALS } from '@/lib/home-visuals';
import { useLocale } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

type Props = {
  slug: string;
  label: string;
  hot?: boolean;
  onPress?: () => void;
};

export function TrendingChip({ slug, label, hot, onPress }: Props) {
  const { dir } = useLocale();
  const visual = CURATED_VISUALS[slug];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <ImageBackground
        source={{ uri: visual?.uri ?? CURATED_VISUALS.mobiles.uri }}
        style={styles.bg}
        imageStyle={styles.bgImage}
      >
        <LinearGradient colors={['transparent', 'rgba(10,8,6,0.05)', theme.scrimDeep]} style={StyleSheet.absoluteFill} />
        {hot ? (
          <View style={styles.hot}>
            <Text style={styles.hotText}>🔥</Text>
          </View>
        ) : null}
        <Text style={[styles.label, dir === 'rtl' && styles.rtl]}>{label}</Text>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 116,
    height: 96,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginRight: 10,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  bg: { flex: 1, padding: 12, justifyContent: 'flex-end' },
  bgImage: { borderRadius: radii.lg },
  hot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotText: { fontSize: 12 },
  label: { fontSize: 16, fontWeight: '900', color: theme.pearl },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
});
