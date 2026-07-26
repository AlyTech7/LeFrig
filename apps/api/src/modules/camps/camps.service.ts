import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CAMPS } from '@lefrig/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisAdapter } from '../../adapters/redis.adapter';

const CAMPS_CACHE_KEY = 'cache:camps:all';
const CAMPS_TTL = 300;

@Injectable()
export class CampsService implements OnModuleInit {
  private readonly logger = new Logger(CampsService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisAdapter,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureCatalog();
    } catch (err) {
      this.logger.error(`No se pudo asegurar el catálogo de campamentos: ${(err as Error).message}`);
    }
  }

  /** Upsert idempotente del catálogo compartido (wilayas + Tindouf). */
  async ensureCatalog() {
    const existing = await this.prisma.camp.count();
    if (existing < CAMPS.length) {
      this.logger.log(`Catálogo de campamentos incompleto (${existing}/${CAMPS.length}) — sincronizando…`);
    }

    // Siempre sincroniza nombres (corrige copy árabe en producción).
    for (const c of CAMPS) {
      await this.prisma.camp.upsert({
        where: { slug: c.slug },
        update: {
          nameAr: c.nameAr,
          nameEs: c.nameEs,
          nameEn: c.nameEn,
          isTindouf: c.isTindouf,
          isActive: true,
        },
        create: {
          slug: c.slug,
          nameAr: c.nameAr,
          nameEs: c.nameEs,
          nameEn: c.nameEn,
          isTindouf: c.isTindouf,
        },
      });
    }
    await this.redis.del(CAMPS_CACHE_KEY);
    if (existing < CAMPS.length) {
      this.logger.log(`Catálogo de campamentos listo (${CAMPS.length})`);
    }
  }

  async findAll() {
    const cached = await this.redis.get<unknown[]>(CAMPS_CACHE_KEY);
    // Nunca servir caché vacío: en producción se cacheó [] cuando la tabla aún no estaba sembrada.
    if (Array.isArray(cached) && cached.length > 0) return cached;

    const camps = await this.prisma.camp.findMany({
      where: { isActive: true },
      include: { dairas: { orderBy: { slug: 'asc' } } },
      orderBy: { slug: 'asc' },
    });

    if (camps.length > 0) {
      void this.redis.set(CAMPS_CACHE_KEY, camps, CAMPS_TTL);
    } else {
      void this.redis.del(CAMPS_CACHE_KEY);
    }
    return camps;
  }

  async findOne(id: string) {
    const camp = await this.prisma.camp.findUnique({
      where: { id },
      include: {
        dairas: true,
        marketAreas: { where: { isActive: true } },
        pickupPoints: { where: { isActive: true } },
      },
    });
    if (!camp) throw new NotFoundException('Campamento no encontrado');
    return camp;
  }

  findBySlug(slug: string) {
    return this.prisma.camp.findUnique({
      where: { slug },
      include: { dairas: true },
    });
  }
}
