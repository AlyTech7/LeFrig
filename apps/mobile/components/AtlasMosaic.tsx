import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { MarketplaceDepartment } from '@lefrig/shared';
import { accentColors, getAtlasVisual } from '@/lib/home-visuals';
import { AppIcon } from '@/components/AppIcon';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

type Props = {
  departments: MarketplaceDepartment[];
  onPressDept: (id: string) => void;
};

/**
 * Mosaico "bento" del Atlas — 10 salas en un patrón editorial:
 * héroe · pareja · pareja · banner panorámico · pareja · pareja
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

function CardChrome({ dept, index }: { dept: MarketplaceDepartment; index: number }) {
  const num = String(index + 1).padStart(2, '0');
  return (
    <View style={styles.chromeHeader}>
      <Text style={styles.num}>{num}</Text>
      <Text style={styles.emoji}>{dept.icon}</Text>
    </View>
  );
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
        <LinearGradient colors={['rgba(0,0,0,0.05)', theme.scrimDeep]} style={StyleSheet.absoluteFill} />
        <CardChrome dept={dept} index={index} />
        <View style={styles.heroFooter}>
          <CardTitle dept={dept} big itemsHint />
          <View style={styles.heroArrow}>
            <AppIcon name="arrow-right" size={18} color={theme.pearl} />
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
        <LinearGradient colors={['rgba(0,0,0,0.08)', theme.scrimDeep]} style={StyleSheet.absoluteFill} />
        <CardChrome dept={dept} index={index} />
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
  const num = String(index + 1).padStart(2, '0');
  const [c1, c2] = accentColors(dept.accent);
  const name = pickName(locale, dept);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, styles.banner, pressed && styles.pressed]}>
      <ImageBackground source={{ uri: visual.uri }} style={styles.bannerBg} imageStyle={styles.bgImage}>
        <LinearGradient
          colors={[theme.scrimDeep, 'rgba(0,0,0,0.15)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.bannerCopy}>
          <View style={styles.bannerMeta}>
            <Text style={styles.num}>{num}</Text>
            <Text style={styles.bannerEmoji}>{dept.icon}</Text>
          </View>
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
          <AppIcon name="arrow-right" size={18} color={theme.pearl} />
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const GAP = 10;

const styles = StyleSheet.create({
  wrap: { gap: GAP },
  row: { flexDirection: 'row', gap: GAP },
  card: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: theme.canvasSoft,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  hero: { height: 190 },
  tile: { flex: 1, height: 150 },
  banner: { height: 104 },
  bg: { flex: 1, padding: 14, justifyContent: 'space-between' },
  bannerBg: {
    flex: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bgImage: { borderRadius: radii.lg },
  chromeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  num: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.pearl,
    letterSpacing: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  emoji: { fontSize: 20 },
  bannerEmoji: { fontSize: 18 },
  bannerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  titleBlock: { gap: 2 },
  name: { fontSize: 16, fontWeight: '800', color: theme.pearl },
  nameBig: { fontSize: 20, fontWeight: '800', color: theme.pearl },
  count: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(250,248,244,0.55)',
    marginTop: 2,
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  itemsHint: { fontSize: 11, color: 'rgba(250,248,244,0.65)', marginTop: 3 },
  bar: { height: 3, borderRadius: 2, marginTop: 8, width: '100%' },
  barBig: { width: 120 },
  barBanner: { width: 96, marginTop: 6 },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCopy: { flex: 1, paddingRight: 12 },
});
