import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  TRANSPORT_HUBS,
  resolveListingCategoryFromQuery,
  resolveServiceCategoryFromQuery,
} from '@lefrig/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MeilisearchAdapter } from '../adapters/meilisearch.adapter';

export type GlobalSearchHit = {
  type: 'listing' | 'shop' | 'service' | 'job' | 'need' | 'camp' | 'hub' | 'category';
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  imageUrl?: string | null;
};

export type GlobalSearchResponse = {
  q: string;
  total: number;
  groups: {
    type: GlobalSearchHit['type'];
    label: string;
    items: GlobalSearchHit[];
  }[];
  suggestions: GlobalSearchHit[];
};

const GROUP_LABELS: Record<GlobalSearchHit['type'], string> = {
  listing: 'Anuncios',
  shop: 'Tiendas',
  service: 'Servicios',
  job: 'Empleo',
  need: 'Necesidades',
  camp: 'Campamentos',
  hub: 'Rutas / hubs',
  category: 'Categorías',
};

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function textMatch(haystack: string, needle: string): boolean {
  const h = normalize(haystack);
  const n = normalize(needle);
  if (!n) return false;
  return h.includes(n) || n.includes(h);
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

@Injectable()
export class GlobalSearchService {
  constructor(
    private prisma: PrismaService,
    private meili: MeilisearchAdapter,
  ) {}

  async searchAll(rawQ: string, perGroup = 8): Promise<GlobalSearchResponse> {
    const q = rawQ.trim();
    if (q.length < 1) {
      return { q: '', total: 0, groups: [], suggestions: [] };
    }

    const contains = { contains: q, mode: 'insensitive' as const };

    const [
      listings,
      shops,
      services,
      jobs,
      needs,
      camps,
    ] = await Promise.all([
      withTimeout(this.searchListings(q, perGroup), 4000, [] as GlobalSearchHit[]),
      withTimeout(
        this.prisma.shop
          .findMany({
            where: {
              isActive: true,
              OR: [{ name: contains }, { description: contains }, { slug: contains }],
            },
            take: perGroup,
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              imageUrl: true,
              camp: { select: { nameEs: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
          .then((rows) =>
            rows.map(
              (s): GlobalSearchHit => ({
                type: 'shop',
                id: s.id,
                title: s.name,
                subtitle: s.camp?.nameEs ?? s.description?.slice(0, 80) ?? undefined,
                href: `/shops/${s.id}`,
                imageUrl: s.imageUrl,
              }),
            ),
          )
          .catch(() => [] as GlobalSearchHit[]),
        4000,
        [] as GlobalSearchHit[],
      ),
      withTimeout(
        this.prisma.service
          .findMany({
            where: {
              isActive: true,
              OR: [
                { title: contains },
                { description: contains },
                { category: { nameEs: contains } },
                { category: { slug: contains } },
              ],
            },
            take: perGroup,
            select: {
              id: true,
              title: true,
              description: true,
              images: true,
              category: { select: { nameEs: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
          .then((rows) =>
            rows.map(
              (s): GlobalSearchHit => ({
                type: 'service',
                id: s.id,
                title: s.title,
                subtitle: s.category?.nameEs ?? s.description?.slice(0, 80) ?? undefined,
                href: `/services/${s.id}`,
                imageUrl: s.images?.[0] ?? null,
              }),
            ),
          )
          .catch(() => [] as GlobalSearchHit[]),
        4000,
        [] as GlobalSearchHit[],
      ),
      withTimeout(
        this.prisma.job
          .findMany({
            where: {
              isActive: true,
              OR: [{ title: contains }, { description: contains }, { category: contains }],
            },
            take: perGroup,
            select: {
              id: true,
              title: true,
              category: true,
              jobType: true,
              camp: { select: { nameEs: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
          .then((rows) =>
            rows.map(
              (j): GlobalSearchHit => ({
                type: 'job',
                id: j.id,
                title: j.title,
                subtitle: [j.camp?.nameEs, j.category, j.jobType].filter(Boolean).join(' · ') || undefined,
                href: `/jobs/${j.id}`,
              }),
            ),
          )
          .catch(() => [] as GlobalSearchHit[]),
        4000,
        [] as GlobalSearchHit[],
      ),
      withTimeout(
        this.prisma.needRequest
          .findMany({
            where: {
              status: 'open',
              OR: [{ title: contains }, { description: contains }],
            },
            take: perGroup,
            select: {
              id: true,
              title: true,
              type: true,
              camp: { select: { nameEs: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
          .then((rows) =>
            rows.map(
              (n): GlobalSearchHit => ({
                type: 'need',
                id: n.id,
                title: n.title,
                subtitle: [n.camp?.nameEs, n.type].filter(Boolean).join(' · ') || undefined,
                href: `/needs/${n.id}`,
              }),
            ),
          )
          .catch(() => [] as GlobalSearchHit[]),
        4000,
        [] as GlobalSearchHit[],
      ),
      withTimeout(
        this.prisma.camp
          .findMany({
            where: {
              OR: [
                { nameEs: contains },
                { nameAr: contains },
                { nameEn: contains },
                { slug: contains },
              ],
            },
            take: perGroup,
            select: { id: true, slug: true, nameEs: true, nameAr: true },
            orderBy: { nameEs: 'asc' },
          })
          .then((rows) =>
            rows.map(
              (c): GlobalSearchHit => ({
                type: 'camp',
                id: c.id,
                title: c.nameEs,
                subtitle: c.nameAr || undefined,
                href: `/camps`,
              }),
            ),
          )
          .catch(() => [] as GlobalSearchHit[]),
        3000,
        [] as GlobalSearchHit[],
      ),
    ]);

    const hubs = TRANSPORT_HUBS.filter((h) => textMatch(`${h.slug} ${h.nameEs} ${h.nameAr}`, q))
      .slice(0, perGroup)
      .map(
        (h): GlobalSearchHit => ({
          type: 'hub',
          id: h.slug,
          title: h.nameEs,
          subtitle: h.zone,
          href: `/transport?q=${encodeURIComponent(h.slug)}`,
        }),
      );

    const categories: GlobalSearchHit[] = [];
    const listingCat = resolveListingCategoryFromQuery(q);
    if (listingCat) {
      categories.push({
        type: 'category',
        id: `listing-${listingCat}`,
        title: listingCat.replace(/-/g, ' '),
        subtitle: 'Mercado',
        href: `/marketplace?category=${encodeURIComponent(listingCat)}`,
      });
    }
    const serviceCat = resolveServiceCategoryFromQuery(q);
    if (serviceCat) {
      categories.push({
        type: 'category',
        id: `service-${serviceCat}`,
        title: serviceCat.replace(/-/g, ' '),
        subtitle: 'Servicios',
        href: `/services?category=${encodeURIComponent(serviceCat)}`,
      });
    }

    const byType: Record<GlobalSearchHit['type'], GlobalSearchHit[]> = {
      category: categories,
      listing: listings,
      shop: shops,
      service: services,
      job: jobs,
      need: needs,
      camp: camps,
      hub: hubs,
    };

    const order: GlobalSearchHit['type'][] = [
      'category',
      'listing',
      'shop',
      'service',
      'hub',
      'job',
      'need',
      'camp',
    ];

    const groups = order
      .filter((type) => byType[type].length > 0)
      .map((type) => ({
        type,
        label: GROUP_LABELS[type],
        items: byType[type],
      }));

    const suggestions = groups.flatMap((g) => g.items).slice(0, 10);
    const total = groups.reduce((sum, g) => sum + g.items.length, 0);

    return { q, total, groups, suggestions };
  }

  private async searchListings(q: string, take: number): Promise<GlobalSearchHit[]> {
    if (this.meili.isConfigured()) {
      const hits = await this.meili.search('listings', q, {
        limit: take,
        filter: "status = 'active'",
        timeoutMs: 2000,
      });
      if (hits?.length) {
        const ids = hits.map((h) => String(h.id));
        const rows = await this.prisma.listing.findMany({
          where: { id: { in: ids }, status: 'active' },
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            camp: { select: { nameEs: true } },
            category: { select: { nameEs: true } },
          },
        });
        const order = Object.fromEntries(ids.map((id, i) => [id, i]));
        rows.sort((a, b) => (order[a.id] ?? 0) - (order[b.id] ?? 0));
        return rows.map((l) => ({
          type: 'listing' as const,
          id: l.id,
          title: l.title,
          subtitle: [l.category?.nameEs, l.camp?.nameEs, `${Number(l.price)} MRU`]
            .filter(Boolean)
            .join(' · '),
          href: `/marketplace/${l.id}`,
          imageUrl: Array.isArray(l.images) ? (l.images[0] as string | undefined) : null,
        }));
      }
    }

    const where: Prisma.ListingWhereInput = {
      status: 'active',
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { slug: { contains: q, mode: 'insensitive' } } },
        { category: { nameEs: { contains: q, mode: 'insensitive' } } },
        { category: { nameAr: { contains: q, mode: 'insensitive' } } },
      ],
    };

    const rows = await this.prisma.listing.findMany({
      where,
      take,
      select: {
        id: true,
        title: true,
        price: true,
        images: true,
        camp: { select: { nameEs: true } },
        category: { select: { nameEs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((l) => ({
      type: 'listing' as const,
      id: l.id,
      title: l.title,
      subtitle: [l.category?.nameEs, l.camp?.nameEs, `${Number(l.price)} MRU`]
        .filter(Boolean)
        .join(' · '),
      href: `/marketplace/${l.id}`,
      imageUrl: Array.isArray(l.images) ? (l.images[0] as string | undefined) : null,
    }));
  }
}
