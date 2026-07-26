import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TRANSPORT_CORRIDORS,
  TRANSPORT_HUBS,
  TRANSPORT_HUB_ZONES,
  assertRouteMatchesScope,
  createDriverProfileSchema,
  createTransportSchema,
  getTransportHub,
  hubLabel,
  paginationSchema,
  routeScopeForHubs,
  transportCompleteSchema,
} from '@lefrig/shared';
import { paginate, skipTake } from '../../common/utils/pagination';
import { buildTransportReceiptPdf } from './transport-receipt-pdf';

type TripIncludeRow = {
  id: string;
  type: string;
  status: string;
  scope?: string | null;
  completionPin?: string | null;
  requesterConfirmedAt?: Date | null;
  driverConfirmedAt?: Date | null;
  priceEstimate?: { toNumber?: () => number } | number | null;
  originLabel?: string | null;
  destinationLabel?: string | null;
  originHubSlug?: string | null;
  destinationHubSlug?: string | null;
  seatsAvailable?: number | null;
  seatsRequested?: number | null;
  departureAt?: Date | null;
  contactPhone?: string | null;
  requesterId?: string;
  driverId?: string | null;
  originCamp?: { nameEs: string; slug?: string } | null;
  destinationCamp?: { nameEs: string; slug?: string } | null;
  requester?: { displayName: string; id?: string } | null;
  driver?: { displayName: string; id?: string } | null;
};

@Injectable()
export class TransportService {
  constructor(private prisma: PrismaService) {}

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

  private generatePin(): string {
    return String(randomInt(1000, 10000));
  }

  private formatTrip(row: TripIncludeRow, viewerId?: string) {
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

    const isDriver = Boolean(viewerId && row.driverId === viewerId);
    const isRequester = Boolean(viewerId && row.requesterId === viewerId);
    const role = isDriver ? 'driver' : isRequester ? 'requester' : viewerId ? 'other' : null;

    const price =
      row.priceEstimate == null
        ? null
        : typeof row.priceEstimate === 'number'
          ? row.priceEstimate
          : typeof row.priceEstimate.toNumber === 'function'
            ? row.priceEstimate.toNumber()
            : Number(row.priceEstimate);

    const { completionPin, ...rest } = row;

    return {
      ...rest,
      priceEstimate: price,
      originLabel: origin,
      destinationLabel: destination,
      originCamp: origin,
      destinationCamp: destination,
      driverName: row.driver?.displayName,
      requesterName: row.requester?.displayName,
      departureAt: row.departureAt?.toISOString?.() ?? row.departureAt,
      requesterConfirmedAt: row.requesterConfirmedAt?.toISOString?.() ?? row.requesterConfirmedAt,
      driverConfirmedAt: row.driverConfirmedAt?.toISOString?.() ?? row.driverConfirmedAt,
      role,
      myConfirmed: isDriver
        ? Boolean(row.driverConfirmedAt)
        : isRequester
          ? Boolean(row.requesterConfirmedAt)
          : false,
      canConfirm:
        row.status === 'in_progress' &&
        ((isRequester && !row.requesterConfirmedAt) || (isDriver && !row.driverConfirmedAt)),
      canStart: isDriver && row.status === 'accepted',
      canCancel:
        (isRequester || isDriver) &&
        row.status !== 'completed' &&
        row.status !== 'cancelled',
      canClaim: !viewerId
        ? false
        : !row.driverId &&
          (row.status === 'requested' || row.status === 'open') &&
          row.requesterId !== viewerId,
      // Solo el conductor ve el PIN (y solo mientras no esté completado)
      completionPin:
        isDriver && completionPin && row.status !== 'completed' && row.status !== 'cancelled'
          ? completionPin
          : undefined,
      hasCompletionPin: Boolean(completionPin),
    };
  }

  private tripInclude() {
    return {
      originCamp: { select: { slug: true, nameEs: true } },
      destinationCamp: { select: { slug: true, nameEs: true } },
      requester: { select: { displayName: true, id: true } },
      driver: { select: { displayName: true, id: true } },
    } as const;
  }

  async findAll(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);
    const q = query as Record<string, string>;

    const where = {
      ...(q.status && { status: q.status }),
      ...(q.scope && { scope: q.scope }),
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
        include: this.tripInclude(),
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
    return this.prisma.transportRequest
      .findMany({
        where: { OR: [{ requesterId: userId }, { driverId: userId }] },
        include: this.tripInclude(),
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      .then((rows) => rows.map((row) => this.formatTrip(row, userId)));
  }

  async findOne(id: string, viewerId?: string) {
    const req = await this.prisma.transportRequest.findUnique({
      where: { id },
      include: {
        originCamp: true,
        destinationCamp: true,
        pickupPoint: true,
        dropoffPoint: true,
        requester: { select: { displayName: true, id: true } },
        driver: { select: { displayName: true, id: true } },
      },
    });
    if (!req) throw new NotFoundException('Solicitud no encontrada');
    return this.formatTrip(req, viewerId);
  }

  async create(requesterId: string, input: unknown) {
    const data = createTransportSchema.parse(input);
    if (data.originHubSlug === data.destinationHubSlug) {
      throw new BadRequestException('Origen y destino deben ser distintos');
    }

    const originHub = getTransportHub(data.originHubSlug);
    const destHub = getTransportHub(data.destinationHubSlug);
    if (!originHub || !destHub) {
      throw new BadRequestException('Origen o destino no válido');
    }

    const resolved = routeScopeForHubs(data.originHubSlug, data.destinationHubSlug);
    if (resolved === 'invalid') {
      throw new BadRequestException('Ruta no válida');
    }

    if (data.scope) {
      const check = assertRouteMatchesScope(data.scope, data.originHubSlug, data.destinationHubSlug);
      if (!check.ok) throw new BadRequestException(check.reason);
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

    return this.prisma.transportRequest
      .create({
        data: {
          requesterId,
          type,
          scope: resolved,
          originCampId,
          destinationCampId,
          originHubSlug: data.originHubSlug,
          destinationHubSlug: data.destinationHubSlug,
          originLabel: hubLabel(data.originHubSlug),
          destinationLabel: hubLabel(data.destinationHubSlug),
          pickupPointId: data.pickupPointId,
          dropoffPointId: data.dropoffPointId,
          description: data.description,
          priceEstimate: data.priceEstimate,
          seatsRequested: data.seatsRequested,
          seatsAvailable: data.seatsAvailable,
          isSharedRide: type === 'shared_ride' || type === 'collective_taxi',
          packageCapacity: data.packageCapacity,
          departureAt: data.departureAt ? new Date(data.departureAt) : undefined,
          contactPhone: data.contactPhone,
          luggageNote: data.luggageNote,
        },
        include: {
          originCamp: true,
          destinationCamp: true,
          requester: { select: { displayName: true, id: true } },
        },
      })
      .then((row) => this.formatTrip(row, requesterId));
  }

  private async assignWithPin(id: string, driverId: string) {
    const pin = this.generatePin();
    const updated = await this.prisma.transportRequest.update({
      where: { id },
      data: {
        driverId,
        status: 'accepted',
        completionPin: pin,
        requesterConfirmedAt: null,
        driverConfirmedAt: null,
      },
      include: this.tripInclude(),
    });
    return this.formatTrip(updated, driverId);
  }

  async assignDriver(id: string, driverId: string) {
    const trip = await this.prisma.transportRequest.findUnique({ where: { id } });
    if (!trip) throw new NotFoundException('Viaje no encontrado');
    if (trip.status !== 'requested' && trip.status !== 'open') {
      throw new BadRequestException('Este viaje no está disponible para asignar');
    }
    return this.assignWithPin(id, driverId);
  }

  async claimAsDriver(tripId: string, driverUserId: string) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId: driverUserId } });
    if (!profile?.isVerified) {
      throw new ForbiddenException('Necesitas perfil de conductor verificado');
    }
    const trip = await this.prisma.transportRequest.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Viaje no encontrado');
    if (trip.requesterId === driverUserId) {
      throw new ForbiddenException('No puedes aceptar tu propio viaje');
    }
    if (trip.driverId) {
      throw new ForbiddenException('Este viaje ya tiene conductor');
    }
    if (trip.status !== 'requested' && trip.status !== 'open') {
      throw new ForbiddenException('Este viaje no está disponible');
    }
    return this.assignWithPin(tripId, driverUserId);
  }

  async startTrip(tripId: string, userId: string) {
    const trip = await this.prisma.transportRequest.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Viaje no encontrado');
    if (trip.driverId !== userId) {
      throw new ForbiddenException('Solo el conductor puede iniciar el viaje');
    }
    if (trip.status !== 'accepted') {
      throw new BadRequestException('El viaje debe estar aceptado para iniciarlo');
    }
    const updated = await this.prisma.transportRequest.update({
      where: { id: tripId },
      data: { status: 'in_progress' },
      include: this.tripInclude(),
    });
    return this.formatTrip(updated, userId);
  }

  async completeTrip(tripId: string, userId: string, input: unknown) {
    const { pin } = transportCompleteSchema.parse(input);
    const trip = await this.prisma.transportRequest.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Viaje no encontrado');

    const isRequester = trip.requesterId === userId;
    const isDriver = trip.driverId === userId;
    if (!isRequester && !isDriver) {
      throw new ForbiddenException('Solo participantes del viaje pueden confirmar');
    }
    if (trip.status !== 'in_progress') {
      throw new BadRequestException('El viaje debe estar en ruta para confirmar entrega');
    }
    if (!trip.completionPin || trip.completionPin !== pin) {
      throw new BadRequestException('PIN incorrecto');
    }

    const data: {
      requesterConfirmedAt?: Date;
      driverConfirmedAt?: Date;
      status?: string;
    } = {};

    if (isRequester) {
      if (trip.requesterConfirmedAt) throw new BadRequestException('Ya confirmaste la entrega');
      data.requesterConfirmedAt = new Date();
    }
    if (isDriver) {
      if (trip.driverConfirmedAt) throw new BadRequestException('Ya confirmaste la entrega');
      data.driverConfirmedAt = new Date();
    }

    const bothConfirmed =
      (isRequester ? true : Boolean(trip.requesterConfirmedAt)) &&
      (isDriver ? true : Boolean(trip.driverConfirmedAt));

    if (bothConfirmed) {
      data.status = 'completed';
    }

    const updated = await this.prisma.transportRequest.update({
      where: { id: tripId },
      data,
      include: this.tripInclude(),
    });

    if (bothConfirmed && trip.driverId) {
      await this.prisma.driverProfile.updateMany({
        where: { userId: trip.driverId },
        data: { totalTrips: { increment: 1 } },
      });
    }

    return this.formatTrip(updated, userId);
  }

  async cancelTrip(tripId: string, userId: string) {
    const trip = await this.prisma.transportRequest.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Viaje no encontrado');
    if (trip.requesterId !== userId && trip.driverId !== userId) {
      throw new ForbiddenException('Solo participantes pueden cancelar');
    }
    if (trip.status === 'completed' || trip.status === 'cancelled') {
      throw new BadRequestException('Este viaje ya no se puede cancelar');
    }
    const updated = await this.prisma.transportRequest.update({
      where: { id: tripId },
      data: { status: 'cancelled' },
      include: this.tripInclude(),
    });
    return this.formatTrip(updated, userId);
  }

  async getReceiptPdf(tripId: string, userId: string): Promise<Buffer> {
    const trip = await this.prisma.transportRequest.findUnique({
      where: { id: tripId },
      include: {
        requester: { select: { displayName: true } },
        driver: { select: { displayName: true } },
      },
    });
    if (!trip) throw new NotFoundException('Viaje no encontrado');
    if (trip.requesterId !== userId && trip.driverId !== userId) {
      throw new ForbiddenException('Solo participantes pueden descargar el recibo');
    }
    if (trip.status !== 'completed') {
      throw new BadRequestException('El recibo estará disponible cuando el viaje esté completado');
    }

    const origin =
      trip.originLabel ??
      (trip.originHubSlug ? hubLabel(trip.originHubSlug) : null) ??
      'Origen';
    const destination =
      trip.destinationLabel ??
      (trip.destinationHubSlug ? hubLabel(trip.destinationHubSlug) : null) ??
      'Destino';

    return buildTransportReceiptPdf({
      tripId: trip.id,
      origin,
      destination,
      scope: trip.scope ?? 'local',
      type: trip.type,
      requesterName: trip.requester.displayName,
      driverName: trip.driver?.displayName ?? '—',
      priceEstimate: trip.priceEstimate ? Number(trip.priceEstimate) : null,
      completedAt: trip.updatedAt,
    });
  }

  getDrivers(query?: Record<string, string>) {
    const originHub = query?.originHubSlug;
    const destHub = query?.destinationHubSlug;
    const originCampSlug = originHub ? getTransportHub(originHub)?.campSlug : undefined;
    const destCampSlug = destHub ? getTransportHub(destHub)?.campSlug : undefined;

    return this.prisma.driverProfile
      .findMany({
        where: { isVerified: true },
        include: {
          user: { select: { displayName: true, campId: true, phone: true } },
          frequentRoutes: { include: { originCamp: true, destinationCamp: true } },
        },
      })
      .then((drivers) => {
        if (!originHub && !destHub) return drivers;

        const scored = drivers.map((driver) => {
          let score = 0;
          const hubs = new Set(driver.preferredHubSlugs ?? []);
          if (originHub && hubs.has(originHub)) score += 2;
          if (destHub && hubs.has(destHub)) score += 2;

          const routeMatch = driver.frequentRoutes.some((r) => {
            const os = r.originCamp.slug;
            const ds = r.destinationCamp.slug;
            if (originCampSlug && destCampSlug) {
              return (
                (os === originCampSlug && ds === destCampSlug) ||
                (os === destCampSlug && ds === originCampSlug)
              );
            }
            if (originCampSlug) return os === originCampSlug || ds === originCampSlug;
            if (destCampSlug) return os === destCampSlug || ds === destCampSlug;
            return false;
          });
          if (routeMatch) score += 3;

          // Soft match: verified drivers without route still appear with low score
          if (score === 0) score = 0.5;
          return { driver, score };
        });

        return scored
          .sort((a, b) => b.score - a.score)
          .map(({ driver }) => driver);
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

    const preferredHubSlugs = (data.preferredHubSlugs ?? []).filter((slug) => Boolean(getTransportHub(slug)));

    const profile = await this.prisma.driverProfile.upsert({
      where: { userId },
      create: {
        userId,
        vehicleType: data.vehicleType,
        vehiclePlate: data.vehiclePlate,
        licenseNumber: data.licenseNumber,
        seatsCapacity: data.seatsCapacity,
        preferredHubSlugs,
        isVerified: false,
      },
      update: {
        vehicleType: data.vehicleType,
        vehiclePlate: data.vehiclePlate,
        licenseNumber: data.licenseNumber,
        seatsCapacity: data.seatsCapacity,
        ...(data.preferredHubSlugs !== undefined ? { preferredHubSlugs } : {}),
      },
    });

    if (data.routes?.length) {
      const campIds = [
        ...new Set(data.routes.flatMap((r) => [r.originCampId, r.destinationCampId])),
      ];
      const existing = await this.prisma.camp.findMany({
        where: { id: { in: campIds }, isActive: true },
        select: { id: true },
      });
      const valid = new Set(existing.map((c) => c.id));
      const safeRoutes = data.routes.filter(
        (r) =>
          valid.has(r.originCampId) &&
          valid.has(r.destinationCampId) &&
          r.originCampId !== r.destinationCampId,
      );

      if (safeRoutes.length) {
        await this.prisma.frequentRoute.deleteMany({ where: { driverProfileId: profile.id } });
        await this.prisma.frequentRoute.createMany({
          data: safeRoutes.map((r) => ({
            driverProfileId: profile.id,
            originCampId: r.originCampId,
            destinationCampId: r.destinationCampId,
            frequency: r.frequency,
          })),
        });
      }
    }

    return this.prisma.driverProfile.findUniqueOrThrow({
      where: { id: profile.id },
      include: {
        frequentRoutes: { include: { originCamp: true, destinationCamp: true } },
      },
    });
  }
}
