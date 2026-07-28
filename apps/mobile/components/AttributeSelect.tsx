import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AttributeFieldOption } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { pickLabel } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';

type Props = {
  label: string;
  required?: boolean;
  value: string;
  options: AttributeFieldOption[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  onChange: (value: string) => void;
};

export function AttributeSelect({
  label,
  required,
  value,
  options,
  placeholder,
  disabled,
  searchable = false,
  onChange,
}: Props) {
  const t = useT();
  const { locale } = useLocale();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((o) => o.value === value);
  const display = selected ? pickLabel(locale, selected) : placeholder ?? t('attributes.choose');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const es = o.labelEs.toLowerCase();
      const ar = o.labelAr;
      return es.includes(q) || ar.includes(query.trim()) || o.value.toLowerCase().includes(q);
    });
  }, [options, query]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <Pressable
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={() => {
          if (disabled) return;
          setQuery('');
          setOpen(true);
        }}
        disabled={disabled}
        accessibilityRole="button"
      >
        <Text style={[styles.triggerText, !selected && styles.triggerPlaceholder]} numberOfLines={1}>
          {display}
        </Text>
        <AppIcon name="chevron-down" size={18} color={theme.inkMuted} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <AppIcon name="x" size={18} color={theme.inkMuted} />
              </Pressable>
            </View>

            {searchable ? (
              <View style={styles.searchWrap}>
                <AppIcon name="search" size={16} color={theme.inkSoft} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('common.search')}
                  placeholderTextColor={theme.inkSoft}
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                />
              </View>
            ) : null}

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              renderItem={({ item }) => {
                const on = item.value === value;
                return (
                  <Pressable
                    style={[styles.option, on && styles.optionOn]}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, on && styles.optionTextOn]}>
                      {pickLabel(locale, item)}
                    </Text>
                    {on ? <AppIcon name="check" size={18} color={theme.oasisDeep} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '700', color: theme.inkMuted, marginBottom: 6 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.surface,
    minHeight: 52,
  },
  triggerDisabled: { opacity: 0.6 },
  triggerText: { flex: 1, fontSize: 16, color: theme.ink, fontFamily: fonts.body },
  triggerPlaceholder: { color: theme.inkSoft },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(28, 24, 20, 0.35)' },
  sheet: {
    backgroundColor: theme.canvas,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '72%',
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.borderStrong,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: 12,
  },
  sheetTitle: { fontFamily: fonts.bodyBold, fontSize: 17, color: theme.ink },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: space.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    backgroundColor: theme.surface,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.ink,
    fontFamily: fonts.body,
  },
  list: { paddingHorizontal: space.lg },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  optionOn: {},
  optionText: { fontSize: 16, color: theme.ink, fontFamily: fonts.body },
  optionTextOn: { color: theme.oasisDeep, fontFamily: fonts.bodyBold },
});
