import { useMemo, useState } from 'react';
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
import { pickLabel, pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

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
  const [zone, setZone] = useState<TransportHubZone | 'all'>('all');
  const [search, setSearch] = useState('');

  // Local: solo wilaya+tindouf. Internacional: todas las zonas (un extremo puede ser local).
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
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={[styles.title, dir === 'rtl' && styles.rtl]}>{title}</Text>

        <View style={styles.searchWrap}>
          <AppIcon name="search" size={17} color={theme.inkMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('transport.searchHub')}
            placeholderTextColor={theme.inkSoft}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <AppIcon name="x" size={15} color={theme.inkMuted} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zoneTabs}>
          <Pressable
            style={[styles.zoneTab, zone === 'all' && styles.zoneTabOn]}
            onPress={() => setZone('all')}
          >
            <Text style={[styles.zoneTabText, zone === 'all' && styles.zoneTabTextOn]}>{t('common.all')}</Text>
          </Pressable>
          {scopeZones.map((z) => (
            <Pressable
              key={z.id}
              style={[styles.zoneTab, zone === z.id && styles.zoneTabOn]}
              onPress={() => setZone(z.id)}
            >
              <Text style={[styles.zoneTabText, zone === z.id && styles.zoneTabTextOn]}>
                {z.icon} {pickLabel(locale, z)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <FlatList
          data={hubs}
          keyExtractor={(h) => h.slug}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.empty}>{t('transport.noResults', { query: search })}</Text>
          }
          renderItem={({ item }) => {
            const selected = item.slug === selectedSlug;
            return (
              <Pressable
                style={[styles.hubRow, selected && styles.hubRowOn]}
                onPress={() => {
                  onSelect(item.slug);
                  onClose();
                }}
              >
                <Text style={styles.hubFlag}>{item.flag}</Text>
                <View style={styles.hubInfo}>
                  <Text style={[styles.hubName, selected && styles.hubNameOn, dir === 'rtl' && styles.rtl]}>
                    {pickName(locale, item)}
                  </Text>
                </View>
                {selected ? (
                  <View style={styles.hubCheck}>
                    <AppIcon name="check" size={13} color={theme.pearl} strokeWidth={3} />
                  </View>
                ) : (
                  <AppIcon name="chevron-right" size={16} color={theme.inkSoft} />
                )}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: theme.scrim },
  sheet: {
    backgroundColor: theme.canvas,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 20,
    height: '80%',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.borderStrong,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  title: { fontSize: 21, fontWeight: '800', color: theme.ink, marginBottom: 14 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
    minHeight: 48,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: theme.ink, fontWeight: '500' },
  zoneTabs: { gap: 8, paddingBottom: 12 },
  zoneTab: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  zoneTabOn: { backgroundColor: 'rgba(45,138,98,0.12)', borderColor: theme.oasisDeep },
  zoneTabText: { fontSize: 12.5, fontWeight: '600', color: theme.inkMuted },
  zoneTabTextOn: { color: theme.oasisDeep, fontWeight: '800' },
  list: { flex: 1 },
  empty: { textAlign: 'center', color: theme.inkMuted, marginTop: 30, fontSize: 14 },
  hubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    marginBottom: 4,
  },
  hubRowOn: { backgroundColor: 'rgba(45,138,98,0.08)' },
  hubFlag: { fontSize: 24 },
  hubInfo: { flex: 1 },
  hubName: { fontSize: 15, fontWeight: '700', color: theme.ink },
  hubNameOn: { color: theme.oasisDeep },
  hubCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.oasisDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
