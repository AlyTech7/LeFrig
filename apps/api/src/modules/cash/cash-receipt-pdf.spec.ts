import { describe, it, expect } from 'vitest';
import { buildCashReceiptPdf } from './cash-receipt-pdf';

describe('buildCashReceiptPdf', () => {
  it('genera un buffer PDF válido', async () => {
    const buf = await buildCashReceiptPdf({
      receiptId: 'rcpt-test-uuid',
      operationCode: 'CASH-ABCDEF12',
      amount: 500,
      currency: 'EUR',
      issuedAt: new Date('2026-07-26T12:00:00.000Z'),
      listingTitle: 'Salón marroquí',
      buyerName: 'Comprador Demo',
      sellerName: 'Vendedor Demo',
    });

    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf.subarray(0, 5).toString('utf8')).toBe('%PDF-');
  });
});
