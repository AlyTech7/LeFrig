import { Injectable, Logger } from '@nestjs/common';

export interface ManualPaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  reference: string;
  proofUrl?: string;
}

export interface ManualPaymentResult {
  id: string;
  status: string;
  reference: string;
}

@Injectable()
export class ManualPaymentAdapter {
  private readonly logger = new Logger(ManualPaymentAdapter.name);

  async initiate(request: ManualPaymentRequest): Promise<ManualPaymentResult> {
    this.logger.log(`[MOCK PAYMENT] Initiate ${request.reference} — ${request.amount} ${request.currency}`);
    return {
      id: `mock-pay-${Date.now()}`,
      status: 'pending_manual_confirmation',
      reference: request.reference,
    };
  }

  async confirm(reference: string): Promise<ManualPaymentResult> {
    this.logger.log(`[MOCK PAYMENT] Confirm ${reference}`);
    return {
      id: `mock-pay-${Date.now()}`,
      status: 'confirmed',
      reference,
    };
  }
}
