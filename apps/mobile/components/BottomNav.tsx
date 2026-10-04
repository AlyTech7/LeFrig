import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { AppIcon, type FeatherIconName } from '@/components/AppIcon';
import { SoftPressable } from '@/components/ui/SoftPressable';
import { useT } from '@/lib/locale';
import { elevation, pressScale } from '@/lib/motion';
import { theme } from '@/lib/theme';
import { fonts } from '@/lib/ui';

const FAB_SIZE = 56;
/** Cuánto sobresale la bolita por encima del borde superior de la barra. */
const FAB_LIFT = 26;

function useTabs() {
  const t = useT();
  return [
    { href: '/', icon: 'home' as FeatherIconName, label: t('nav.home') },
    { href: '/marketplace', icon: 'grid' as FeatherIconName, label: t('nav.marketplace') },
    { href: '/marketplace/create', icon: 'plus' as FeatherIconName, label: t('nav.sell'), center: true },
    { href: '/transport', icon: 'truck' as FeatherIconName, label: t('nav.transport') },
    { href: '/messages', icon: 'message-circle' as FeatherIconName, label: t('nav.chat') },
  ];
}

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const tabs = useTabs();
  const bottomPad = Math.max(insets.bottom, 14);

  return (
    <View style={[styles.wrap, { paddingBottom: bottomPad }]} pointerEvents="box-none">
      {/* Fondo solo en la franja de tabs: no recorta la bolita que sobresale */}
      <View style={[styles.bg, { top: FAB_LIFT }]} pointerEvents="none">
        {Platform.OS === 'ios' ? (
          <BlurView intensity={72} tint="light" style={StyleSheet.absoluteFill} />
        ) : null}
        <View
          style={[
            styles.bgFill,
            Platform.OS === 'ios' ? styles.bgFillIos : styles.bgFillAndroid,
          ]}
        />
      </View>

      <View style={[styles.barInner, { paddingTop: FAB_LIFT + 6 }]}>
        {tabs.map((tab) => {
          const active =
            tab.href === '/marketplace/create'
              ? pathname === '/marketplace/create'
              : tab.href === '/'
                ? pathname === '/'
                : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          if (tab.center) {
            return (
              <SoftPressable
                key={tab.href}
                onPress={() => router.push(tab.href as never)}
                style={styles.fabWrap}
                scaleTo={pressScale.fab}
                haptic="medium"
              >
                <LinearGradient
                  colors={[theme.duneBright, theme.dune]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.fab, elevation.fab]}
                >
                  <AppIcon name={tab.icon} size={26} color={theme.pearl} strokeWidth={2.25} />
                </LinearGradient>
                <Text style={styles.fabLabel}>{tab.label}</Text>
              </SoftPressable>
            );
          }

          return (
            <SoftPressable
              key={tab.href}
              onPress={() => router.push(tab.href as never)}
              style={styles.tab}
              scaleTo={pressScale.chip}
              haptic="selection"
            >
              <View style={[styles.iconSlot, active && styles.iconSlotActive]}>
                <AppIcon
                  name={tab.icon}
                  size={20}
                  color={active ? theme.dune : theme.inkSoft}
                  strokeWidth={active ? 2.1 : 1.75}
                />
              </View>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </SoftPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'visible',
    zIndex: 40,
    ...elevation.bar,
  },
  bg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
  },
  bgFill: {
    ...StyleSheet.absoluteFillObject,
  },
  bgFillIos: {
    backgroundColor: 'rgba(250,248,244,0.55)',
  },
  bgFillAndroid: {
    backgroundColor: theme.surface,
  },
  barInner: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    alignItems: 'flex-end',
    zIndex: 1,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  iconSlot: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlotActive: { backgroundColor: 'rgba(168,132,45,0.12)' },
  tabLabel: {
    fontSize: 10,
    fontFamily: fonts.bodySemi,
    color: theme.inkSoft,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  tabLabelActive: { color: theme.dune, fontFamily: fonts.bodyBold },
  fabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -FAB_LIFT,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.surface,
  },
  fabLabel: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    color: theme.dune,
    marginTop: 4,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
});
