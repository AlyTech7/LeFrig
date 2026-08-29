import { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/AppIcon';
import { useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts } from '@/lib/ui';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onPress?: () => void;
};

export function HomeSearchBar({ value, onChangeText, onSubmit, onPress }: Props) {
  const t = useT();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrap, focused && styles.wrapFocused]}>
      <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button">
        <AppIcon name="search" size={18} color={theme.inkSoft} />
      </Pressable>
      <TextInput
        style={styles.input}
        placeholder={t('home.searchPlaceholder')}
        placeholderTextColor={theme.inkSoft}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={10}>
          <AppIcon name="x" size={16} color={theme.inkMuted} />
        </Pressable>
      ) : (
        <Pressable style={styles.go} onPress={onSubmit} hitSlop={4}>
          <AppIcon name="arrow-right" size={15} color={theme.pearl} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    minHeight: 46,
    paddingHorizontal: 14,
    gap: 10,
    borderRadius: radii.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderStrong,
  },
  wrapFocused: {
    borderColor: theme.dune,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: theme.ink,
    paddingVertical: 10,
  },
  go: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.dune,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
