import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { MarketplaceDepartment } from '@lefrig/shared';
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

/**
 * Mosaico editorial del Atlas — 10 salas:
 * héroe · pareja · pareja · banner · pareja · pareja
 */
export function AtlasMosaic({ departments, onPressDept }: Props) {
  const [hero, a, b, c, d, wide, e, f, g, h] = departments;
  if (!hero) return null;

  return (
    <View style={styles.wrap}>
      <HeroCard dept={hero} index={0} onPress={() => onPressDept(hero.id)} />

      <View style={styles.row}>
        {a ? <TileCard dept={a} index={1} onPress={() => onPressDept(a.id)} /> : null}
        {b ? <TileCard dept={b} index={2} onPress={() => onPressDept(b.id)} /> : null}
      </View>
      <View style={styles.row}>
        {c ? <TileCard dept={c} index={3} onPress={() => onPressDept(c.id)} /> : null}
        {d ? <TileCard dept={d} index={4} onPress={() => onPressDept(d.id)} /> : null}
      </View>

      {wide ? <BannerCard dept={wide} index={5} onPress={() => onPressDept(wide.id)} /> : null}

      <View style={styles.row}>
        {e ? <TileCard dept={e} index={6} onPress={() => onPressDept(e.id)} /> : null}
        {f ? <TileCard dept={f} index={7} onPress={() => onPressDept(f.id)} /> : null}
      </View>
      <View style={styles.row}>
        {g ? <TileCard dept={g} index={8} onPress={() => onPressDept(g.id)} /> : null}
        {h ? <TileCard dept={h} index={9} onPress={() => onPressDept(h.id)} /> : null}
      </View>
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
  const [c1, c2] = accentColors(dept.accent);
  const name = pickName(locale, dept);
  return (
    <View style={styles.titleBlock}>
      <Text style={[styles.name, big && styles.nameBig, dir === 'rtl' && styles.rtl]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.count}>{t('atlas.vaultOptions', { count: dept.items.length })}</Text>
      {itemsHint ? (
        <Text style={styles.itemsHint} numberOfLines={1}>
          {dept.items
            .slice(0, 3)
            .map((i) => pickName(locale, i))
            .join(' · ')}
        </Text>
      ) : null}
      <LinearGradient
        colors={[c1, c2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.bar, big && styles.barBig]}
      />
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
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, styles.hero, pressed && styles.pressed]}>
      <ImageBackground source={{ uri: visual.uri }} style={styles.bg} imageStyle={styles.bgImage}>
        <LinearGradient colors={['rgba(8,6,4,0.08)', theme.scrimDeep]} style={StyleSheet.absoluteFill} />
        <IndexMark index={index} />
        <View style={styles.heroFooter}>
          <CardTitle dept={dept} big itemsHint />
          <View style={styles.heroArrow}>
            <AppIcon name="arrow-right" size={16} color={theme.pearl} />
          </View>
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
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, styles.tile, pressed && styles.pressed]}>
      <ImageBackground source={{ uri: visual.uri }} style={styles.bg} imageStyle={styles.bgImage}>
        <LinearGradient colors={['rgba(8,6,4,0.12)', theme.scrimDeep]} style={StyleSheet.absoluteFill} />
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
  const { locale, dir } = useLocale();
  const visual = getAtlasVisual(dept.id);
  const [c1, c2] = accentColors(dept.accent);
  const name = pickName(locale, dept);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, styles.banner, pressed && styles.pressed]}>
      <ImageBackground source={{ uri: visual.uri }} style={styles.bannerBg} imageStyle={styles.bgImage}>
        <LinearGradient
          colors={[theme.scrimDeep, 'rgba(8,6,4,0.2)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.bannerCopy}>
          <IndexMark index={index} />
          <Text style={[styles.nameBig, dir === 'rtl' && styles.rtl]} numberOfLines={1}>
            {name}
          </Text>
          <LinearGradient
            colors={[c1, c2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.bar, styles.barBanner]}
          />
        </View>
        <View style={styles.heroArrow}>
          <AppIcon name="arrow-right" size={16} color={theme.pearl} />
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const GAP = 8;

const styles = StyleSheet.create({
  wrap: { gap: GAP },
  row: { flexDirection: 'row', gap: GAP },
  card: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: theme.canvasSoft,
  },
  pressed: { opacity: 0.94 },
  hero: { height: 200 },
  tile: { flex: 1, height: 148 },
  banner: { height: 100 },
  bg: { flex: 1, padding: 14, justifyContent: 'space-between' },
  bannerBg: {
    flex: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bgImage: { borderRadius: radii.lg },
  num: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.4,
    color: 'rgba(250,248,244,0.72)',
  },
  titleBlock: { gap: 2 },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    letterSpacing: -0.2,
    color: theme.pearl,
  },
  nameBig: {
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: -0.5,
    color: theme.pearl,
    marginTop: 4,
  },
  count: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(250,248,244,0.5)',
    marginTop: 2,
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  itemsHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(250,248,244,0.62)',
    marginTop: 4,
  },
  bar: { height: 2, borderRadius: 1, marginTop: 10, width: '100%', opacity: 0.9 },
  barBig: { width: 56 },
  barBanner: { width: 48, marginTop: 8 },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCopy: { flex: 1, paddingRight: 12 },
});
