import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/components/AppIcon';
import { biometricMethodLabel, type BiometricKind } from '@/lib/biometrics';
import { useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts } from '@/lib/ui';

type Props = {
  biometricType: BiometricKind;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function BiometricSignInButton({ biometricType, loading, disabled, onPress }: Props) {
  const t = useT();
  if (!biometricType) return null;
  const method = biometricMethodLabel(biometricType, t);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('auth.signInWithBiometrics', { method })}
      style={[styles.btn, (loading || disabled) && styles.disabled]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      <View style={styles.icon}>
        <AppIcon name="unlock" size={20} color={theme.pearl} />
      </View>
      {loading ? (
        <ActivityIndicator color={theme.pearl} />
      ) : (
        <Text style={styles.label}>{t('auth.signInWithBiometrics', { method })}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.oasisDeep,
    borderRadius: radii.md,
    paddingVertical: 16,
    marginBottom: 16,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: fonts.bodyBold, fontSize: 16, color: theme.pearl },
  disabled: { opacity: 0.55 },
});
