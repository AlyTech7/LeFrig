import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { LISTING_CATEGORIES, SERVICE_CATEGORIES } from '@lefrig/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesService implements OnModuleInit {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.ensureCatalog();
    } catch (err) {
      this.logger.error(`No se pudo asegurar el catálogo de categorías: ${(err as Error).message}`);
    }
  }

  /** Upsert idempotente del catálogo compartido (anuncios + servicios). */
  async ensureCatalog() {
    const expected = LISTING_CATEGORIES.length + SERVICE_CATEGORIES.length;
    const existing = await this.prisma.category.count();
    if (existing >= expected) return;

    this.logger.log(`Catálogo de categorías incompleto (${existing}/${expected}) — sincronizando…`);

    for (const [i, cat] of LISTING_CATEGORIES.entries()) {
      await this.prisma.category.upsert({
        where: { slug: cat.slug },
        update: {
          nameAr: cat.nameAr,
          nameEs: cat.nameEs,
          nameEn: cat.nameEs,
          icon: cat.icon,
          type: 'listing',
          sortOrder: i,
          isActive: true,
        },
        create: {
          slug: cat.slug,
          nameAr: cat.nameAr,
          nameEs: cat.nameEs,
          nameEn: cat.nameEs,
          icon: cat.icon,
          type: 'listing',
          sortOrder: i,
        },
      });
    }

    for (const [i, cat] of SERVICE_CATEGORIES.entries()) {
      const slug = `service-${cat.slug}`;
      await this.prisma.category.upsert({
        where: { slug },
        update: {
          nameAr: cat.nameAr,
          nameEs: cat.nameEs,
          nameEn: cat.nameEs,
          icon: cat.icon,
          type: 'service',
          sortOrder: i,
          isActive: true,
        },
        create: {
          slug,
          nameAr: cat.nameAr,
          nameEs: cat.nameEs,
          nameEn: cat.nameEs,
          icon: cat.icon,
          type: 'service',
          sortOrder: i,
        },
      });
    }

    this.logger.log(`Catálogo de categorías listo (listing ${LISTING_CATEGORIES.length}, service ${SERVICE_CATEGORIES.length})`);
  }

  findAll(type?: string) {
    return this.prisma.category.findMany({
      where: { isActive: true, ...(type && { type }) },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.category.findUnique({ where: { slug } });
  }
}
