import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon, type FeatherIconName } from '@/components/AppIcon';
import { useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

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

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.barInner}>
        {tabs.map((tab) => {
          const active =
            tab.href === '/marketplace/create'
              ? pathname === '/marketplace/create'
              : tab.href === '/'
                ? pathname === '/'
                : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          if (tab.center) {
            return (
              <Pressable
                key={tab.href}
                onPress={() => router.push(tab.href as never)}
                style={styles.fabWrap}
              >
                <LinearGradient
                  colors={[theme.duneBright, theme.dune]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.fab}
                >
                  <AppIcon name={tab.icon} size={26} color={theme.pearl} strokeWidth={2.25} />
                </LinearGradient>
                <Text style={styles.fabLabel}>{tab.label}</Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={tab.href}
              onPress={() => router.push(tab.href as never)}
              style={styles.tab}
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
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
  },
  barInner: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 6,
    alignItems: 'flex-end',
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
    color: theme.inkSoft,
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabLabelActive: { color: theme.dune, fontWeight: '800' },
  fabWrap: { flex: 1, alignItems: 'center', marginTop: -28 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.surface,
    shadowColor: theme.dune,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  fabLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.dune,
    marginTop: 4,
    letterSpacing: 0.2,
  },
});
