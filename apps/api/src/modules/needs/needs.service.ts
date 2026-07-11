import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createNeedSchema, paginationSchema } from '@lefrig/shared';
import { paginate, skipTake } from '../../common/utils/pagination';
import { SmartMatchingService } from './smart-matching.service';

@Injectable()
export class NeedsService {
  constructor(
    private prisma: PrismaService,
    private matching: SmartMatchingService,
  ) {}

  async findAll(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);
    const q = query as Record<string, string>;

    const where = {
      status: 'open',
      ...(q.campId && { campId: q.campId }),
      ...(q.type && { type: q.type }),
    };

    const [data, total] = await Promise.all([
      this.prisma.needRequest.findMany({
        where,
        skip,
        take,
        include: {
          requester: { select: { displayName: true } },
          camp: { select: { nameEs: true } },
          _count: { select: { offers: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.needRequest.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const need = await this.prisma.needRequest.findUnique({
      where: { id },
      include: { offers: { include: { offerer: { select: { displayName: true } } } }, camp: true },
    });
    if (!need) throw new NotFoundException('Necesidad no encontrada');
    return need;
  }

  create(requesterId: string, input: unknown) {
    const data = createNeedSchema.parse(input);
    return this.prisma.needRequest.create({
      data: { requesterId, ...data },
      include: { camp: true },
    });
  }

  createOffer(needRequestId: string, offererId: string, message: string, priceEstimate?: number) {
    return this.prisma.needOffer.create({
      data: { needRequestId, offererId, message, priceEstimate },
    });
  }

  getMatches(needId: string) {
    return this.matching.findMatches(needId);
  }
}
