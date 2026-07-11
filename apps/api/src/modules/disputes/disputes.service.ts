import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createDisputeSchema } from '@lefrig/shared';

@Injectable()
export class DisputesService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.dispute.findMany({
      where: { OR: [{ openerId: userId }, { respondentId: userId }] },
      include: { evidence: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        opener: { select: { displayName: true } },
        respondent: { select: { displayName: true } },
        evidence: true,
      },
    });
    if (!dispute) throw new NotFoundException('Disputa no encontrada');
    return dispute;
  }

  create(openerId: string, input: unknown) {
    const data = createDisputeSchema.parse(input);
    return this.prisma.dispute.create({
      data: {
        openerId,
        respondentId: data.respondentId,
        reason: data.reason,
        description: data.description,
        listingId: data.listingId,
        orderId: data.orderId,
        transportId: data.transportId,
      },
    });
  }

  addEvidence(disputeId: string, data: { type: string; url?: string; content?: string }) {
    return this.prisma.disputeEvidence.create({
      data: { disputeId, ...data },
    });
  }

  resolve(id: string, resolution: string) {
    return this.prisma.dispute.update({
      where: { id },
      data: { status: 'resolved', resolution, resolvedAt: new Date() },
    });
  }
}
