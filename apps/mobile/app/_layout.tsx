import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import * as WebBrowser from 'expo-web-browser';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '@/lib/theme';
import { hasLegacySession } from '@/lib/legacySession';
import { routeRequiresAuth, isAuthScreen } from '@/lib/auth-routes';
import { OfflineSync } from '@/components/OfflineSync';
import { PushRegister } from '@/components/PushRegister';
import { BottomNav } from '@/components/BottomNav';
import { LocaleProvider } from '@/lib/locale';
import { SyncPreferredLanguage } from '@/components/SyncPreferredLanguage';

WebBrowser.maybeCompleteAuthSession();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [legacyAuthed, setLegacyAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    hasLegacySession().then((v) => {
      if (!cancelled) setLegacyAuthed(v);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, segments]);

  useEffect(() => {
    if (!isLoaded || legacyAuthed === null) return;
    const authed = isSignedIn || legacyAuthed;
    const segs = segments as string[];
    const needsAuth = routeRequiresAuth(segs);
    const onAuthScreen = isAuthScreen(segs);

    if (!authed && needsAuth && !onAuthScreen) {
      router.replace('/sign-in');
    } else if (authed && (segs[0] === 'sign-in' || segs[0] === 'sign-up')) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, legacyAuthed, segments, router]);

  if (!isLoaded || legacyAuthed === null) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={theme.dune} size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

function RootNavigator() {
  const segments = useSegments();
  const root = segments[0] ?? 'index';
  const hideNav =
    root === 'sign-in' ||
    root === 'sign-up' ||
    root === 'onboarding' ||
    root === 'atlas' ||
    root === 'legal' ||
    root === 'messages';

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <OfflineSync />
      <PushRegister />
      <AuthGate>
        <View style={styles.stackWrap}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: theme.canvas },
              headerTintColor: theme.dune,
              headerTitleStyle: { fontWeight: '800' },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: theme.canvas },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="atlas/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="sign-in" options={{ headerShown: false }} />
            <Stack.Screen name="sign-up" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="legal/index" options={{ headerShown: false }} />
            <Stack.Screen name="legal/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="marketplace" options={{ headerShown: false }} />
            <Stack.Screen name="services/index" options={{ headerShown: false }} />
            <Stack.Screen name="services/create" options={{ headerShown: false }} />
            <Stack.Screen name="services/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="shops" options={{ headerShown: false }} />
            <Stack.Screen name="transport" options={{ headerShown: false }} />
            <Stack.Screen name="jobs" options={{ headerShown: false }} />
            <Stack.Screen name="needs" options={{ headerShown: false }} />
            <Stack.Screen name="community/index" options={{ headerShown: false }} />
            <Stack.Screen name="diaspora/index" options={{ headerShown: false }} />
            <Stack.Screen name="cash" options={{ headerShown: false }} />
            <Stack.Screen name="camps" options={{ headerShown: false }} />
            <Stack.Screen name="locations/index" options={{ headerShown: false }} />
            <Stack.Screen name="profile/index" options={{ headerShown: false }} />
            <Stack.Screen name="messages/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="messages/index" options={{ headerShown: false }} />
            <Stack.Screen name="favorites/index" options={{ headerShown: false }} />
            <Stack.Screen name="ledger" options={{ headerShown: false }} />
            <Stack.Screen name="orders" options={{ headerShown: false }} />
            <Stack.Screen name="disputes/index" options={{ headerShown: false }} />
            <Stack.Screen name="vouchers" options={{ headerShown: false }} />
            <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
          </Stack>
        </View>
        {!hideNav && <BottomNav />}
      </AuthGate>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  stackWrap: { flex: 1 },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.canvas },
});

export default function RootLayout() {
  if (!publishableKey) {
    console.warn('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY missing');
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <LocaleProvider>
        <SyncPreferredLanguage />
        <RootNavigator />
      </LocaleProvider>
    </ClerkProvider>
  );
}
