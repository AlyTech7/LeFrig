import { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '@/components/AppIcon';
import { useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

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
    <Pressable
      style={[styles.wrap, focused && styles.wrapFocused]}
      onPress={onPress}
    >
      <View style={styles.iconBubble}>
        <AppIcon name="search" size={17} color={theme.dune} />
      </View>
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
        <Pressable style={styles.clearBtn} onPress={() => onChangeText('')} hitSlop={8}>
          <AppIcon name="x" size={15} color={theme.inkMuted} />
        </Pressable>
      ) : (
        <Pressable style={styles.submitBtn} onPress={onSubmit}>
          <LinearGradient
            colors={['#f0cc7a', '#c9a84c', '#a8842d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <AppIcon name="arrow-right" size={16} color={theme.ink} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 14,
    minHeight: 52,
    paddingLeft: 8,
    paddingRight: 6,
    gap: 8,
    borderRadius: radii.pill,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(168,132,45,0.18)',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 3,
  },
  wrapFocused: {
    borderColor: 'rgba(168,132,45,0.42)',
    shadowColor: theme.dune,
    shadowOpacity: 0.22,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201,168,76,0.12)',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.ink,
    minHeight: 44,
    fontWeight: '500',
  },
  submitBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26,22,18,0.05)',
  },
});
