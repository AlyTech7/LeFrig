import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache as clerkNativeTokenCache } from '@clerk/clerk-expo/token-cache';
import {
  useFonts,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import * as WebBrowser from 'expo-web-browser';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, View, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '@/lib/theme';
import { hasLegacySession } from '@/lib/legacySession';
import { routeRequiresAuth, isAuthScreen } from '@/lib/auth-routes';
import { OfflineSync } from '@/components/OfflineSync';
import { PushRegister } from '@/components/PushRegister';
import { BottomNav } from '@/components/BottomNav';
import { LocaleProvider } from '@/lib/locale';
import { SyncPreferredLanguage } from '@/components/SyncPreferredLanguage';
import { LanguageGate } from '@/components/LanguageGate';
import { storageGet, storageSet } from '@/lib/safeStorage';

WebBrowser.maybeCompleteAuthSession();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

/** SecureStore-backed cache is native-only; web uses AsyncStorage. */
const tokenCache =
  Platform.OS === 'web'
    ? {
        getToken: (key: string) => storageGet(key),
        saveToken: (key: string, value: string) => storageSet(key, value),
      }
    : clerkNativeTokenCache;

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [legacyAuthed, setLegacyAuthed] = useState<boolean | null>(null);
  const [bootTimedOut, setBootTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBootTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isLoaded && !bootTimedOut) return;
    let cancelled = false;
    hasLegacySession().then((v) => {
      if (!cancelled) setLegacyAuthed(v);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, bootTimedOut, isSignedIn, segments]);

  useEffect(() => {
    if ((!isLoaded && !bootTimedOut) || legacyAuthed === null) return;
    const authed = Boolean(isSignedIn) || legacyAuthed;
    const segs = segments as string[];
    const needsAuth = routeRequiresAuth(segs);
    const onAuthScreen = isAuthScreen(segs);

    if (!authed && needsAuth && !onAuthScreen) {
      router.replace('/sign-in');
    } else if (authed && (segs[0] === 'sign-in' || segs[0] === 'sign-up')) {
      router.replace('/');
    }
  }, [isLoaded, bootTimedOut, isSignedIn, legacyAuthed, segments, router]);

  if ((!isLoaded && !bootTimedOut) || legacyAuthed === null) {
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
  const pathname = usePathname();
  const root = segments[0] ?? 'index';
  const hideNav =
    root === 'sign-in' ||
    root === 'sign-up' ||
    root === 'sso-callback' ||
    root === 'onboarding' ||
    root === 'atlas' ||
    root === 'legal' ||
    (root === 'messages' && segments.length > 1) ||
    pathname === '/marketplace/create' ||
    pathname === '/jobs/create' ||
    pathname === '/services/create' ||
    (root === 'services' && segments.length > 1) ||
    // Detalle de anuncio / empleo: CTA fijo no debe quedar bajo la tab bar
    (root === 'marketplace' &&
      typeof segments[1] === 'string' &&
      !['create', 'mine'].includes(segments[1])) ||
    (root === 'jobs' && typeof segments[1] === 'string' && segments[1] !== 'create') ||
    pathname === '/profile/personal' ||
    pathname === '/profile/security' ||
    pathname === '/profile/privacy' ||
    pathname === '/profile/delete';

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
            <Stack.Screen name="sso-callback" options={{ headerShown: false }} />
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
            <Stack.Screen name="profile" options={{ headerShown: false }} />
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
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  if (!publishableKey) {
    console.warn('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY missing');
  }

  if (!fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={theme.dune} size="large" />
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <LocaleProvider>
        <SyncPreferredLanguage />
        <LanguageGate>
          <RootNavigator />
        </LanguageGate>
      </LocaleProvider>
    </ClerkProvider>
  );
}
