import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CampSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';

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
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSearch('');
    setFocused(false);
  }, [visible]);

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
              placeholder={t('transport.searchCamp')}
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

          <FlatList
            data={filtered}
            keyExtractor={(c) => c.id}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.empty}>{t('transport.noResults', { query: search })}</Text>
            }
            renderItem={({ item, index }) => {
              const selected = item.id === selectedId;
              return (
                <Pressable
                  style={[styles.row, index === 0 && styles.rowFirst]}
                  onPress={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                >
                  <Text
                    style={[styles.rowName, selected && styles.rowNameOn, dir === 'rtl' && styles.rtl]}
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
    height: '72%',
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
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 26,
    letterSpacing: -0.6,
    color: theme.ink,
    lineHeight: 30,
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
    marginBottom: 12,
  },
  searchFocused: { borderColor: theme.dune },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: theme.ink,
    paddingVertical: 10,
  },
  list: { flex: 1 },
  empty: {
    textAlign: 'center',
    fontFamily: fonts.body,
    color: theme.inkMuted,
    marginTop: 36,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  rowFirst: { borderTopColor: theme.borderStrong },
  rowName: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: theme.ink,
  },
  rowNameOn: { color: theme.dune, fontFamily: fonts.bodyBold },
});
