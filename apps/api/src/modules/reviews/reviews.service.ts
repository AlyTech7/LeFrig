import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createReviewSchema, OrderStatus, TransportStatus } from '@lefrig/shared';
import { TrustScoreService } from './trust-score.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private trustScore: TrustScoreService,
  ) {}

  async create(authorId: string, input: unknown) {
    const data = createReviewSchema.parse(input);
    if (data.targetId === authorId && data.targetType === 'user') {
      throw new BadRequestException('No puedes reseñarte a ti mismo');
    }

    await this.assertCompletedInteraction(authorId, data.targetType, data.targetId);

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

  /** Exige una transacción real (efectivo confirmado, pedido o viaje) antes de reseñar. */
  private async assertCompletedInteraction(
    authorId: string,
    targetType: string,
    targetId: string,
  ): Promise<void> {
    const ok = await this.hasCompletedInteraction(authorId, targetType, targetId);
    if (!ok) {
      throw new ForbiddenException(
        'Solo puedes reseñar tras una transacción completada (efectivo, pedido o viaje)',
      );
    }
  }

  private async hasCompletedInteraction(
    authorId: string,
    targetType: string,
    targetId: string,
  ): Promise<boolean> {
    if (targetType === 'user' || targetType === 'driver') {
      const counterpartyId =
        targetType === 'driver'
          ? await this.resolveDriverUserId(targetId)
          : targetId;
      if (!counterpartyId) return false;

      const cash = await this.prisma.cashAgreement.findFirst({
        where: {
          status: 'confirmed',
          OR: [
            { buyerId: authorId, sellerId: counterpartyId },
            { sellerId: authorId, buyerId: counterpartyId },
          ],
        },
        select: { id: true },
      });
      if (cash) return true;

      const order = await this.prisma.order.findFirst({
        where: {
          buyerId: authorId,
          status: { in: [OrderStatus.DELIVERED, OrderStatus.CONFIRMED] },
          shop: { ownerId: counterpartyId },
        },
        select: { id: true },
      });
      if (order) return true;

      const trip = await this.prisma.transportRequest.findFirst({
        where: {
          status: {
            in: [
              TransportStatus.COMPLETED,
              TransportStatus.IN_PROGRESS,
              TransportStatus.ACCEPTED,
            ],
          },
          OR: [
            { requesterId: authorId, driverId: counterpartyId },
            { driverId: authorId, requesterId: counterpartyId },
          ],
        },
        select: { id: true },
      });
      return Boolean(trip);
    }

    if (targetType === 'shop') {
      const order = await this.prisma.order.findFirst({
        where: {
          shopId: targetId,
          buyerId: authorId,
          status: { in: [OrderStatus.DELIVERED, OrderStatus.CONFIRMED] },
        },
        select: { id: true },
      });
      return Boolean(order);
    }

    if (targetType === 'service') {
      const service = await this.prisma.service.findUnique({
        where: { id: targetId },
        select: { providerId: true },
      });
      if (!service?.providerId) return false;
      return this.hasCompletedInteraction(authorId, 'user', service.providerId);
    }

    return false;
  }

  private async resolveDriverUserId(targetId: string): Promise<string | null> {
    const profile = await this.prisma.driverProfile.findFirst({
      where: { OR: [{ id: targetId }, { userId: targetId }] },
      select: { userId: true },
    });
    return profile?.userId ?? targetId;
  }
}
