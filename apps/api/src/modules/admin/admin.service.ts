import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { paginate, skipTake } from '../../common/utils/pagination';
import { DEFAULT_CURRENCY, paginationSchema, TrustBadge } from '@lefrig/shared';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async getDashboard() {
    const [
      usersCount,
      listingsCount,
      ordersCount,
      shopsCount,
      transportCount,
      pendingReports,
      openDisputes,
      pendingListings,
      pendingCashAgreements,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.listing.count({ where: { status: 'active' } }),
      this.prisma.order.count(),
      this.prisma.shop.count({ where: { isActive: true } }),
      this.prisma.transportRequest.count({ where: { status: { in: ['requested', 'accepted'] } } }),
      this.prisma.report.count({ where: { status: 'pending' } }),
      this.prisma.dispute.count({ where: { status: { in: ['open', 'mediation'] } } }),
      this.prisma.listing.count({ where: { status: { in: ['draft', 'pending_review'] } } }),
      this.prisma.cashAgreement.count({ where: { status: { not: 'confirmed' } } }),
    ]);

    return {
      usersCount,
      listingsCount,
      ordersCount,
      shopsCount,
      transportCount,
      pendingReports,
      openDisputes,
      pendingListings,
      pendingCashAgreements,
    };
  }

  async getOverview() {
    const metrics = await this.getDashboard();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      recentReports,
      recentOrders,
      recentUsers,
      campUserCounts,
      listingsByStatus,
      ordersLast7Days,
      pendingListings,
      camps,
    ] = await Promise.all([
      this.prisma.report.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { reporter: { select: { displayName: true } } },
      }),
      this.prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          shop: { select: { name: true, camp: { select: { nameEs: true } } } },
          buyer: { select: { displayName: true } },
        },
      }),
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, displayName: true, verificationLevel: true, createdAt: true },
      }),
      this.prisma.user.groupBy({
        by: ['campId'],
        _count: { id: true },
        where: { campId: { not: null } },
      }),
      this.prisma.listing.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.order.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.listing.count({ where: { status: { in: ['draft', 'pending_review'] } } }),
      this.prisma.camp.findMany({
        where: { isActive: true },
        select: { id: true, nameEs: true, slug: true },
      }),
    ]);

    const campMap = Object.fromEntries(camps.map((c) => [c.id, c.nameEs]));
    const campActivity = campUserCounts
      .filter((c) => c.campId)
      .map((c) => ({
        campId: c.campId!,
        campName: campMap[c.campId!] ?? '—',
        users: c._count.id,
      }))
      .sort((a, b) => b.users - a.users);

    const weeklyTrend = await this.getWeeklyOrderTrend();

    return {
      metrics: { ...metrics, pendingListings, ordersLast7Days },
      campActivity,
      listingsByStatus: listingsByStatus.map((l) => ({ status: l.status, count: l._count.id })),
      weeklyTrend,
      recentActivity: [
        ...recentReports.map((r) => ({
          id: r.id,
          type: 'report' as const,
          title: `Reporte: ${r.reason}`,
          subtitle: r.reporter.displayName,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        })),
        ...recentOrders.map((o) => ({
          id: o.id,
          type: 'order' as const,
          title: `Pedido ${o.shop.name}`,
          subtitle: `${o.buyer.displayName} · ${Number(o.totalAmount).toLocaleString()} ${DEFAULT_CURRENCY}`,
          status: o.status,
          createdAt: o.createdAt.toISOString(),
        })),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
      recentUsers: recentUsers.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
    };
  }

  private async getWeeklyOrderTrend() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);

    const rows = await this.prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT date_trunc('day', created_at) AS day, COUNT(*)::bigint AS count
      FROM orders
      WHERE created_at >= ${start}
      GROUP BY 1
      ORDER BY 1
    `;

    const byDay = new Map(
      rows.map((r) => [new Date(r.day).toISOString().slice(0, 10), Number(r.count)]),
    );

    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        label: d.toLocaleDateString('es-ES', { weekday: 'short' }),
        count: byDay.get(key) ?? 0,
      });
    }
    return days;
  }

  async listUsers(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);
    const q = query as Record<string, string>;
    const campId = q.campId;
    const search = q.search?.trim();

    const where = {
      ...(campId && { campId }),
      ...(search && {
        OR: [
          { displayName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { camp: { select: { nameEs: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(
      data.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        email: u.email,
        phone: u.phone,
        camp: u.camp?.nameEs ?? null,
        campId: u.campId,
        roles: u.roles,
        verificationLevel: u.verificationLevel,
        reputationScore: u.reputationScore,
        isActive: u.isActive,
        bannedAt: u.bannedAt?.toISOString() ?? null,
        banReason: u.banReason,
        suspendedUntil: u.suspendedUntil?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    );
  }

  async listListings(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);
    const q = query as Record<string, string>;
    const status = q.status;
    const campId = q.campId;

    const where = {
      ...(status && status !== 'all' && { status }),
      ...(campId && { campId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: { select: { displayName: true } },
          camp: { select: { nameEs: true } },
          category: { select: { slug: true, nameEs: true } },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return paginate(
      data.map((l) => ({
        id: l.id,
        title: l.title,
        price: Number(l.price),
        currency: l.currency,
        status: l.status,
        camp: l.camp.nameEs,
        seller: l.seller.displayName,
        category: l.category.nameEs,
        viewCount: l.viewCount,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    );
  }

  updateListingStatus(id: string, status: string) {
    return this.prisma.listing.update({ where: { id }, data: { status } });
  }

  async listOrders(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);
    const q = query as Record<string, string>;

    const where = {
      ...(q.status && { status: q.status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          shop: { select: { name: true, camp: { select: { nameEs: true } } } },
          buyer: { select: { displayName: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginate(
      data.map((o) => ({
        id: o.id,
        shop: o.shop.name,
        camp: o.shop.camp.nameEs,
        buyer: o.buyer.displayName,
        total: Number(o.totalAmount),
        currency: o.currency,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    );
  }

  async listDisputes(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);
    const q = query as Record<string, string>;

    const where = {
      ...(q.status && { status: q.status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          opener: { select: { displayName: true } },
          respondent: { select: { displayName: true } },
          order: { select: { totalAmount: true } },
        },
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return paginate(
      data.map((d) => ({
        id: d.id,
        reason: d.reason,
        status: d.status,
        type: d.orderId ? 'order' : d.listingId ? 'listing' : d.transportId ? 'transport' : 'other',
        opener: d.opener.displayName,
        respondent: d.respondent.displayName,
        parties: `${d.opener.displayName} vs ${d.respondent.displayName}`,
        amount: d.order ? Number(d.order.totalAmount) : null,
        createdAt: d.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    );
  }

  async listShops(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);

    const [data, total] = await Promise.all([
      this.prisma.shop.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          camp: { select: { nameEs: true } },
          owner: { select: { displayName: true } },
          _count: { select: { products: true } },
        },
      }),
      this.prisma.shop.count(),
    ]);

    return paginate(
      data.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        camp: s.camp.nameEs,
        owner: s.owner.displayName,
        verified: s.verified,
        acceptsCash: s.acceptsCash,
        acceptsFiado: s.acceptsFiado,
        acceptsVouchers: s.acceptsVouchers,
        productsCount: s._count.products,
        isActive: s.isActive,
      })),
      total,
      page,
      limit,
    );
  }

  async assignTransport(id: string, driverId: string) {
    const transport = await this.prisma.transportRequest.findUnique({ where: { id } });
    if (!transport) throw new NotFoundException('Solicitud de transporte no encontrada');

    return this.prisma.transportRequest.update({
      where: { id },
      data: { driverId, status: 'accepted' },
      include: {
        originCamp: { select: { nameEs: true } },
        destinationCamp: { select: { nameEs: true } },
        requester: { select: { displayName: true } },
        driver: { select: { displayName: true } },
      },
    });
  }

  async listTransport(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);

    const [data, total] = await Promise.all([
      this.prisma.transportRequest.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          originCamp: { select: { nameEs: true } },
          destinationCamp: { select: { nameEs: true } },
          requester: { select: { displayName: true } },
          driver: { select: { displayName: true } },
        },
      }),
      this.prisma.transportRequest.count(),
    ]);

    return paginate(
      data.map((t) => ({
        id: t.id,
        type: t.type,
        status: t.status,
        originCamp: t.originLabel ?? t.originCamp?.nameEs ?? t.originHubSlug ?? '—',
        destinationCamp: t.destinationLabel ?? t.destinationCamp?.nameEs ?? t.destinationHubSlug ?? '—',
        requester: t.requester.displayName,
        driver: t.driver?.displayName ?? null,
        priceEstimate: t.priceEstimate ? Number(t.priceEstimate) : null,
        seatsAvailable: t.seatsAvailable,
        createdAt: t.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    );
  }

  async listCamps() {
    const camps = await this.prisma.camp.findMany({
      where: { isActive: true },
      orderBy: { nameEs: 'asc' },
      include: {
        _count: {
          select: { users: true, listings: true, shops: true },
        },
      },
    });

    return camps.map((c) => ({
      id: c.id,
      slug: c.slug,
      nameEs: c.nameEs,
      nameAr: c.nameAr,
      isTindouf: c.isTindouf,
      users: c._count.users,
      listings: c._count.listings,
      shops: c._count.shops,
    }));
  }

  logAccess(adminId: string, action: string, resource?: string, ipAddress?: string) {
    return this.prisma.adminAccessLog.create({
      data: { adminId, action, resource, ipAddress },
    });
  }

  getAccessLogs() {
    return this.prisma.adminAccessLog.findMany({
      include: { admin: { select: { displayName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async verifyUser(userId: string, level: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { verificationLevel: level },
    });
  }

  async setUserBan(
    userId: string,
    moderatorId: string,
    opts: { banned: boolean; reason?: string; suspendedUntil?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const suspendedUntil = opts.suspendedUntil ? new Date(opts.suspendedUntil) : null;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: opts.banned
        ? { bannedAt: new Date(), banReason: opts.reason ?? null, suspendedUntil: null, isActive: false }
        : suspendedUntil
          ? { bannedAt: null, banReason: opts.reason ?? null, suspendedUntil, isActive: true }
          : { bannedAt: null, banReason: null, suspendedUntil: null, isActive: true },
      select: {
        id: true,
        displayName: true,
        bannedAt: true,
        banReason: true,
        suspendedUntil: true,
        isActive: true,
      },
    });

    await this.prisma.moderationLog.create({
      data: {
        moderatorId,
        action: opts.banned ? 'ban_user' : suspendedUntil ? 'suspend_user' : 'unban_user',
        targetType: 'user',
        targetId: userId,
        notes: opts.reason,
      },
    });

    return updated;
  }

  async listDrivers(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);
    const q = query as Record<string, string>;
    const verified = q.verified;

    const where = {
      ...(verified === 'true' && { isVerified: true }),
      ...(verified === 'false' && { isVerified: false }),
    };

    const [data, total] = await Promise.all([
      this.prisma.driverProfile.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, displayName: true, phone: true, camp: { select: { nameEs: true } } } },
          frequentRoutes: {
            include: { originCamp: { select: { nameEs: true } }, destinationCamp: { select: { nameEs: true } } },
          },
        },
      }),
      this.prisma.driverProfile.count({ where }),
    ]);

    return paginate(
      data.map((d) => ({
        id: d.id,
        userId: d.userId,
        displayName: d.user.displayName,
        phone: d.user.phone,
        camp: d.user.camp?.nameEs ?? null,
        vehicleType: d.vehicleType,
        vehiclePlate: d.vehiclePlate,
        seatsCapacity: d.seatsCapacity,
        isVerified: d.isVerified,
        rating: d.rating,
        totalTrips: d.totalTrips,
        routes: d.frequentRoutes.map(
          (r) => `${r.originCamp.nameEs} → ${r.destinationCamp.nameEs}`,
        ),
        createdAt: d.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    );
  }

  async verifyDriver(userId: string, verified: boolean) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Perfil de conductor no encontrado');

    const updated = await this.prisma.driverProfile.update({
      where: { userId },
      data: {
        isVerified: verified,
        verificationStatus: verified ? 'verified' : 'basic',
        rejectionReason: verified ? null : undefined,
      },
      include: { user: { select: { displayName: true, roles: true } } },
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (verified) {
      if (!user.roles.includes('driver')) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { roles: [...user.roles, 'driver'] },
        });
      }
      await this.prisma.userBadge.upsert({
        where: { userId_badge: { userId, badge: TrustBadge.DRIVER_VERIFIED } },
        update: { reason: 'Verificado por admin Lefrig' },
        create: {
          userId,
          badge: TrustBadge.DRIVER_VERIFIED,
          reason: 'Verificado por admin Lefrig',
        },
      });
      if (!user.badges.includes(TrustBadge.DRIVER_VERIFIED)) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { badges: [...user.badges, TrustBadge.DRIVER_VERIFIED] },
        });
      }
      await this.notifications.create(userId, {
        type: 'driver_verified',
        title: '¡Eres conductor verificado!',
        body: 'Lefrig ha aprobado tu solicitud. Ya puedes gestionar rutas y aceptar viajes.',
        data: { href: '/me/driver', mobileHref: '/transport/garage' },
      });
    } else {
      await this.prisma.userBadge.deleteMany({
        where: { userId, badge: TrustBadge.DRIVER_VERIFIED },
      });
      if (user.badges.includes(TrustBadge.DRIVER_VERIFIED)) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { badges: user.badges.filter((b) => b !== TrustBadge.DRIVER_VERIFIED) },
        });
      }
      await this.notifications.create(userId, {
        type: 'driver_revoked',
        title: 'Verificación de conductor retirada',
        body: 'Tu perfil de conductor ya no está verificado. Contacta con soporte si crees que es un error.',
        data: { href: '/me/driver', mobileHref: '/transport/garage' },
      });
    }

    return updated;
  }

  async listJobs(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);
    const q = query as Record<string, string>;

    const where = {
      ...(q.jobType && { jobType: q.jobType }),
      ...(q.active === 'true' && { isActive: true }),
      ...(q.active === 'false' && { isActive: false }),
    };

    const [data, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          poster: { select: { displayName: true } },
          camp: { select: { nameEs: true } },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return paginate(
      data.map((j) => ({
        id: j.id,
        title: j.title,
        jobType: j.jobType,
        category: j.category,
        salary: j.salary != null ? Number(j.salary) : null,
        currency: j.currency,
        camp: j.camp.nameEs,
        poster: j.poster.displayName,
        isActive: j.isActive,
        createdAt: j.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    );
  }

  toggleJobActive(id: string, isActive: boolean) {
    return this.prisma.job.update({ where: { id }, data: { isActive } });
  }

  async listNeeds(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);
    const q = query as Record<string, string>;

    const where = {
      ...(q.status && { status: q.status }),
      ...(q.type && { type: q.type }),
    };

    const [data, total] = await Promise.all([
      this.prisma.needRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: { select: { displayName: true } },
          camp: { select: { nameEs: true } },
          _count: { select: { offers: true } },
        },
      }),
      this.prisma.needRequest.count({ where }),
    ]);

    return paginate(
      data.map((n) => ({
        id: n.id,
        title: n.title,
        type: n.type,
        status: n.status,
        camp: n.camp.nameEs,
        requester: n.requester.displayName,
        offersCount: n._count.offers,
        createdAt: n.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    );
  }

  updateNeedStatus(id: string, status: string) {
    return this.prisma.needRequest.update({ where: { id }, data: { status } });
  }

  async listCommunityPosts(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);
    const q = query as Record<string, string>;

    const where = {
      ...(q.campId && { campId: q.campId }),
      ...(q.postType && { postType: q.postType }),
    };

    const [data, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        skip,
        take,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: {
          author: { select: { displayName: true } },
          camp: { select: { nameEs: true } },
        },
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    return paginate(
      data.map((p) => ({
        id: p.id,
        title: p.title,
        postType: p.postType,
        camp: p.camp.nameEs,
        author: p.author.displayName,
        isPinned: p.isPinned,
        createdAt: p.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    );
  }

  toggleCommunityPin(id: string, isPinned: boolean) {
    return this.prisma.communityPost.update({ where: { id }, data: { isPinned } });
  }

  deleteCommunityPost(id: string) {
    return this.prisma.communityPost.delete({ where: { id } });
  }

  async listDiasporaOrders(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);
    const q = query as Record<string, string>;

    const where = {
      ...(q.status && { status: q.status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.diasporaOrder.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: {
            include: {
              user: { select: { displayName: true, email: true } },
            },
          },
        },
      }),
      this.prisma.diasporaOrder.count({ where }),
    ]);

    const campIds = [...new Set(data.map((o) => o.campId).filter(Boolean))] as string[];
    const camps =
      campIds.length > 0
        ? await this.prisma.camp.findMany({ where: { id: { in: campIds } }, select: { id: true, nameEs: true } })
        : [];
    const campMap = new Map(camps.map((c) => [c.id, c.nameEs]));

    return paginate(
      data.map((o) => ({
        id: o.id,
        orderType: o.orderType,
        description: o.description,
        budget: o.budget != null ? Number(o.budget) : null,
        status: o.status,
        beneficiary: o.profile.beneficiaryName ?? o.profile.user.displayName,
        diasporaUser: o.profile.user.displayName,
        camp: o.campId ? (campMap.get(o.campId) ?? '—') : '—',
        createdAt: o.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    );
  }

  updateDiasporaOrderStatus(id: string, status: string) {
    return this.prisma.diasporaOrder.update({ where: { id }, data: { status } });
  }

  async listVouchers(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);

    const [data, total] = await Promise.all([
      this.prisma.voucher.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          program: { select: { name: true } },
          user: { select: { displayName: true } },
        },
      }),
      this.prisma.voucher.count(),
    ]);

    return paginate(
      data.map((v) => ({
        id: v.id,
        code: v.code,
        balance: Number(v.balance),
        status: v.status,
        program: v.program.name,
        holder: v.user?.displayName ?? '—',
        expiresAt: v.expiresAt.toISOString(),
      })),
      total,
      page,
      limit,
    );
  }

  updateOrderStatus(id: string, status: string) {
    return this.prisma.order.update({ where: { id }, data: { status } });
  }

  resolveDispute(id: string, resolution: string) {
    return this.prisma.dispute.update({
      where: { id },
      data: { status: 'resolved', resolution, resolvedAt: new Date() },
    });
  }

  async listCashAgreements(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);
    const q = query as Record<string, string>;

    const where = {
      ...(q.status && { status: q.status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.cashAgreement.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { displayName: true } },
          seller: { select: { displayName: true } },
          listing: { select: { title: true } },
          confirmations: true,
        },
      }),
      this.prisma.cashAgreement.count({ where }),
    ]);

    return paginate(
      data.map((a) => ({
        id: a.id,
        operationCode: a.operationCode,
        amount: Number(a.amount),
        status: a.status,
        method: a.method,
        buyer: a.buyer.displayName,
        seller: a.seller.displayName,
        listing: a.listing?.title ?? '—',
        confirmations: a.confirmations.length,
        createdAt: a.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    );
  }
}
