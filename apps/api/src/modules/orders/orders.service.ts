import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createOrderSchema, paginationSchema } from '@lefrig/shared';
import { paginate, skipTake } from '../../common/utils/pagination';
import { ManualPaymentAdapter } from '../../adapters/payment.adapter';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private paymentAdapter: ManualPaymentAdapter,
  ) {}

  async findAll(userId: string, query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);

    const where = { OR: [{ buyerId: userId }, { beneficiaryId: userId }] };
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        include: {
          shop: { select: { name: true, slug: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        shop: { select: { name: true, slug: true, ownerId: true } },
        items: true,
        buyer: { select: { displayName: true } },
      },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.buyerId !== userId && order.beneficiaryId !== userId) {
      throw new ForbiddenException('No autorizado');
    }
    return order;
  }

  async create(buyerId: string, input: unknown) {
    const data = createOrderSchema.parse(input);
    const totalAmount = data.items.reduce((sum, i) => sum + i.quantity * i.price, 0);

    const order = await this.prisma.order.create({
      data: {
        buyerId,
        shopId: data.shopId,
        beneficiaryId: data.beneficiaryId,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentMethod === 'fiado' ? 'fiado' : 'pending',
        totalAmount,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.quantity * item.price,
          })),
        },
      },
      include: { items: true, shop: { select: { name: true } } },
    });

    if (data.paymentMethod === 'manual_transfer') {
      const ref = `MAN-${order.id.slice(0, 8).toUpperCase()}`;
      await this.paymentAdapter.initiate({
        orderId: order.id,
        amount: Number(totalAmount),
        currency: 'MRU',
        reference: ref,
      });
      await this.prisma.manualPayment.create({
        data: { orderId: order.id, reference: ref, amount: totalAmount },
      });
    }

    return order;
  }

  async updateStatus(id: string, userId: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.buyerId !== userId && order.beneficiaryId !== userId) {
      throw new ForbiddenException('No autorizado');
    }
    return this.prisma.order.update({ where: { id }, data: { status } });
  }
}
