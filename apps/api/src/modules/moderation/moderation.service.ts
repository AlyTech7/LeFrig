import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, skipTake } from '../../common/utils/pagination';
import { paginationSchema } from '@lefrig/shared';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async getReports(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);
    const status = (query as Record<string, string>)?.status;

    const where = { ...(status && { status }) };
    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take,
        include: { reporter: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  createReport(reporterId: string, data: {
    targetType: string;
    targetId: string;
    targetUserId?: string;
    reason: string;
    details?: string;
  }) {
    return this.prisma.report.create({ data: { reporterId, ...data } });
  }

  async reviewReport(reportId: string, moderatorId: string, action: string, notes?: string) {
    const report = await this.prisma.report.update({
      where: { id: reportId },
      data: { status: action, reviewedAt: new Date() },
    });

    await this.prisma.moderationLog.create({
      data: {
        moderatorId,
        action,
        targetType: report.targetType,
        targetId: report.targetId,
        notes,
      },
    });

    return report;
  }

  getLogs() {
    return this.prisma.moderationLog.findMany({
      include: { moderator: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
