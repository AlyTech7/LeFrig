import { type ReactNode } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { MarketplaceDepartment } from '@lefrig/shared';
import { formatVaultOptions } from '@lefrig/shared';
import { accentColors, getAtlasVisual } from '@/lib/home-visuals';
import { AppIcon } from '@/components/AppIcon';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts } from '@/lib/ui';

type Props = {
  departments: MarketplaceDepartment[];
  onPressDept: (id: string) => void;
};

const WIDE_GLOBAL_INDEX = 5;

/**
 * Mosaico editorial del Atlas — N salas:
 * héroe · pares · banner (índice 5) · resto
 */
export function AtlasMosaic({ departments, onPressDept }: Props) {
  const [hero, ...rest] = departments;
  if (!hero) return null;

  const rows: { key: string; nodes: ReactNode }[] = [];
  let i = 0;
  while (i < rest.length) {
    const globalIndex = i + 1;
    const dept = rest[i]!;

    if (globalIndex === WIDE_GLOBAL_INDEX) {
      rows.push({
        key: dept.id,
        nodes: <BannerCard dept={dept} index={globalIndex} onPress={() => onPressDept(dept.id)} />,
      });
      i += 1;
      continue;
    }

    const next = rest[i + 1];
    const nextGlobal = globalIndex + 1;
    if (next && nextGlobal !== WIDE_GLOBAL_INDEX) {
      rows.push({
        key: `pair-${dept.id}`,
        nodes: (
          <View style={styles.row}>
            <TileCard dept={dept} index={globalIndex} onPress={() => onPressDept(dept.id)} />
            <TileCard dept={next} index={nextGlobal} onPress={() => onPressDept(next.id)} />
          </View>
        ),
      });
      i += 2;
      continue;
    }

    rows.push({
      key: dept.id,
      nodes: <BannerCard dept={dept} index={globalIndex} onPress={() => onPressDept(dept.id)} />,
    });
    i += 1;
  }

  return (
    <View style={styles.wrap}>
      <HeroCard dept={hero} index={0} onPress={() => onPressDept(hero.id)} />
      {rows.map((row) => (
        <View key={row.key}>{row.nodes}</View>
      ))}
    </View>
  );
}

function IndexMark({ index }: { index: number }) {
  return <Text style={styles.num}>{String(index + 1).padStart(2, '0')}</Text>;
}

function CardTitle({
  dept,
  big,
  itemsHint,
}: {
  dept: MarketplaceDepartment;
  big?: boolean;
  itemsHint?: boolean;
}) {
  const { locale, dir } = useLocale();
  const t = useT();
  const name = pickName(locale, dept);
  return (
    <View style={styles.titleBlock}>
      <Text style={[styles.name, big && styles.nameBig, dir === 'rtl' && styles.rtl]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.count}>
        {formatVaultOptions(locale, dept.items.length)}
      </Text>
      {itemsHint ? (
        <Text style={styles.itemsHint} numberOfLines={1}>
          {dept.items
            .slice(0, 3)
            .map((i) => pickName(locale, i))
            .join(' · ')}
        </Text>
      ) : null}
    </View>
  );
}

function HeroCard({
  dept,
  index,
  onPress,
}: {
  dept: MarketplaceDepartment;
  index: number;
  onPress: () => void;
}) {
  const visual = getAtlasVisual(dept.id);
  const [c1, c2] = accentColors(dept.accent);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.hero, pressed && styles.pressed]}>
      <ImageBackground source={{ uri: visual.uri }} style={styles.heroImg} imageStyle={styles.heroRadius}>
        <LinearGradient colors={['rgba(0,0,0,0.1)', theme.scrimDeep]} style={StyleSheet.absoluteFill} />
        <View style={styles.heroTop}>
          <IndexMark index={index} />
          <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.accentBar} />
        </View>
        <CardTitle dept={dept} big />
        <View style={styles.enterRow}>
          <Text style={styles.enter}>Entrar</Text>
          <AppIcon name="arrow-right" size={16} color={theme.pearl} />
        </View>
      </ImageBackground>
    </Pressable>
  );
}

function TileCard({
  dept,
  index,
  onPress,
}: {
  dept: MarketplaceDepartment;
  index: number;
  onPress: () => void;
}) {
  const visual = getAtlasVisual(dept.id);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <ImageBackground source={{ uri: visual.uri }} style={styles.tileImg} imageStyle={styles.tileRadius}>
        <LinearGradient colors={['transparent', theme.scrimDeep]} style={StyleSheet.absoluteFill} />
        <IndexMark index={index} />
        <CardTitle dept={dept} />
      </ImageBackground>
    </Pressable>
  );
}

function BannerCard({
  dept,
  index,
  onPress,
}: {
  dept: MarketplaceDepartment;
  index: number;
  onPress: () => void;
}) {
  const visual = getAtlasVisual(dept.id);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.banner, pressed && styles.pressed]}>
      <ImageBackground source={{ uri: visual.uri }} style={styles.bannerImg} imageStyle={styles.bannerRadius}>
        <LinearGradient colors={['rgba(0,0,0,0.05)', theme.scrimDeep]} style={StyleSheet.absoluteFill} />
        <IndexMark index={index} />
        <CardTitle dept={dept} itemsHint />
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  num: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.72)',
  },
  titleBlock: { gap: 2 },
  name: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: theme.pearl,
  },
  nameBig: { fontSize: 24 },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
  count: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.62)',
  },
  itemsHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  hero: { borderRadius: radii.lg, overflow: 'hidden' },
  heroImg: { minHeight: 172, padding: 14, justifyContent: 'space-between' },
  heroRadius: { borderRadius: radii.lg },
  heroTop: { gap: 6 },
  accentBar: { height: 3, width: 40, borderRadius: 2 },
  enterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  enter: { fontFamily: fonts.bodySemi, fontSize: 13, color: theme.pearl },
  tile: { flex: 1, borderRadius: radii.md, overflow: 'hidden' },
  tileImg: { minHeight: 120, padding: 12, justifyContent: 'space-between' },
  tileRadius: { borderRadius: radii.md },
  banner: { borderRadius: radii.md, overflow: 'hidden' },
  bannerImg: { minHeight: 108, padding: 12, justifyContent: 'space-between' },
  bannerRadius: { borderRadius: radii.md },
});
