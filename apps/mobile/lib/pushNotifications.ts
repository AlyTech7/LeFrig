import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_URL } from './api';
import { getLegacyAccessToken } from './legacySession';

/** Remote push needs a dev/production build; Expo Go removed this in SDK 53+. */
export function isPushSupported(): boolean {
  return Device.isDevice && Constants.appOwnership !== 'expo';
}

function notificationsGranted(perm: unknown): boolean {
  const p = perm as { granted?: boolean; status?: string };
  return p.granted === true || p.status === 'granted';
}

export async function registerForPushNotifications(
  getToken: () => Promise<string | null>,
  isSignedIn: boolean,
): Promise<string | null> {
  if (!isPushSupported()) return null;

  const Notifications = await import('expo-notifications');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const perm = await Notifications.getPermissionsAsync();
  if (!notificationsGranted(perm)) {
    const req = await Notifications.requestPermissionsAsync();
    if (!notificationsGranted(req)) return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Lefrig',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    (Constants.expoConfig?.extra?.eas?.projectId as string | undefined);

  const pushToken = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  const token = pushToken.data;
  const clerkToken = isSignedIn ? await getToken() : null;
  const legacyToken = clerkToken ? null : await getLegacyAccessToken();
  const authToken = clerkToken ?? legacyToken;
  if (!authToken) return token;

  try {
    await fetch(`${API_URL}/notifications/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token, platform: Platform.OS }),
    });
  } catch {
    /* registro diferido */
  }

  return token;
}
