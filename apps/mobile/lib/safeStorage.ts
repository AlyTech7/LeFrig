import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SecureStore only works on native. On web (Expo web / react-dom) fall back to AsyncStorage.
 */
async function nativeStore() {
  return import('expo-secure-store');
}

export async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }
  const SecureStore = await nativeStore();
  return SecureStore.getItemAsync(key);
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
    return;
  }
  const SecureStore = await nativeStore();
  await SecureStore.setItemAsync(key, value);
}

export async function storageDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
    return;
  }
  const SecureStore = await nativeStore();
  await SecureStore.deleteItemAsync(key);
}
