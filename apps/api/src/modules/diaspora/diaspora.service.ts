import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DiasporaService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.diasporaProfile.findUnique({
      where: { userId },
      include: { orders: { orderBy: { createdAt: 'desc' } } },
    });
    return profile ?? { userId, orders: [] };
  }

  async upsertProfile(userId: string, data: {
    country: string;
    city?: string;
    beneficiaryName?: string;
    beneficiaryPhone?: string;
    preferredCampId?: string;
  }) {
    return this.prisma.diasporaProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  createOrder(userId: string, data: {
    orderType: string;
    description: string;
    budget?: number;
    campId?: string;
  }) {
    return this.prisma.diasporaProfile.findUnique({ where: { userId } }).then(async (profile) => {
      if (!profile) {
        profile = await this.prisma.diasporaProfile.create({
          data: { userId, country: 'Unknown' },
        });
      }
      return this.prisma.diasporaOrder.create({
        data: { profileId: profile.id, ...data },
      });
    });
  }

  getOrders(userId: string) {
    return this.prisma.diasporaOrder.findMany({
      where: { profile: { userId } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
