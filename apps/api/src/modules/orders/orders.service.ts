import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  paginationSchema,
  DEFAULT_CURRENCY,
  OrderStatus,
} from '@lefrig/shared';
import { paginate, skipTake } from '../../common/utils/pagination';
import { ManualPaymentAdapter } from '../../adapters/payment.adapter';

const BUYER_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CANCELLED],
};

const SHOP_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private paymentAdapter: ManualPaymentAdapter,
  ) {}

  async findAll(userId: string, query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);

    const where = {
      OR: [{ buyerId: userId }, { beneficiaryId: userId }, { shop: { ownerId: userId } }],
    };
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        include: {
          shop: { select: { name: true, slug: true, ownerId: true } },
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
    const isBuyer = order.buyerId === userId || order.beneficiaryId === userId;
    const isShopOwner = order.shop.ownerId === userId;
    if (!isBuyer && !isShopOwner) {
      throw new ForbiddenException('No autorizado');
    }
    return order;
  }

  async create(buyerId: string, input: unknown) {
    const data = createOrderSchema.parse(input);

    const shop = await this.prisma.shop.findUnique({
      where: { id: data.shopId },
      select: { id: true, ownerId: true },
    });
    if (!shop) throw new NotFoundException('Tienda no encontrada');
    if (shop.ownerId === buyerId) {
      throw new BadRequestException('No puedes pedir en tu propia tienda');
    }

    const productIds = data.items.map((i) => i.productId);
    const products = await this.prisma.shopProduct.findMany({
      where: { id: { in: productIds }, shopId: data.shopId, isActive: true },
    });
    if (products.length !== new Set(productIds).size) {
      throw new BadRequestException('Uno o más productos no pertenecen a esta tienda');
    }

    const productById = new Map(products.map((p) => [p.id, p]));
    const lineItems = data.items.map((item) => {
      const product = productById.get(item.productId)!;
      const unitPrice = Number(product.price);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        throw new BadRequestException(`Precio inválido para ${product.name}`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Stock insuficiente para ${product.name}`);
      }
      return {
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice,
        subtotal: unitPrice * item.quantity,
      };
    });

    const totalAmount = lineItems.reduce((sum, i) => sum + i.subtotal, 0);
    if (!Number.isFinite(totalAmount) || totalAmount <= 0 || totalAmount > 10_000_000) {
      throw new BadRequestException('Importe total inválido');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of lineItems) {
        const updated = await tx.shopProduct.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count !== 1) {
          throw new BadRequestException(`Stock insuficiente para ${item.name}`);
        }
      }

      return tx.order.create({
        data: {
          buyerId,
          shopId: data.shopId,
          beneficiaryId: data.beneficiaryId,
          paymentMethod: data.paymentMethod,
          paymentStatus: 'pending',
          status: OrderStatus.PENDING,
          totalAmount,
          notes: data.notes,
          items: {
            create: lineItems.map((item) => ({
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
          },
        },
        include: { items: true, shop: { select: { name: true } } },
      });
    });

    if (data.paymentMethod === 'manual_transfer') {
      const ref = `MAN-${order.id.slice(0, 8).toUpperCase()}`;
      await this.paymentAdapter.initiate({
        orderId: order.id,
        amount: Number(totalAmount),
        currency: DEFAULT_CURRENCY,
        reference: ref,
      });
      await this.prisma.manualPayment.create({
        data: { orderId: order.id, reference: ref, amount: totalAmount },
      });
    }

    return order;
  }

  async updateStatus(id: string, userId: string, statusInput: unknown) {
    const { status: nextStatus } =
      typeof statusInput === 'string'
        ? updateOrderStatusSchema.parse({ status: statusInput })
        : updateOrderStatusSchema.parse(statusInput);

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { shop: { select: { ownerId: true } } },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const isBuyer = order.buyerId === userId || order.beneficiaryId === userId;
    const isShopOwner = order.shop.ownerId === userId;
    if (!isBuyer && !isShopOwner) {
      throw new ForbiddenException('No autorizado');
    }

    const allowed = isShopOwner
      ? SHOP_TRANSITIONS[order.status] ?? []
      : BUYER_TRANSITIONS[order.status] ?? [];

    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Transición no permitida: ${order.status} → ${nextStatus}`,
      );
    }

    return this.prisma.order.update({ where: { id }, data: { status: nextStatus } });
  }
}
