import { describe, it, expect } from 'vitest';
import { createOrderSchema } from '@lefrig/shared';

describe('createOrderSchema', () => {
  it('acepta pedido válido con efectivo', () => {
    const parsed = createOrderSchema.parse({
      shopId: '550e8400-e29b-41d4-a716-446655440000',
      paymentMethod: 'cash',
      items: [{ name: 'Arroz 5kg', quantity: 2, price: 1500 }],
      notes: 'Entregar por la tarde',
    });

    expect(parsed.items).toHaveLength(1);
    expect(parsed.paymentMethod).toBe('cash');
  });

  it('rechaza pedido sin artículos', () => {
    expect(() =>
      createOrderSchema.parse({
        shopId: '550e8400-e29b-41d4-a716-446655440000',
        paymentMethod: 'cash',
        items: [],
      }),
    ).toThrow();
  });

  it('rechaza cantidad negativa', () => {
    expect(() =>
      createOrderSchema.parse({
        shopId: '550e8400-e29b-41d4-a716-446655440000',
        paymentMethod: 'cash',
        items: [{ name: 'Arroz', quantity: -1, price: 100 }],
      }),
    ).toThrow();
  });
});
