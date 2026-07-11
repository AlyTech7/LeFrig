import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TrustScoreService {
  constructor(private prisma: PrismaService) {}

  async recalculate(userId: string): Promise<number> {
    const reviews = await this.prisma.review.findMany({
      where: { targetUserId: userId },
      select: { rating: true },
    });

    const badges = await this.prisma.userBadge.count({ where: { userId } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    let score = 50;
    if (reviews.length) {
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      score = avg * 15 + 10;
    }

    score += badges * 5;
    if (user?.verificationLevel === 'verified') score += 10;
    if (user?.verificationLevel === 'partner') score += 15;

    score = Math.min(100, Math.max(0, score));

    await this.prisma.user.update({
      where: { id: userId },
      data: { reputationScore: score },
    });

    return score;
  }
}
