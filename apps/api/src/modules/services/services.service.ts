import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageAdapter } from '../../adapters/storage.adapter';
import { paginate, skipTake } from '../../common/utils/pagination';
import { paginationSchema } from '@lefrig/shared';

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageAdapter,
  ) {}

  async findAll(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);
    const campId = (query as Record<string, string>)?.campId;
    const category = (query as Record<string, string>)?.category;

    const where = {
      isActive: true,
      ...(category && { category: { slug: `service-${category}` } }),
      ...(campId && { camps: { some: { campId } } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take,
        include: {
          category: true,
          provider: { select: { id: true, displayName: true, reputationScore: true } },
          camps: { include: { camp: { select: { slug: true, nameEs: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.service.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        provider: { select: { id: true, displayName: true, phone: true, reputationScore: true } },
        camps: { include: { camp: true } },
      },
    });
    if (!service) throw new NotFoundException('Servicio no encontrado');
    return service;
  }

  async create(providerId: string, data: {
    categorySlug: string;
    title: string;
    description: string;
    priceFrom?: number;
    priceTo?: number;
    campIds: string[];
    images?: string[];
  }) {
    const category = await this.prisma.category.findFirst({
      where: { slug: `service-${data.categorySlug}` },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    if (data.images?.length) {
      this.storage.assertOwnedImageUrls(data.images, providerId);
    }

    return this.prisma.service.create({
      data: {
        providerId,
        categoryId: category.id,
        title: data.title,
        description: data.description,
        priceFrom: data.priceFrom,
        priceTo: data.priceTo,
        images: data.images ?? [],
        camps: { create: data.campIds.map((campId) => ({ campId })) },
      },
      include: { category: true, camps: { include: { camp: true } } },
    });
  }
}
