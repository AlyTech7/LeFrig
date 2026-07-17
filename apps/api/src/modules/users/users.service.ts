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

  async getHub(userId: string) {
    const [
      user,
      driver,
      listingsActive,
      ordersAsBuyer,
      shops,
      transportOpen,
      unreadNotifications,
      recentOrders,
      recentListings,
      recentTrips,
    ] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          phone: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          roles: true,
          campId: true,
          preferredLanguage: true,
          verificationLevel: true,
          reputationScore: true,
          badges: true,
          createdAt: true,
          camp: { select: { id: true, slug: true, nameEs: true, nameAr: true, nameEn: true } },
          userBadges: { select: { badge: true, awardedAt: true, reason: true } },
        },
      }),
      this.prisma.driverProfile.findUnique({
        where: { userId },
        include: {
          frequentRoutes: {
            include: {
              originCamp: { select: { id: true, nameEs: true, slug: true } },
              destinationCamp: { select: { id: true, nameEs: true, slug: true } },
            },
          },
        },
      }),
      this.prisma.listing.count({ where: { sellerId: userId, status: 'active' } }),
      this.prisma.order.count({ where: { buyerId: userId } }),
      this.prisma.shop.count({ where: { ownerId: userId, isActive: true } }),
      this.prisma.transportRequest.count({
        where: {
          OR: [{ requesterId: userId }, { driverId: userId }],
          status: { in: ['requested', 'accepted', 'in_progress'] },
        },
      }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
      this.prisma.order.findMany({
        where: { buyerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          shop: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.listing.findMany({
        where: { sellerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, title: true, status: true, price: true, createdAt: true },
      }),
      this.prisma.transportRequest.findMany({
        where: { OR: [{ requesterId: userId }, { driverId: userId }] },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          status: true,
          originLabel: true,
          destinationLabel: true,
          originHubSlug: true,
          destinationHubSlug: true,
          type: true,
          createdAt: true,
        },
      }),
    ]);

    const driverStatus = !driver
      ? 'none'
      : driver.isVerified
        ? 'verified'
        : 'pending';

    return {
      user,
      driver: driver
        ? {
            id: driver.id,
            vehicleType: driver.vehicleType,
            vehiclePlate: driver.vehiclePlate,
            licenseNumber: driver.licenseNumber,
            seatsCapacity: driver.seatsCapacity,
            isVerified: driver.isVerified,
            rating: driver.rating,
            totalTrips: driver.totalTrips,
            status: driverStatus,
            frequentRoutes: driver.frequentRoutes.map((r) => ({
              id: r.id,
              frequency: r.frequency,
              origin: r.originCamp,
              destination: r.destinationCamp,
            })),
          }
        : null,
      driverStatus,
      stats: {
        listingsActive,
        ordersAsBuyer,
        shops,
        transportOpen,
        unreadNotifications,
      },
      recent: {
        orders: recentOrders,
        listings: recentListings,
        trips: recentTrips.map((t) => ({
          id: t.id,
          status: t.status,
          type: t.type,
          label: `${t.originLabel ?? t.originHubSlug ?? '?'} → ${t.destinationLabel ?? t.destinationHubSlug ?? '?'}`,
          createdAt: t.createdAt,
        })),
      },
    };
  }
}
