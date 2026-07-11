import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisAdapter } from '../../adapters/redis.adapter';

const CAMPS_CACHE_KEY = 'cache:camps:all';
const CAMPS_TTL = 300;

@Injectable()
export class CampsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisAdapter,
  ) {}

  async findAll() {
    const cached = await this.redis.get<unknown[]>(CAMPS_CACHE_KEY);
    if (cached) return cached;

    const camps = await this.prisma.camp.findMany({
      where: { isActive: true },
      include: { dairas: { orderBy: { slug: 'asc' } } },
      orderBy: { slug: 'asc' },
    });

    void this.redis.set(CAMPS_CACHE_KEY, camps, CAMPS_TTL);
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
