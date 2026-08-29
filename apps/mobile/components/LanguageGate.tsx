import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useLocale } from '@/lib/locale';
import { theme } from '@/lib/theme';

/**
 * Primera apertura → /onboarding (elegir idioma).
 * Si ya eligió y entra a onboarding → vuelve a inicio.
 */
export function LanguageGate({ children }: { children: React.ReactNode }) {
  const { ready, hasChosenLocale } = useLocale();
  const segments = useSegments();
  const router = useRouter();
  const onOnboarding = segments[0] === 'onboarding';

  useEffect(() => {
    if (!ready) return;

    if (!hasChosenLocale && !onOnboarding) {
      router.replace('/onboarding');
      return;
    }

    if (hasChosenLocale && onOnboarding) {
      router.replace('/');
    }
  }, [ready, hasChosenLocale, onOnboarding, router]);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={theme.dune} size="large" />
      </View>
    );
  }

  if (!hasChosenLocale && !onOnboarding) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={theme.dune} size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.canvas },
});
