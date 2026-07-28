import { Pressable, Text, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, radii } from '@/lib/theme';
import { type as typo } from '@/lib/ui';

type Variant = 'primary' | 'gold' | 'oasis' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  style?: ViewStyle;
  fullWidth?: boolean;
};

export function Button({
  label,
  onPress,
  disabled,
  loading,
  variant = 'gold',
  style,
  fullWidth,
}: Props) {
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';
  const colors =
    variant === 'oasis'
      ? ([theme.oasisDeep, theme.oasis] as const)
      : variant === 'primary'
        ? ([theme.ink, '#2a2420'] as const)
        : ([theme.duneBright, theme.dune] as const);

  if (isGhost || isDanger) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          styles.base,
          isGhost && styles.ghost,
          isDanger && styles.danger,
          fullWidth && styles.full,
          (disabled || loading) && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isDanger ? theme.flare : theme.dune} />
        ) : (
          <Text style={[styles.label, isGhost && styles.ghostLabel, isDanger && styles.dangerLabel]}>
            {label}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[fullWidth && styles.full, (disabled || loading) && styles.disabled, style]}
    >
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.base}>
        {loading ? (
          <ActivityIndicator color={theme.pearl} />
        ) : (
          <Text style={[styles.label, styles.onDark]}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radii.md,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { alignSelf: 'stretch' },
  ghost: {
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.borderStrong,
  },
  danger: {
    backgroundColor: 'rgba(196,92,58,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(196,92,58,0.35)',
  },
  label: { ...typo.button, color: theme.ink },
  onDark: { color: theme.pearl },
  ghostLabel: { color: theme.ink },
  dangerLabel: { color: theme.flare },
  disabled: { opacity: 0.45 },
});
