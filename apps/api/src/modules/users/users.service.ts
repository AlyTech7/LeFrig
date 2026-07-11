import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, skipTake } from '../../common/utils/pagination';
import { paginationSchema } from '@lefrig/shared';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        where: { isActive: true },
        select: {
          id: true,
          phone: true,
          displayName: true,
          avatarUrl: true,
          roles: true,
          campId: true,
          dairaId: true,
          preferredLanguage: true,
          verificationLevel: true,
          reputationScore: true,
          badges: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        displayName: true,
        avatarUrl: true,
        roles: true,
        campId: true,
        dairaId: true,
        preferredLanguage: true,
        verificationLevel: true,
        reputationScore: true,
        badges: true,
        profile: true,
        createdAt: true,
        camp: { select: { id: true, slug: true, nameEs: true } },
        daira: { select: { id: true, slug: true, nameEs: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateProfile(userId: string, data: { displayName?: string; preferredLanguage?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        preferredLanguage: true,
      },
    });
  }

  async getMe(userId: string) {
    return this.findOne(userId);
  }
}
