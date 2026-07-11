import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MeilisearchAdapter } from '../adapters/meilisearch.adapter';

const LISTINGS_INDEX = 'listings';

@Injectable()
export class SearchIndexService implements OnModuleInit {
  private readonly logger = new Logger(SearchIndexService.name);

  constructor(
    private prisma: PrismaService,
    private meili: MeilisearchAdapter,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    if (!this.meili.isConfigured()) {
      this.logger.debug('Meilisearch no configurado — omitiendo sync');
      return;
    }
    const syncOnBoot = this.config.get('MEILI_SYNC_ON_BOOT', 'true') !== 'false';
    if (!syncOnBoot) return;

    // No bloquear el arranque de la API
    void this.reindexListings().catch((e) =>
      this.logger.warn(`Sync Meilisearch falló: ${(e as Error).message}`),
    );
  }

  async reindexListings(): Promise<{ indexed: number }> {
    await this.meili.configureIndex(LISTINGS_INDEX, {
      filterableAttributes: ['campId', 'category', 'status'],
      searchableAttributes: ['title', 'description'],
    });

    const listings = await this.prisma.listing.findMany({
      where: { status: 'active' },
      include: { category: { select: { slug: true } } },
    });

    const docs = listings.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      price: Number(l.price),
      campId: l.campId,
      category: l.category.slug,
      status: l.status,
    }));

    await this.meili.indexDocuments(LISTINGS_INDEX, docs);
    this.logger.log(`Meilisearch: ${docs.length} anuncios indexados`);
    return { indexed: docs.length };
  }
}
