import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'lefrig_access_token';
const USER_KEY = 'lefrig_user_json';

export type LegacyUser = {
  id: string;
  phone: string | null;
  roles: string[];
  campId?: string | null;
};

export async function getLegacyAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function setLegacySession(accessToken: string, user: LegacyUser): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getLegacyUser(): Promise<LegacyUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LegacyUser;
  } catch {
    return null;
  }
}

export async function clearLegacySession(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function hasLegacySession(): Promise<boolean> {
  return !!(await getLegacyAccessToken());
}
