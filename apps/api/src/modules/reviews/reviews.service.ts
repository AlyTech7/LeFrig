import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createReviewSchema } from '@lefrig/shared';
import { TrustScoreService } from './trust-score.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private trustScore: TrustScoreService,
  ) {}

  async create(authorId: string, input: unknown) {
    const data = createReviewSchema.parse(input);

    const review = await this.prisma.review.create({
      data: {
        authorId,
        targetType: data.targetType,
        targetId: data.targetId,
        targetUserId: data.targetType === 'user' ? data.targetId : undefined,
        serviceId: data.targetType === 'service' ? data.targetId : undefined,
        rating: data.rating,
        comment: data.comment,
      },
    });

    if (data.targetType === 'user') {
      await this.trustScore.recalculate(data.targetId);
    }

    return review;
  }

  findByTarget(targetType: string, targetId: string) {
    return this.prisma.review.findMany({
      where: { targetType, targetId },
      include: { author: { select: { displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTrustScore(userId: string) {
    const score = await this.trustScore.recalculate(userId);
    const badges = await this.prisma.userBadge.findMany({ where: { userId } });
    return { userId, reputationScore: score, badges };
  }
}
