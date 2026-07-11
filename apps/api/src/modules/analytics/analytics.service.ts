import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AnalyticsAggregate } from '@lefrig/shared';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async track(eventType: string, data: { category?: string; campId?: string; term?: string; value?: number }) {
    const bucket = new Date().toISOString().slice(0, 7);
    return this.prisma.analyticsEvent.create({
      data: {
        eventType,
        category: data.category,
        campId: data.campId,
        term: data.term,
        value: data.value,
        bucket,
      },
    });
  }

  async getAggregates(campId?: string): Promise<AnalyticsAggregate> {
    const where = campId ? { campId } : {};

    const searches = await this.prisma.analyticsEvent.groupBy({
      by: ['term'],
      where: { ...where, eventType: 'search', term: { not: null } },
      _sum: { count: true },
      orderBy: { _sum: { count: 'desc' } },
      take: 10,
    });

    const categories = await this.prisma.analyticsEvent.groupBy({
      by: ['category'],
      where: { ...where, category: { not: null } },
      _sum: { count: true },
      orderBy: { _sum: { count: 'desc' } },
      take: 10,
    });

    const campActivity = await this.prisma.analyticsEvent.groupBy({
      by: ['campId'],
      where: { campId: { not: null } },
      _sum: { count: true },
      orderBy: { _sum: { count: 'desc' } },
      take: 10,
    });

    const camps = await this.prisma.camp.findMany({
      where: { id: { in: campActivity.map((c) => c.campId!).filter(Boolean) } },
      select: { id: true, nameEs: true },
    });
    const campMap = Object.fromEntries(camps.map((c) => [c.id, c.nameEs]));

    const avgPrices = await this.prisma.analyticsEvent.groupBy({
      by: ['category'],
      where: { eventType: 'listing_view', value: { not: null } },
      _avg: { value: true },
      orderBy: { _avg: { value: 'desc' } },
      take: 10,
    });

    const routes = await this.prisma.analyticsEvent.groupBy({
      by: ['term'],
      where: { eventType: 'route_search', term: { not: null } },
      _sum: { count: true },
      orderBy: { _sum: { count: 'desc' } },
      take: 5,
    });

    return {
      topSearches: searches.map((s) => ({ term: s.term!, count: s._sum.count ?? 0 })),
      topCategories: categories.map((c) => ({ category: c.category!, count: c._sum.count ?? 0 })),
      campActivity: campActivity.map((c) => ({
        campId: c.campId!,
        campName: campMap[c.campId!] ?? 'Unknown',
        count: c._sum.count ?? 0,
      })),
      avgPrices: avgPrices.map((p) => ({ category: p.category!, avgPrice: p._avg.value ?? 0 })),
      topRoutes: routes.map((r) => {
        const [origin, destination] = (r.term ?? '').split('-');
        return { origin, destination, count: r._sum.count ?? 0 };
      }),
    };
  }
}
