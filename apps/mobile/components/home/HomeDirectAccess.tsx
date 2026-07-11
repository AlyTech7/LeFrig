import { useMemo, useState } from 'react';
import type { Href } from 'expo-router';
import { View, Text, StyleSheet, Pressable, ScrollView, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MARKETPLACE_DEPARTMENTS,
  getMarketplaceItemHref,
  type MarketplaceDepartment,
  type MarketplaceItem,
} from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { pickName } from '@/lib/bilingual';
import { getAtlasVisual, getCategoryVisual } from '@/lib/home-visuals';
import { useLocale, useT } from '@/lib/locale';
import { hrefFromWeb } from '@/lib/mobile-nav';
import { theme, radii } from '@/lib/theme';

const PULSE_SLUGS = ['mobiles', 'cars', 'food', 'solar', 'camels', 'job-vacancies'] as const;
const DEFAULT_DEPT = 'vehicles';
const GRID_CAP = 8;

function allItems() {
  return MARKETPLACE_DEPARTMENTS.flatMap((d) => d.items);
}

function itemBySlug(slug: string) {
  return allItems().find((i) => i.slug === slug);
}

function navHref(item: MarketplaceItem): Href {
  const href = getMarketplaceItemHref(item);
  if (item.kind === 'listing') return hrefFromWeb(href.split('#')[0]!);
  return hrefFromWeb(href);
}

function deptHref(dept: MarketplaceDepartment): Href {
  if (dept.id === 'services-shops') return '/services';
  const first = dept.items[0];
  if (!first) return '/marketplace';
  const href = getMarketplaceItemHref(first);
  if (first.kind === 'listing') return hrefFromWeb(href.split('#')[0]!);
  return hrefFromWeb(href);
}

function accentSolid(accent: string): string {
  return accent.match(/#[0-9a-f]{6}/i)?.[0] ?? '#c9a84c';
}

type Props = { onNavigate: (href: Href) => void };

function PulseChip({
  item,
  rank,
  onNavigate,
}: {
  item: MarketplaceItem;
  rank: number;
  onNavigate: (href: Href) => void;
}) {
  const { locale, dir } = useLocale();
  const dept = MARKETPLACE_DEPARTMENTS.find((d) => d.items.some((i) => i.slug === item.slug));
  const visual = getCategoryVisual(item.slug, dept?.id);

  return (
    <Pressable style={({ pressed }) => [styles.pulse, pressed && styles.pressed]} onPress={() => onNavigate(navHref(item))}>
      <ImageBackground source={{ uri: visual.uri }} style={styles.pulseBg} imageStyle={styles.pulseBgImage}>
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.15)', theme.scrimDeep]} style={StyleSheet.absoluteFill} />
        <View style={styles.pulseTopLine} />
        <Text style={styles.pulseRank}>{String(rank).padStart(2, '0')}</Text>
        <Text style={[styles.pulseName, dir === 'rtl' && styles.rtl]} numberOfLines={2}>
          {pickName(locale, item)}
        </Text>
      </ImageBackground>
    </Pressable>
  );
}

function GridCell({
  item,
  deptId,
  onNavigate,
}: {
  item: MarketplaceItem;
  deptId: string;
  onNavigate: (href: Href) => void;
}) {
  const { locale, dir } = useLocale();
  const visual = getCategoryVisual(item.slug, deptId);

  return (
    <Pressable style={({ pressed }) => [styles.cell, pressed && styles.pressed]} onPress={() => onNavigate(navHref(item))}>
      <ImageBackground source={{ uri: visual.uri }} style={styles.cellBg} imageStyle={styles.cellBgImage}>
        <LinearGradient colors={['rgba(0,0,0,0.1)', theme.scrimDeep]} style={StyleSheet.absoluteFill} />
        <Text style={styles.cellIco}>{item.icon}</Text>
        <Text style={[styles.cellName, dir === 'rtl' && styles.rtl]} numberOfLines={2}>
          {pickName(locale, item)}
        </Text>
      </ImageBackground>
    </Pressable>
  );
}

export function HomeDirectAccess({ onNavigate }: Props) {
  const { locale, dir } = useLocale();
  const t = useT();
  const [activeDeptId, setActiveDeptId] = useState(DEFAULT_DEPT);

  const pulseSet = useMemo(() => new Set<string>(PULSE_SLUGS), []);
  const pulseItems = PULSE_SLUGS.map((s) => itemBySlug(s)).filter(Boolean) as MarketplaceItem[];

  const activeDept = MARKETPLACE_DEPARTMENTS.find((d) => d.id === activeDeptId) ?? MARKETPLACE_DEPARTMENTS[0]!;
  const deckVisual = getAtlasVisual(activeDept.id);
  const gridItems = useMemo(() => {
    return activeDept.items.filter((i) => !pulseSet.has(i.slug)).slice(0, GRID_CAP);
  }, [activeDept, pulseSet]);

  const hiddenCount = activeDept.items.filter((i) => !pulseSet.has(i.slug)).length - gridItems.length;
  const isServices = activeDept.id === 'services-shops';
  const showMore = hiddenCount > 0 || isServices;
  const activeAccent = accentSolid(activeDept.accent);

  return (
    <View style={styles.shell}>
      <View style={styles.rim} />
      <View style={styles.head}>
        <View style={styles.kicker}>
          <View style={styles.kickerDot} />
          <Text style={styles.kickerText}>{t('home.bazaarKicker')}</Text>
        </View>
        <Text style={[styles.title, dir === 'rtl' && styles.rtl]}>{t('home.consoleTitle')}</Text>
        <Text style={[styles.sub, dir === 'rtl' && styles.rtl]}>{t('home.consoleSub')}</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.pulseBand}>
          <View style={styles.pulseLabel}>
            <AppIcon name="zap" size={12} color="#f0cc7a" />
            <Text style={styles.pulseLabelText}>{t('home.pulseLabel')}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pulseRow}>
            {pulseItems.map((item, i) => (
              <PulseChip key={item.slug} item={item} rank={i + 1} onNavigate={onNavigate} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.deck}>
          <ImageBackground
            key={activeDeptId}
            source={{ uri: deckVisual.uri }}
            style={StyleSheet.absoluteFill}
            imageStyle={styles.deckImage}
          >
            <LinearGradient
              colors={['rgba(8,6,4,0.92)', 'rgba(8,6,4,0.78)', 'rgba(8,6,4,0.88)']}
              style={StyleSheet.absoluteFill}
            />
          </ImageBackground>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {MARKETPLACE_DEPARTMENTS.map((dept) => {
              const active = dept.id === activeDeptId;
              const hue = accentSolid(dept.accent);
              return (
                <Pressable
                  key={dept.id}
                  style={[styles.tab, active && styles.tabActive, active && { borderColor: hue }]}
                  onPress={() => setActiveDeptId(dept.id)}
                >
                  {active ? <View style={[styles.tabMark, { backgroundColor: hue }]} /> : null}
                  <Text style={styles.tabIco}>{dept.icon}</Text>
                  <Text style={[styles.tabName, active && styles.tabNameActive, dir === 'rtl' && styles.rtl]} numberOfLines={1}>
                    {pickName(locale, dept)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.stage}>
            <View style={styles.stageHead}>
              <View style={styles.stageTitle}>
                <View style={[styles.stageIcoWrap, { borderColor: `${activeAccent}55` }]}>
                  <Text style={styles.stageIco}>{activeDept.icon}</Text>
                </View>
                <View style={styles.stageCopy}>
                  <Text style={[styles.stageName, dir === 'rtl' && styles.rtl]} numberOfLines={1}>
                    {pickName(locale, activeDept)}
                  </Text>
                  <Text style={styles.stageCount}>{t('atlas.vaultOptions', { count: activeDept.items.length })}</Text>
                </View>
              </View>
              <Pressable style={styles.stageLink} onPress={() => onNavigate(deptHref(activeDept))}>
                <Text style={styles.stageLinkText}>{t('home.viewDept')}</Text>
                <AppIcon name="arrow-up-right" size={12} color={theme.pearl} />
              </Pressable>
            </View>

            {gridItems.length > 0 ? (
              <View style={styles.grid}>
                {gridItems.map((item) => (
                  <GridCell key={item.slug} item={item} deptId={activeDept.id} onNavigate={onNavigate} />
                ))}
              </View>
            ) : (
              <Text style={[styles.empty, dir === 'rtl' && styles.rtl]}>{t('home.consoleEmpty')}</Text>
            )}
          </View>

          <View style={[styles.foot, !showMore && styles.footSolo]}>
            {showMore ? (
              <Pressable style={styles.more} onPress={() => onNavigate(isServices ? '/services' : deptHref(activeDept))}>
                <AppIcon name="package" size={14} color={theme.pearl} />
                <Text style={[styles.moreText, dir === 'rtl' && styles.rtl]}>
                  {isServices ? t('home.moreServicesFull') : t('home.moreInDept', { count: hiddenCount })}
                </Text>
              </Pressable>
            ) : null}
            <Pressable style={({ pressed }) => [styles.cta, !showMore && styles.ctaSolo, pressed && styles.pressed]} onPress={() => onNavigate('/marketplace')}>
              <LinearGradient colors={['#f5d080', '#e8b86d', '#c9a84c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <Text style={styles.ctaText}>{t('home.allListings')}</Text>
              <AppIcon name="arrow-right" size={16} color={theme.ink} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    marginBottom: 20,
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(168,132,45,0.22)',
    overflow: 'hidden',
  },
  rim: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 3,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: theme.duneBright,
  },
  head: { marginBottom: 12 },
  kicker: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(168,132,45,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(168,132,45,0.24)',
    marginBottom: 8,
  },
  kickerDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.oasis },
  kickerText: { fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: '#8a6b2e' },
  title: { fontSize: 22, fontWeight: '900', color: theme.ink, letterSpacing: -0.5, lineHeight: 26 },
  sub: { fontSize: 12, fontWeight: '500', color: theme.inkMuted, marginTop: 4, lineHeight: 17 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  panel: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#14110e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pulseBand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  pulseLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.28)',
  },
  pulseLabelText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', color: '#f0cc7a' },
  pulseRow: { gap: 8 },
  pulse: {
    width: 108,
    height: 66,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  pulseBg: { flex: 1, paddingHorizontal: 8, paddingBottom: 8, paddingTop: 22, justifyContent: 'flex-end' },
  pulseBgImage: { borderRadius: 12 },
  pulseTopLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: theme.duneBright },
  pulseRank: {
    position: 'absolute',
    top: 6,
    left: 7,
    fontSize: 9,
    fontWeight: '800',
    color: '#f0cc7a',
  },
  pulseName: { fontSize: 10, fontWeight: '800', color: theme.pearl, lineHeight: 12 },
  deck: { overflow: 'hidden' },
  deckImage: { borderRadius: 0 },
  tabs: { gap: 6, paddingHorizontal: 10, paddingTop: 10, paddingBottom: 6 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.96)', borderColor: 'rgba(255,255,255,0.42)' },
  tabMark: { width: 6, height: 6, borderRadius: 3 },
  tabIco: { fontSize: 12 },
  tabName: { fontSize: 11, fontWeight: '700', color: 'rgba(250,248,244,0.85)', maxWidth: 90 },
  tabNameActive: { color: theme.ink },
  stage: { paddingHorizontal: 10, paddingBottom: 8 },
  stageHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
  stageTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  stageIcoWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  stageIco: { fontSize: 14 },
  stageCopy: { flex: 1, minWidth: 0 },
  stageName: { fontSize: 15, fontWeight: '800', color: theme.pearl },
  stageCount: { fontSize: 9, fontWeight: '700', color: 'rgba(250,248,244,0.5)', textTransform: 'uppercase', marginTop: 2 },
  stageLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  stageLinkText: { fontSize: 10, fontWeight: '800', color: theme.pearl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: {
    width: '31%',
    aspectRatio: 1.15,
    minHeight: 70,
    borderRadius: 11,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cellBg: { flex: 1, padding: 6, justifyContent: 'flex-end' },
  cellBgImage: { borderRadius: 11 },
  cellIco: { fontSize: 12 },
  cellName: { fontSize: 9, fontWeight: '800', color: theme.pearl, lineHeight: 11 },
  empty: { fontSize: 12, color: 'rgba(250,248,244,0.62)', lineHeight: 17, marginBottom: 4 },
  foot: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  moreText: { fontSize: 10, fontWeight: '800', color: theme.pearl, flexShrink: 1 },
  footSolo: { justifyContent: 'center' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginLeft: 'auto',
  },
  ctaSolo: { flex: 1, alignSelf: 'stretch', marginLeft: 0 },
  ctaText: { fontSize: 12, fontWeight: '800', color: theme.ink },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
