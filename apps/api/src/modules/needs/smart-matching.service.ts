import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface MatchResult {
  needId: string;
  matches: { type: string; id: string; title: string; score: number }[];
}

@Injectable()
export class SmartMatchingService {
  constructor(private prisma: PrismaService) {}

  async findMatches(needId: string): Promise<MatchResult> {
    const need = await this.prisma.needRequest.findUnique({ where: { id: needId } });
    if (!need) return { needId, matches: [] };

    const matches: MatchResult['matches'] = [];

    if (need.type === 'product' || need.type === 'tindouf') {
      const listings = await this.prisma.listing.findMany({
        where: {
          status: 'active',
          campId: need.campId,
          OR: [
            { title: { contains: need.title.split(' ')[0], mode: 'insensitive' } },
            ...(need.category ? [{ category: { slug: need.category } }] : []),
          ],
        },
        take: 5,
        select: { id: true, title: true },
      });
      listings.forEach((l, i) => matches.push({ type: 'listing', id: l.id, title: l.title, score: 0.9 - i * 0.1 }));
    }

    if (need.type === 'service') {
      const services = await this.prisma.service.findMany({
        where: {
          isActive: true,
          title: { contains: need.title.split(' ')[0], mode: 'insensitive' },
          camps: { some: { campId: need.campId } },
        },
        take: 5,
        select: { id: true, title: true },
      });
      services.forEach((s, i) => matches.push({ type: 'service', id: s.id, title: s.title, score: 0.85 - i * 0.1 }));
    }

    if (need.type === 'transport') {
      const transport = await this.prisma.transportRequest.findMany({
        where: {
          status: { in: ['requested', 'accepted'] },
          originCampId: need.campId,
        },
        take: 3,
        select: { id: true, description: true },
      });
      transport.forEach((t, i) =>
        matches.push({ type: 'transport', id: t.id, title: t.description ?? 'Transporte', score: 0.8 - i * 0.1 }),
      );
    }

    return { needId, matches: matches.sort((a, b) => b.score - a.score) };
  }
}
