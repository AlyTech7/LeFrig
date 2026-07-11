import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, skipTake } from '../../common/utils/pagination';
import {
  createShopProductSchema,
  createShopSchema,
  paginationSchema,
  updateShopProductSchema,
} from '@lefrig/shared';

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  private async assertShopOwner(shopId: string, userId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Tienda no encontrada');
    if (shop.ownerId !== userId) throw new ForbiddenException('No eres el dueño de esta tienda');
    return shop;
  }

  async findAll(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);
    const campId = (query as Record<string, string>)?.campId;

    const where = { isActive: true, ...(campId && { campId }) };

    const [data, total] = await Promise.all([
      this.prisma.shop.findMany({
        where,
        skip,
        take,
        include: {
          camp: { select: { slug: true, nameEs: true } },
          marsa: { select: { nameEs: true } },
          _count: { select: { products: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.shop.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  findMine(ownerId: string) {
    return this.prisma.shop.findMany({
      where: { ownerId, isActive: true },
      include: {
        camp: { select: { nameEs: true } },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: {
        camp: true,
        marsa: true,
        products: { where: { isActive: true } },
        owner: { select: { id: true, displayName: true, reputationScore: true } },
      },
    });
    if (!shop) throw new NotFoundException('Tienda no encontrada');
    return shop;
  }

  async findBySlug(slug: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { slug },
      include: {
        products: { where: { isActive: true } },
        camp: true,
        owner: { select: { id: true, displayName: true } },
      },
    });
    if (!shop) throw new NotFoundException('Tienda no encontrada');
    return shop;
  }

  async create(ownerId: string, input: unknown) {
    const data = createShopSchema.parse(input);
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').slice(0, 50) + `-${Date.now().toString(36)}`;

    return this.prisma.shop.create({
      data: {
        ownerId,
        slug,
        name: data.name,
        description: data.description,
        campId: data.campId,
        dairaId: data.dairaId,
        marsaId: data.marsaId,
        phone: data.phone,
        whatsapp: data.whatsapp,
        acceptsCash: data.acceptsCash,
        acceptsFiado: data.acceptsFiado,
        acceptsVouchers: data.acceptsVouchers,
        shopType: data.shopType,
        imageUrl: data.imageUrl,
      },
    });
  }

  listProducts(shopId: string) {
    return this.prisma.shopProduct.findMany({
      where: { shopId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProduct(shopId: string, userId: string, input: unknown) {
    await this.assertShopOwner(shopId, userId);
    const data = createShopProductSchema.parse(input);
    return this.prisma.shopProduct.create({
      data: { shopId, ...data },
    });
  }

  async updateProduct(shopId: string, productId: string, userId: string, input: unknown) {
    await this.assertShopOwner(shopId, userId);
    const product = await this.prisma.shopProduct.findFirst({ where: { id: productId, shopId } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    const data = updateShopProductSchema.parse(input);
    return this.prisma.shopProduct.update({ where: { id: productId }, data });
  }

  async deleteProduct(shopId: string, productId: string, userId: string) {
    await this.assertShopOwner(shopId, userId);
    const product = await this.prisma.shopProduct.findFirst({ where: { id: productId, shopId } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return this.prisma.shopProduct.update({
      where: { id: productId },
      data: { isActive: false },
    });
  }
}
