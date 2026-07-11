import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Locale } from '@lefrig/shared';

const CACHE_PREFIX = '@lefrig/cache/';

export async function cacheSet<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({ value, at: Date.now() }));
}

export async function cacheGet<T>(key: string, maxAgeMs = 3600000): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const { value, at } = JSON.parse(raw) as { value: T; at: number };
    if (Date.now() - at > maxAgeMs) return null;
    return value;
  } catch {
    return null;
  }
}

export async function cacheRemove(key: string): Promise<void> {
  await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
}

const USER_KEY = '@lefrig/user_profile';

export interface CachedUser {
  displayName: string;
  preferredLanguage: Locale;
  campName?: string;
}

export async function getCachedUser(): Promise<CachedUser> {
  const user = await cacheGet<CachedUser>(USER_KEY, 86400000 * 30);
  return user ?? { displayName: 'Amigo', preferredLanguage: 'es', campName: 'Rabouni' };
}

export async function setCachedUser(user: CachedUser): Promise<void> {
  await cacheSet(USER_KEY, user);
}
