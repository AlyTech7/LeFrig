import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClerkService } from '../auth/clerk.service';
import {
  TRANSPORT_CORRIDORS,
  TRANSPORT_HUBS,
  TRANSPORT_HUB_ZONES,
  createDriverProfileSchema,
  createTransportSchema,
  getTransportHub,
  hubLabel,
  paginationSchema,
} from '@lefrig/shared';
import { paginate, skipTake } from '../../common/utils/pagination';

@Injectable()
export class TransportService {
  constructor(
    private prisma: PrismaService,
    private clerk: ClerkService,
  ) {}

  getHubCatalog() {
    return {
      zones: TRANSPORT_HUB_ZONES,
      hubs: TRANSPORT_HUBS,
      corridors: TRANSPORT_CORRIDORS,
    };
  }

  private async resolveCampIdFromHub(slug: string): Promise<string | null> {
    const hub = getTransportHub(slug);
    if (!hub?.campSlug) return null;
    const camp = await this.prisma.camp.findUnique({ where: { slug: hub.campSlug }, select: { id: true } });
    return camp?.id ?? null;
  }

  private formatTrip(row: {
    id: string;
    type: string;
    status: string;
    originLabel?: string | null;
    destinationLabel?: string | null;
    originHubSlug?: string | null;
    destinationHubSlug?: string | null;
    seatsAvailable?: number | null;
    seatsRequested?: number | null;
    departureAt?: Date | null;
    originCamp?: { nameEs: string } | null;
    destinationCamp?: { nameEs: string } | null;
    requester?: { displayName: string } | null;
    driver?: { displayName: string } | null;
  }) {
    const origin =
      row.originLabel ??
      (row.originHubSlug ? hubLabel(row.originHubSlug) : null) ??
      row.originCamp?.nameEs ??
      'Origen';
    const destination =
      row.destinationLabel ??
      (row.destinationHubSlug ? hubLabel(row.destinationHubSlug) : null) ??
      row.destinationCamp?.nameEs ??
      'Destino';
    return {
      ...row,
      originLabel: origin,
      destinationLabel: destination,
      originCamp: origin,
      destinationCamp: destination,
      driverName: row.driver?.displayName,
      requesterName: row.requester?.displayName,
      departureAt: row.departureAt?.toISOString(),
    };
  }

  async findAll(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);
    const q = query as Record<string, string>;

    const where = {
      ...(q.status && { status: q.status }),
      ...(q.originCampId && { originCampId: q.originCampId }),
      ...(q.destinationCampId && { destinationCampId: q.destinationCampId }),
      ...(q.originHubSlug && { originHubSlug: q.originHubSlug }),
      ...(q.destinationHubSlug && { destinationHubSlug: q.destinationHubSlug }),
      ...(q.type && { type: q.type }),
    };

    const [data, total] = await Promise.all([
      this.prisma.transportRequest.findMany({
        where,
        skip,
        take,
        include: {
          originCamp: { select: { slug: true, nameEs: true } },
          destinationCamp: { select: { slug: true, nameEs: true } },
          requester: { select: { displayName: true, phone: true } },
          driver: { select: { displayName: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transportRequest.count({ where }),
    ]);

    return paginate(
      data.map((row) => this.formatTrip(row)),
      total,
      page,
      limit,
    );
  }

  findMyTrips(userId: string) {
    return this.prisma.transportRequest.findMany({
      where: { OR: [{ requesterId: userId }, { driverId: userId }] },
      include: {
        originCamp: { select: { nameEs: true } },
        destinationCamp: { select: { nameEs: true } },
        requester: { select: { displayName: true } },
        driver: { select: { displayName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }).then((rows) => rows.map((row) => this.formatTrip(row)));
  }

  async findOne(id: string) {
    const req = await this.prisma.transportRequest.findUnique({
      where: { id },
      include: {
        originCamp: true,
        destinationCamp: true,
        pickupPoint: true,
        dropoffPoint: true,
        requester: { select: { displayName: true, phone: true, id: true } },
        driver: { select: { displayName: true, phone: true, id: true } },
      },
    });
    if (!req) throw new NotFoundException('Solicitud no encontrada');
    return this.formatTrip(req);
  }

  async create(requesterId: string, input: unknown) {
    const data = createTransportSchema.parse(input);
    const originHub = getTransportHub(data.originHubSlug);
    const destHub = getTransportHub(data.destinationHubSlug);
    if (!originHub || !destHub) {
      throw new NotFoundException('Origen o destino no válido');
    }

    const originCampId = data.originCampId ?? (await this.resolveCampIdFromHub(data.originHubSlug));
    const destinationCampId =
      data.destinationCampId ?? (await this.resolveCampIdFromHub(data.destinationHubSlug));

    const type =
      originHub.zone === 'tindouf' || destHub.zone === 'tindouf'
        ? data.type === 'package'
          ? 'tindouf_import'
          : data.type
        : data.type;

    return this.prisma.transportRequest.create({
      data: {
        requesterId,
        type,
        originCampId,
        destinationCampId,
        originHubSlug: data.originHubSlug,
        destinationHubSlug: data.destinationHubSlug,
        originLabel: hubLabel(data.originHubSlug),
        destinationLabel: hubLabel(data.destinationHubSlug),
        pickupPointId: data.pickupPointId,
        dropoffPointId: data.dropoffPointId,
        description: data.description,
        seatsRequested: data.seatsRequested,
        seatsAvailable: data.seatsAvailable,
        isSharedRide: type === 'shared_ride' || type === 'collective_taxi',
        packageCapacity: data.packageCapacity,
        departureAt: data.departureAt ? new Date(data.departureAt) : undefined,
        contactPhone: data.contactPhone,
        luggageNote: data.luggageNote,
      },
      include: { originCamp: true, destinationCamp: true, requester: { select: { displayName: true } } },
    }).then((row) => this.formatTrip(row));
  }

  async assignDriver(id: string, driverId: string) {
    const updated = await this.prisma.transportRequest.update({
      where: { id },
      data: { driverId, status: 'accepted' },
      include: {
        originCamp: { select: { nameEs: true } },
        destinationCamp: { select: { nameEs: true } },
        driver: { select: { displayName: true, phone: true } },
        requester: { select: { displayName: true, phone: true } },
      },
    });
    return this.formatTrip(updated);
  }

  async claimAsDriver(tripId: string, driverUserId: string) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId: driverUserId } });
    if (!profile?.isVerified) {
      throw new NotFoundException('Necesitas perfil de conductor verificado');
    }
    return this.assignDriver(tripId, driverUserId);
  }

  getDrivers(query?: Record<string, string>) {
    const originHub = query?.originHubSlug;
    const destHub = query?.destinationHubSlug;

    return this.prisma.driverProfile
      .findMany({
        where: { isVerified: true },
        include: {
          user: { select: { displayName: true, phone: true, campId: true } },
          frequentRoutes: { include: { originCamp: true, destinationCamp: true } },
        },
      })
      .then((drivers) => {
        if (!originHub && !destHub) return drivers;
        return drivers.filter((driver) =>
          driver.frequentRoutes.some((r) => {
            const os = r.originCamp.slug;
            const ds = r.destinationCamp.slug;
            if (originHub && destHub) {
              return (os === originHub && ds === destHub) || (os === destHub && ds === originHub);
            }
            if (originHub) return os === originHub || ds === originHub;
            if (destHub) return os === destHub || ds === destHub;
            return false;
          }),
        );
      });
  }

  async getMyDriverProfile(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
      include: {
        frequentRoutes: { include: { originCamp: true, destinationCamp: true } },
      },
    });
    if (!profile) throw new NotFoundException('No tienes perfil de conductor');
    return profile;
  }

  async registerDriver(userId: string, input: unknown) {
    const data = createDriverProfileSchema.parse(input);

    const profile = await this.prisma.driverProfile.upsert({
      where: { userId },
      create: {
        userId,
        vehicleType: data.vehicleType,
        vehiclePlate: data.vehiclePlate,
        licenseNumber: data.licenseNumber,
        seatsCapacity: data.seatsCapacity,
        isVerified: false,
      },
      update: {
        vehicleType: data.vehicleType,
        vehiclePlate: data.vehiclePlate,
        licenseNumber: data.licenseNumber,
        seatsCapacity: data.seatsCapacity,
      },
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.roles.includes('driver')) {
      const roles = [...user.roles, 'driver'];
      await this.prisma.user.update({ where: { id: userId }, data: { roles } });
      if (user.clerkId) {
        await this.clerk.updateClerkRoles(user.clerkId, roles);
      }
    }

    if (data.routes?.length) {
      await this.prisma.frequentRoute.deleteMany({ where: { driverProfileId: profile.id } });
      await this.prisma.frequentRoute.createMany({
        data: data.routes.map((r) => ({
          driverProfileId: profile.id,
          originCampId: r.originCampId,
          destinationCampId: r.destinationCampId,
          frequency: r.frequency,
        })),
      });
    }

    return this.prisma.driverProfile.findUniqueOrThrow({
      where: { id: profile.id },
      include: {
        frequentRoutes: { include: { originCamp: true, destinationCamp: true } },
      },
    });
  }
}
