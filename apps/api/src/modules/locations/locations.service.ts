import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  getDairas(campId?: string) {
    return this.prisma.daira.findMany({
      where: campId ? { campId } : undefined,
      include: { camp: { select: { slug: true, nameEs: true } } },
      orderBy: [{ campId: 'asc' }, { slug: 'asc' }],
    });
  }

  getNeighborhoods(campId?: string, dairaId?: string) {
    return this.prisma.neighborhood.findMany({
      where: {
        ...(campId && { campId }),
        ...(dairaId && { dairaId }),
      },
      orderBy: { nameEs: 'asc' },
    });
  }

  getMarketAreas(campId?: string) {
    return this.prisma.marketArea.findMany({
      where: { isActive: true, ...(campId && { campId }) },
      include: { camp: { select: { slug: true, nameEs: true } } },
    });
  }

  getPickupPoints(campId?: string) {
    return this.prisma.pickupPoint.findMany({
      where: { isActive: true, ...(campId && { campId }) },
    });
  }

  getRoutes(originCampId?: string, destinationCampId?: string) {
    return this.prisma.route.findMany({
      where: {
        isActive: true,
        ...(originCampId && { originCampId }),
        ...(destinationCampId && { destinationCampId }),
      },
      include: {
        originCamp: { select: { slug: true, nameEs: true } },
        destinationCamp: { select: { slug: true, nameEs: true } },
      },
    });
  }
}
