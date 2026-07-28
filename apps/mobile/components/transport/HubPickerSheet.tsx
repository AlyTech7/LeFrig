import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TRANSPORT_HUBS,
  TRANSPORT_HUB_ZONES,
  hubsInScope,
  hubsInZone,
  zonesForScope,
  type TransportHub,
  type TransportHubZone,
  type TransportRouteScope,
} from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { CountryFlag } from '@/components/CountryFlag';
import { pickLabel, pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';

type Props = {
  visible: boolean;
  title: string;
  scope: TransportRouteScope;
  selectedSlug: string;
  onSelect: (slug: string) => void;
  onClose: () => void;
};

export function HubPickerSheet({ visible, title, scope, selectedSlug, onSelect, onClose }: Props) {
  const t = useT();
  const { locale, dir } = useLocale();
  const insets = useSafeAreaInsets();
  const [zone, setZone] = useState<TransportHubZone | 'all'>('all');
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setZone('all');
    setSearch('');
    setFocused(false);
  }, [visible, scope]);

  const scopeZones = useMemo(
    () => (scope === 'local' ? zonesForScope('local') : TRANSPORT_HUB_ZONES),
    [scope],
  );

  const hubs: TransportHub[] = useMemo(() => {
    const pool = scope === 'local' ? hubsInScope('local') : TRANSPORT_HUBS;
    const base = zone === 'all' ? pool : hubsInZone(zone).filter((h) => pool.some((p) => p.slug === h.slug));
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (h) => h.nameEs.toLowerCase().includes(q) || h.nameAr.includes(search.trim()) || h.slug.includes(q),
    );
  }, [zone, search, scope]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={[styles.title, dir === 'rtl' && styles.rtl]} accessibilityRole="header">
              {title}
            </Text>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <AppIcon name="x" size={18} color={theme.inkMuted} />
            </Pressable>
          </View>

          <View style={[styles.searchWrap, focused && styles.searchFocused]}>
            <AppIcon name="search" size={17} color={theme.inkSoft} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('transport.searchHub')}
              placeholderTextColor={theme.inkSoft}
              value={search}
              onChangeText={setSearch}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            {search ? (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <AppIcon name="x" size={15} color={theme.inkMuted} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.zoneWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.zoneRow}
            >
              <Pressable onPress={() => setZone('all')} style={styles.zoneTab}>
                <Text style={[styles.zoneText, zone === 'all' && styles.zoneTextOn]} numberOfLines={1}>
                  {t('common.all')}
                </Text>
                {zone === 'all' ? <View style={styles.zoneRule} /> : <View style={styles.zoneRuleGhost} />}
              </Pressable>
              {scopeZones.map((z) => {
                const on = zone === z.id;
                return (
                  <Pressable key={z.id} onPress={() => setZone(z.id)} style={styles.zoneTab}>
                    <Text style={[styles.zoneText, on && styles.zoneTextOn]} numberOfLines={1}>
                      {pickLabel(locale, z)}
                    </Text>
                    {on ? <View style={styles.zoneRule} /> : <View style={styles.zoneRuleGhost} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <FlatList
            data={hubs}
            keyExtractor={(h) => h.slug}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.empty}>{t('transport.noResults', { query: search })}</Text>
            }
            renderItem={({ item, index }) => {
              const selected = item.slug === selectedSlug;
              return (
                <Pressable
                  style={[styles.hubRow, index === 0 && styles.hubRowFirst, selected && styles.hubRowOn]}
                  onPress={() => {
                    onSelect(item.slug);
                    onClose();
                  }}
                >
                  <CountryFlag country={item.country} size={18} />
                  <Text
                    style={[styles.hubName, selected && styles.hubNameOn, dir === 'rtl' && styles.rtl]}
                    numberOfLines={1}
                  >
                    {pickName(locale, item)}
                  </Text>
                  {selected ? (
                    <AppIcon name="check" size={16} color={theme.dune} strokeWidth={2.5} />
                  ) : (
                    <AppIcon name="chevron-right" size={16} color={theme.inkSoft} />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.scrim },
  sheet: {
    backgroundColor: theme.canvas,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: space.lg,
    height: '78%',
    zIndex: 1,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.borderStrong,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -0.5,
    color: theme.ink,
    lineHeight: 28,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    paddingHorizontal: 14,
    minHeight: 48,
    marginBottom: 10,
  },
  searchFocused: { borderColor: theme.dune },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: theme.ink,
    paddingVertical: 10,
  },
  zoneWrap: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 4,
  },
  zoneRow: {
    gap: 18,
    paddingVertical: 2,
    alignItems: 'center',
  },
  zoneTab: {
    flexShrink: 0,
  },
  zoneText: {
    fontFamily: fonts.bodyMed,
    fontSize: 13,
    color: theme.inkSoft,
  },
  zoneTextOn: {
    fontFamily: fonts.bodyBold,
    color: theme.ink,
  },
  zoneRule: {
    height: 2,
    backgroundColor: theme.dune,
    marginTop: 6,
    borderRadius: 1,
  },
  zoneRuleGhost: { height: 2, marginTop: 6 },
  list: { flex: 1, marginTop: 4 },
  empty: {
    textAlign: 'center',
    fontFamily: fonts.body,
    color: theme.inkMuted,
    marginTop: 36,
    fontSize: 14,
  },
  hubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  hubRowFirst: { borderTopColor: theme.borderStrong },
  hubRowOn: { backgroundColor: 'transparent' },
  hubName: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: theme.ink,
  },
  hubNameOn: { color: theme.dune, fontFamily: fonts.bodyBold },
});
