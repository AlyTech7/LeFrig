import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { theme } from '@/lib/theme';
import { fonts } from '@/lib/ui';

/** Destino OAuth (lefrig://sso-callback o http://localhost:8082/sso-callback). */
export default function SSOCallbackScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    router.replace(isSignedIn ? '/' : '/sign-in');
  }, [isLoaded, isSignedIn, router]);

  return (
    <View style={styles.root}>
      <ActivityIndicator color={theme.dune} size="large" />
      <Text style={styles.text}>Completando acceso…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.canvas,
    gap: 14,
  },
  text: {
    fontFamily: fonts.bodyMed,
    fontSize: 14,
    color: theme.inkMuted,
  },
});
