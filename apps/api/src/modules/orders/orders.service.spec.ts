import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import type { PrismaService } from '../../prisma/prisma.service';

describe('OrdersService updateStatus', () => {
  let service: OrdersService;
  let prisma: {
    order: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prisma = {
      order: {
        findUnique: vi.fn(),
        update: vi.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'ord-1', status: data.status }),
        ),
      },
    };
    service = new OrdersService(prisma as unknown as PrismaService);
  });

  it('tienda puede pending → confirmed', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord-1',
      status: 'pending',
      buyerId: 'buyer-1',
      beneficiaryId: null,
      shop: { ownerId: 'shop-1' },
    });
    const result = await service.updateStatus('ord-1', 'shop-1', { status: 'confirmed' });
    expect(result.status).toBe('confirmed');
  });

  it('comprador no puede pending → confirmed', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord-1',
      status: 'pending',
      buyerId: 'buyer-1',
      beneficiaryId: null,
      shop: { ownerId: 'shop-1' },
    });
    await expect(
      service.updateStatus('ord-1', 'buyer-1', { status: 'confirmed' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza transición pending → delivered', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord-1',
      status: 'pending',
      buyerId: 'buyer-1',
      beneficiaryId: null,
      shop: { ownerId: 'shop-1' },
    });
    await expect(
      service.updateStatus('ord-1', 'shop-1', { status: 'delivered' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza ajenos al pedido', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord-1',
      status: 'pending',
      buyerId: 'buyer-1',
      beneficiaryId: null,
      shop: { ownerId: 'shop-1' },
    });
    await expect(
      service.updateStatus('ord-1', 'stranger', { status: 'cancelled' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
