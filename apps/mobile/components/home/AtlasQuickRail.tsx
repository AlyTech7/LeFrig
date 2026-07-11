import { ScrollView, View, Text, Pressable, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MARKETPLACE_DEPARTMENTS, type MarketplaceDepartment } from '@lefrig/shared';
import { accentColors, getAtlasVisual } from '@/lib/home-visuals';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

type Props = {
  onPressDept: (id: string) => void;
};

function QuickChip({ dept, index, onPress }: { dept: MarketplaceDepartment; index: number; onPress: () => void }) {
  const { locale } = useLocale();
  const visual = getAtlasVisual(dept.id);
  const [c1, c2] = accentColors(dept.accent);
  const num = String(index + 1).padStart(2, '0');
  const name = pickName(locale, dept);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
      <ImageBackground source={{ uri: visual.uri }} style={styles.chipBg} imageStyle={styles.chipImage}>
        <LinearGradient colors={['rgba(0,0,0,0.15)', theme.scrimDeep]} style={StyleSheet.absoluteFill} />
        <Text style={styles.chipNum}>{num}</Text>
        <Text style={styles.chipIco}>{dept.icon}</Text>
        <Text style={styles.chipName} numberOfLines={2}>
          {name}
        </Text>
        <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.chipBar} />
      </ImageBackground>
    </Pressable>
  );
}

export function AtlasQuickRail({ onPressDept }: Props) {
  const t = useT();

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <View style={styles.liveDot} />
        <Text style={styles.label}>{t('home.portalHint')}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
        decelerationRate="fast"
      >
        {MARKETPLACE_DEPARTMENTS.map((dept, i) => (
          <QuickChip key={dept.id} dept={dept} index={i} onPress={() => onPressDept(dept.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.oasis,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.inkMuted,
  },
  rail: { gap: 8, paddingHorizontal: 2, paddingBottom: 4 },
  chip: {
    width: 76,
    height: 88,
    borderRadius: radii.md,
    overflow: 'hidden',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.97 }] },
  chipBg: { flex: 1, padding: 8, justifyContent: 'flex-end', alignItems: 'center' },
  chipImage: { borderRadius: radii.md },
  chipNum: {
    position: 'absolute',
    top: 6,
    left: 6,
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(250,248,244,0.75)',
    backgroundColor: 'rgba(0,0,0,0.38)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  chipIco: { fontSize: 18, marginBottom: 2 },
  chipName: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.pearl,
    textAlign: 'center',
    lineHeight: 11,
  },
  chipBar: { height: 2, borderRadius: 1, width: '100%', marginTop: 4 },
});
