/** Pendiente de efectivo solo en memoria de proceso (no sessionStorage). */
export type PendingCashAgreement = {
  id: string;
  operationCode: string;
  pin?: string;
  amount: number | string;
  status?: string;
  method?: string;
  createdAt?: string;
  listingTitle?: string;
};

let pending: PendingCashAgreement | null = null;

export function setPendingCashAgreement(data: PendingCashAgreement): void {
  pending = data;
}

export function takePendingCashAgreement(): PendingCashAgreement | null {
  const value = pending;
  pending = null;
  return value;
}
