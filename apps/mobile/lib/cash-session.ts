import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'lefrig_new_cash';

export type PendingCashAgreement = {
  id: string;
  operationCode: string;
  pin: string;
  amount: number | string;
  listingTitle?: string;
  createdAt: string;
};

export async function savePendingCashAgreement(data: PendingCashAgreement): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

export async function loadPendingCashAgreement(): Promise<PendingCashAgreement | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingCashAgreement;
  } catch {
    return null;
  }
}

export async function clearPendingCashAgreement(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
