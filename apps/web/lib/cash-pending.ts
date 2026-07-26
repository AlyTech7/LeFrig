/** Pendiente de efectivo: memoria de proceso + sessionStorage (sobrevive refresh). */

export type PendingCashAgreement = {
  id: string;
  operationCode: string;
  pin?: string;
  amount: number | string;
  currency?: string;
  status?: string;
  method?: string;
  createdAt?: string;
  listingTitle?: string;
  role?: 'buyer' | 'seller';
};

const STORAGE_KEY = 'lefrig_pending_cash';

let pending: PendingCashAgreement | null = null;

function readStorage(): PendingCashAgreement | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingCashAgreement;
  } catch {
    return null;
  }
}

function writeStorage(data: PendingCashAgreement | null): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    if (data) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export function setPendingCashAgreement(data: PendingCashAgreement): void {
  pending = data;
  writeStorage(data);
}

export function takePendingCashAgreement(): PendingCashAgreement | null {
  const value = pending ?? readStorage();
  pending = null;
  writeStorage(null);
  return value;
}

export function peekPendingCashAgreement(): PendingCashAgreement | null {
  return pending ?? readStorage();
}
