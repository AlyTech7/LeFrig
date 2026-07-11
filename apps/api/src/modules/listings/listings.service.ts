import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MeilisearchAdapter } from '../../adapters/meilisearch.adapter';
import { paginate, skipTake } from '../../common/utils/pagination';
import {
  createListingSchema,
  updateListingSchema,
  listingFilterSchema,
  categoryHasStructuredAttributes,
  validateListingAttributes,
  hasActiveAttributeFilters,
  resolveMarketplaceSearch,
  type ListingAttributeFilterValues,
} from '@lefrig/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class ListingsService {
  constructor(
    private prisma: PrismaService,
    private meili: MeilisearchAdapter,
  ) {}

  private async indexListing(listing: {
    id: string;
    title: string;
    description: string;
    price: unknown;
    campId: string;
    status: string;
    category?: { slug?: string };
  }) {
    if (listing.status !== 'active') return;
    void this.meili.indexDocument('listings', {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: Number(listing.price),
      campId: listing.campId,
      category: listing.category?.slug,
      status: listing.status,
    });
  }

  private buildAttributeConditions(
    filters: ListingAttributeFilterValues,
  ): Prisma.ListingWhereInput[] {
    const and: Prisma.ListingWhereInput[] = [];
    if (filters.brand) {
      and.push({ attributes: { path: ['brand'], equals: filters.brand } });
    }
    if (filters.yearMin !== undefined) {
      and.push({ attributes: { path: ['year'], gte: filters.yearMin } });
    }
    if (filters.yearMax !== undefined) {
      and.push({ attributes: { path: ['year'], lte: filters.yearMax } });
    }
    if (filters.areaMin !== undefined) {
      and.push({ attributes: { path: ['areaM2'], gte: filters.areaMin } });
    }
    if (filters.propertyType) {
      and.push({ attributes: { path: ['propertyType'], equals: filters.propertyType } });
    }
    if (filters.fuel) {
      and.push({ attributes: { path: ['fuel'], equals: filters.fuel } });
    }
    if (filters.storage) {
      and.push({ attributes: { path: ['storage'], equals: filters.storage } });
    }
    return and;
  }

  async findAll(query: unknown) {
    const filters = listingFilterSchema.parse(query);
    const {
      page,
      limit,
      q: rawQ,
      category: rawCategory,
      campId,
      minPrice,
      maxPrice,
      brand,
      yearMin,
      yearMax,
      areaMin,
      propertyType,
      fuel,
      storage,
    } = filters;

    const resolved = rawQ?.trim() && !rawCategory ? resolveMarketplaceSearch(rawQ) : { q: rawQ ?? '', category: undefined };
    const category = rawCategory || resolved.category;
    const q = resolved.q || (rawCategory ? rawQ : undefined);
    const attrFilters: ListingAttributeFilterValues = {
      brand,
      yearMin,
      yearMax,
      areaMin,
      propertyType,
      fuel,
      storage,
    };
    const attrConditions = this.buildAttributeConditions(attrFilters);
    const useAttrFilter = hasActiveAttributeFilters(attrFilters);
    const { skip, take } = skipTake(page, limit);

    if (q?.trim() && this.meili.isConfigured() && !useAttrFilter) {
      const filterParts = ["status = 'active'"];
      if (campId) filterParts.push(`campId = '${campId}'`);
      if (category) filterParts.push(`category = '${category}'`);
      const hits = await this.meili.search('listings', q, {
        limit: take,
        filter: filterParts.join(' AND '),
      });
      if (hits?.length) {
        const ids = hits.map((h) => h.id);
        const data = await this.prisma.listing.findMany({
          where: {
            id: { in: ids },
            status: 'active',
            ...(attrConditions.length ? { AND: attrConditions } : {}),
          },
          include: {
            category: { select: { slug: true, nameEs: true, icon: true } },
            camp: { select: { slug: true, nameEs: true } },
            seller: { select: { id: true, displayName: true, reputationScore: true } },
          },
        });
        const order = Object.fromEntries(ids.map((id, i) => [id, i]));
        data.sort((a, b) => (order[a.id] ?? 0) - (order[b.id] ?? 0));
        return paginate(data, data.length, page, limit);
      }
    }

    const where: Prisma.ListingWhereInput = {
      status: 'active',
      ...(campId && { campId }),
      ...(category && { category: { slug: category } }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { category: { slug: { contains: q, mode: 'insensitive' } } },
          { category: { nameEs: { contains: q, mode: 'insensitive' } } },
          { category: { nameAr: { contains: q, mode: 'insensitive' } } },
        ],
      }),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined && { gte: minPrice }),
              ...(maxPrice !== undefined && { lte: maxPrice }),
            },
          }
        : {}),
      ...(attrConditions.length ? { AND: attrConditions } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take,
        include: {
          category: { select: { slug: true, nameEs: true, icon: true } },
          camp: { select: { slug: true, nameEs: true } },
          seller: { select: { id: true, displayName: true, reputationScore: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        category: true,
        camp: true,
        daira: true,
        seller: { select: { id: true, displayName: true, phone: true, reputationScore: true, badges: true } },
      },
    });
    if (!listing) throw new NotFoundException('Anuncio no encontrado');

    await this.prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return listing;
  }

  async create(sellerId: string, input: unknown) {
    const data = createListingSchema.parse(input);
    const category = await this.prisma.category.findFirst({
      where: { slug: data.category, type: 'listing' },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    const attributes = categoryHasStructuredAttributes(data.category)
      ? (validateListingAttributes(data.category, data.attributes ?? {}) as Prisma.InputJsonValue)
      : ({} as Prisma.InputJsonValue);

    return this.prisma.listing.create({
      data: {
        sellerId,
        categoryId: category.id,
        campId: data.campId,
        dairaId: data.dairaId,
        title: data.title,
        description: data.description ?? '',
        price: data.price,
        currency: data.currency,
        images: data.images ?? [],
        paymentMethods: data.paymentMethods,
        attributes,
        status: 'active',
      },
      include: { category: true, camp: true },
    }).then((listing) => {
      void this.indexListing(listing);
      return listing;
    });
  }

  async update(id: string, userId: string, input: unknown) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Anuncio no encontrado');
    if (listing.sellerId !== userId) throw new ForbiddenException('No autorizado');

    const data = updateListingSchema.parse(input);
    const { category, attributes, ...rest } = data;
    const updateData: Prisma.ListingUpdateInput = { ...rest };

    let categorySlug = category;
    if (!categorySlug) {
      const cat = await this.prisma.category.findUnique({
        where: { id: listing.categoryId },
        select: { slug: true },
      });
      categorySlug = cat?.slug;
    }

    if (attributes !== undefined && categorySlug) {
      updateData.attributes = categoryHasStructuredAttributes(categorySlug)
        ? (validateListingAttributes(categorySlug, attributes) as Prisma.InputJsonValue)
        : ({} as Prisma.InputJsonValue);
    }

    if (category) {
      const cat = await this.prisma.category.findFirst({
        where: { slug: category, type: 'listing' },
      });
      if (cat) updateData.category = { connect: { id: cat.id } };
    }

    return this.prisma.listing.update({
      where: { id },
      data: updateData,
      include: { category: true },
    }).then((listing) => {
      void this.indexListing(listing);
      return listing;
    });
  }

  async getFavorites(userId: string) {
    const favorites = await this.prisma.listingFavorite.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            category: { select: { slug: true, nameEs: true } },
            camp: { select: { slug: true, nameEs: true } },
            seller: { select: { displayName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return favorites.map((f) => f.listing).filter(Boolean);
  }

  async toggleFavorite(userId: string, listingId: string) {
    const existing = await this.prisma.listingFavorite.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (existing) {
      await this.prisma.listingFavorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }
    await this.prisma.listingFavorite.create({ data: { userId, listingId } });
    return { favorited: true };
  }

  async report(userId: string, listingId: string, reason: string, details?: string) {
    return this.prisma.listingReport.create({
      data: { listingId, reporterId: userId, reason, details },
    });
  }
}
