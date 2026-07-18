import { describe, it, expect } from 'vitest';
import { createOrderSchema, pinConfirmSchema, updateOrderStatusSchema } from '@lefrig/shared';

describe('createOrderSchema', () => {
  it('acepta pedido válido con productId', () => {
    const parsed = createOrderSchema.parse({
      shopId: '550e8400-e29b-41d4-a716-446655440000',
      paymentMethod: 'cash',
      items: [{ productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 2 }],
      notes: 'Entregar por la tarde',
    });

    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].productId).toBe('550e8400-e29b-41d4-a716-446655440001');
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

  it('rechaza cantidad no entera o negativa', () => {
    expect(() =>
      createOrderSchema.parse({
        shopId: '550e8400-e29b-41d4-a716-446655440000',
        paymentMethod: 'cash',
        items: [{ productId: '550e8400-e29b-41d4-a716-446655440001', quantity: -1 }],
      }),
    ).toThrow();
    expect(() =>
      createOrderSchema.parse({
        shopId: '550e8400-e29b-41d4-a716-446655440000',
        paymentMethod: 'cash',
        items: [{ productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 1.5 }],
      }),
    ).toThrow();
  });

  it('rechaza precio enviado por el cliente', () => {
    const parsed = createOrderSchema.parse({
      shopId: '550e8400-e29b-41d4-a716-446655440000',
      paymentMethod: 'cash',
      items: [
        {
          productId: '550e8400-e29b-41d4-a716-446655440001',
          quantity: 1,
          price: 1,
          name: 'hack',
        },
      ],
    });
    expect(parsed.items[0]).toEqual({
      productId: '550e8400-e29b-41d4-a716-446655440001',
      quantity: 1,
    });
  });

  it('rechaza fiado y voucher en pedidos nuevos', () => {
    for (const paymentMethod of ['fiado', 'voucher'] as const) {
      expect(() =>
        createOrderSchema.parse({
          shopId: '550e8400-e29b-41d4-a716-446655440000',
          paymentMethod,
          items: [{ productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 1 }],
        }),
      ).toThrow();
    }
  });
});

describe('updateOrderStatusSchema', () => {
  it('acepta estados de la máquina', () => {
    expect(updateOrderStatusSchema.parse({ status: 'confirmed' }).status).toBe('confirmed');
  });

  it('rechaza estados arbitrarios', () => {
    expect(() => updateOrderStatusSchema.parse({ status: 'hacked' })).toThrow();
  });
});

describe('pinConfirmSchema', () => {
  it('exige PIN de 4 dígitos', () => {
    expect(pinConfirmSchema.parse({ operationCode: 'CASH-AB', pin: '1234' }).pin).toBe('1234');
    expect(() => pinConfirmSchema.parse({ operationCode: 'CASH-AB', pin: 'abcd' })).toThrow();
    expect(() => pinConfirmSchema.parse({ operationCode: 'CASH-AB', pin: '12' })).toThrow();
  });
});
