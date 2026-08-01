import { describe, it, expect } from 'vitest';
import {
  assertFiniteMoney,
  addMoney,
  multiplyMoney,
  createReviewSchema,
  createTransportSchema,
  pinConfirmSchema,
  updateListingSchema,
  updateOrderStatusSchema,
  isValidPhoneE164,
  normalizePhoneE164,
} from '@lefrig/shared';

describe('money helpers', () => {
  it('assertFiniteMoney rechaza no-finitos', () => {
    expect(() => assertFiniteMoney(Number.NaN)).toThrow();
    expect(() => assertFiniteMoney(Infinity)).toThrow();
    expect(assertFiniteMoney(12.5)).toBe(12.5);
  });

  it('addMoney y multiplyMoney redondean DZD a enteros', () => {
    expect(addMoney(10.4, 0.4, 'DURU')).toBe(11);
    expect(multiplyMoney(1500, 2, 'DURU')).toBe(3000);
    expect(addMoney(10.4, 0.4, 'DZD')).toBe(11);
    expect(multiplyMoney(1500, 2, 'DZD')).toBe(3000);
  });
});

describe('phone', () => {
  it('normaliza y valida E.164', () => {
    const e164 = normalizePhoneE164('+213', '555123456');
    expect(isValidPhoneE164(e164)).toBe(true);
  });
});

describe('schemas hardening', () => {
  it('review rating debe ser entero', () => {
    expect(() =>
      createReviewSchema.parse({
        targetType: 'user',
        targetId: '550e8400-e29b-41d4-a716-446655440000',
        rating: 3.5,
      }),
    ).toThrow();
  });

  it('transport contactPhone usa phoneSchema', () => {
    expect(() =>
      createTransportSchema.parse({
        type: 'shared_ride',
        originHubSlug: 'rabouni',
        destinationHubSlug: 'smara',
        contactPhone: 'abcd',
      }),
    ).toThrow();
  });

  it('updateListingSchema retiene superRefine', () => {
    expect(() =>
      updateListingSchema.parse({
        category: 'mobiles',
        description: '',
        attributes: {},
      }),
    ).toThrow();
  });

  it('pin y order status', () => {
    expect(() => pinConfirmSchema.parse({ operationCode: 'X', pin: 'ab12' })).toThrow();
    expect(updateOrderStatusSchema.parse({ status: 'confirmed' }).status).toBe('confirmed');
  });
});
