import { storageDelete, storageGet, storageSet } from '@/lib/safeStorage';

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
  await storageSet(KEY, JSON.stringify(data));
}

export async function loadPendingCashAgreement(): Promise<PendingCashAgreement | null> {
  const raw = await storageGet(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingCashAgreement;
  } catch {
    return null;
  }
}

export async function clearPendingCashAgreement(): Promise<void> {
  await storageDelete(KEY);
}
