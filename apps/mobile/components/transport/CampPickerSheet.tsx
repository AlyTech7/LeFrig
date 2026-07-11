import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import type { CampSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

type Props = {
  visible: boolean;
  title: string;
  camps: CampSummary[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function CampPickerSheet({ visible, title, camps, selectedId, onSelect, onClose }: Props) {
  const t = useT();
  const { locale, dir } = useLocale();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return camps;
    return camps.filter(
      (c) =>
        c.nameEs.toLowerCase().includes(q) ||
        c.nameAr.includes(search.trim()) ||
        c.slug.includes(q),
    );
  }, [camps, search]);

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
            placeholder={t('transport.searchCamp')}
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

        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.empty}>{t('transport.noResults', { query: search })}</Text>
          }
          renderItem={({ item }) => {
            const selected = item.id === selectedId;
            return (
              <Pressable
                style={[styles.row, selected && styles.rowOn]}
                onPress={() => {
                  onSelect(item.id);
                  onClose();
                }}
              >
                <View style={styles.rowInfo}>
                  <Text style={[styles.rowName, selected && styles.rowNameOn, dir === 'rtl' && styles.rtl]}>
                    {pickName(locale, item)}
                  </Text>
                </View>
                {selected ? (
                  <View style={styles.check}>
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
    height: '72%',
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
  list: { flex: 1 },
  empty: { textAlign: 'center', color: theme.inkMuted, marginTop: 30, fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    marginBottom: 4,
  },
  rowOn: { backgroundColor: 'rgba(45,138,98,0.08)' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '700', color: theme.ink },
  rowNameOn: { color: theme.oasisDeep },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.oasisDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
