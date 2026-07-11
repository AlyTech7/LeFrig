import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, skipTake } from '../../common/utils/pagination';
import { paginationSchema } from '@lefrig/shared';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);
    const q = query as Record<string, string>;

    const where = {
      isActive: true,
      ...(q.campId && { campId: q.campId }),
      ...(q.jobType && { jobType: q.jobType }),
      ...(q.category && { category: q.category }),
    };

    const [data, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take,
        include: {
          camp: { select: { slug: true, nameEs: true } },
          poster: { select: { displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { camp: true, poster: { select: { displayName: true, phone: true } } },
    });
    if (!job) throw new NotFoundException('Oferta no encontrada');
    return job;
  }

  create(posterId: string, data: {
    campId: string;
    jobType: string;
    category: string;
    title: string;
    description: string;
    salary?: number;
    contactPhone?: string;
  }) {
    return this.prisma.job.create({
      data: { posterId, ...data },
      include: { camp: true },
    });
  }
}
