import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  MARKETPLACE_DEPARTMENTS,
  getMarketplaceItemHref,
  type MarketplaceItem,
} from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { AtlasTile } from '@/components/AtlasTile';
import { accentColors, getAtlasVisual } from '@/lib/home-visuals';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { hrefFromWeb } from '@/lib/mobile-nav';
import { theme, radii } from '@/lib/theme';
import { fonts } from '@/lib/ui';

const SERVICES_GROUPS = [
  { key: 'shops', labelKey: 'atlas.groups.shops', slugs: ['shops', 'shops-register', 'services-all'] },
  {
    key: 'essentials',
    labelKey: 'atlas.groups.essentials',
    slugs: ['construction', 'generators', 'agua-potable', 'air-conditioners', 'maintenance-services', 'pest-control', 'plumbing'],
  },
  {
    key: 'pros',
    labelKey: 'atlas.groups.pros',
    slugs: ['electrician', 'mechanic', 'henna', 'classes', 'education', 'furniture-moving', 'hairdressing', 'phone_repair'],
  },
] as const;

function itemHref(item: MarketplaceItem) {
  const base = getMarketplaceItemHref(item);
  return item.kind === 'listing' ? `${base.split('#')[0]}` : base;
}

export default function AtlasDepartmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { locale, dir } = useLocale();

  const dept = useMemo(
    () => MARKETPLACE_DEPARTMENTS.find((d) => d.id === id) ?? MARKETPLACE_DEPARTMENTS[0],
    [id],
  );

  const deptIndex = MARKETPLACE_DEPARTMENTS.findIndex((d) => d.id === dept.id);
  const visual = getAtlasVisual(dept.id);
  const [c1, c2] = accentColors(dept.accent);
  const isServices = dept.id === 'services-shops';
  const deptName = pickName(locale, dept);

  const bySlug = useMemo(() => new Map(dept.items.map((i) => [i.slug, i])), [dept.items]);

  return (
    <View style={styles.root}>
      <ImageBackground source={{ uri: visual.uri }} style={styles.hero}>
        <LinearGradient colors={['rgba(0,0,0,0.15)', theme.scrimDeep]} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['top']}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <AppIcon name="arrow-left" size={20} color={theme.pearl} />
          </Pressable>
          <Text style={styles.heroNum}>{String(deptIndex + 1).padStart(2, '0')}</Text>
          <Text style={[styles.heroName, dir === 'rtl' && styles.rtl]}>{deptName}</Text>
          <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.heroBar} />
        </SafeAreaView>
      </ImageBackground>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isServices ? (
          SERVICES_GROUPS.map((group) => {
            const items = group.slugs.map((s) => bySlug.get(s)).filter(Boolean) as MarketplaceItem[];
            if (!items.length) return null;
            return (
              <View key={group.key} style={styles.group}>
                <Text style={[styles.groupTitle, dir === 'rtl' && styles.rtl]}>{t(group.labelKey)}</Text>
                {items.map((item) => (
                  <Pressable
                    key={item.slug}
                    style={({ pressed }) => [styles.itemRow, pressed && styles.itemPressed]}
                    onPress={() => router.push(hrefFromWeb(itemHref(item)))}
                  >
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    <View style={styles.itemCopy}>
                      <Text style={[styles.itemName, dir === 'rtl' && styles.rtl]}>{pickName(locale, item)}</Text>
                    </View>
                    <AppIcon name="chevron-right" size={18} color={theme.inkSoft} />
                  </Pressable>
                ))}
              </View>
            );
          })
        ) : (
          dept.items.map((item) => (
            <Pressable
              key={item.slug}
              style={({ pressed }) => [styles.itemRow, pressed && styles.itemPressed]}
              onPress={() => router.push(hrefFromWeb(itemHref(item)))}
            >
              <Text style={styles.itemIcon}>{item.icon}</Text>
              <View style={styles.itemCopy}>
                <Text style={[styles.itemName, dir === 'rtl' && styles.rtl]}>{pickName(locale, item)}</Text>
              </View>
              <AppIcon name="chevron-right" size={18} color={theme.inkSoft} />
            </Pressable>
          ))
        )}

        <View style={styles.allHeader}>
          <Text style={styles.allTitle}>{t('atlas.allRooms')}</Text>
          <View style={styles.allRule} />
        </View>
        <View style={styles.allGrid}>
          {MARKETPLACE_DEPARTMENTS.map((d, i) => (
            <View key={d.id} style={styles.allTile}>
              <AtlasTile
                dept={d}
                index={i}
                compact
                active={d.id === dept.id}
                onPress={() => {
                  if (d.id === dept.id) return;
                  router.replace(`/atlas/${d.id}` as never);
                }}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  hero: { height: 220, paddingHorizontal: 20, justifyContent: 'flex-end', paddingBottom: 20 },
  back: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroNum: { fontSize: 12, fontWeight: '800', color: 'rgba(250,248,244,0.7)', letterSpacing: 2 },
  heroName: { fontSize: 32, fontWeight: '800', color: theme.pearl },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  heroBar: { height: 4, borderRadius: 2, marginTop: 12, width: 80 },
  scroll: { padding: 20, paddingBottom: 100 },
  group: { marginBottom: 20 },
  groupTitle: { fontSize: 18, fontWeight: '800', color: theme.ink, marginBottom: 10 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.surface,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  itemPressed: { opacity: 0.92 },
  itemIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  itemCopy: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '700', color: theme.ink },
  allHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    marginBottom: 16,
  },
  allTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.dune,
  },
  allRule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.borderStrong },
  allGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 18,
  },
  allTile: { width: '47.5%' },
});
