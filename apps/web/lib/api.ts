import type {
  CampSummary,
  ListingSummary,
  PaginatedResponse,
  ShopSummary,
  TransportRequestSummary,
} from '@lefrig/shared';
import {
  CAMPS,
  CURRENCY,
  LISTING_CATEGORIES,
  SERVICE_CATEGORIES,
  formatAttributeHighlights,
  resolveImageUrl,
  resolveMarketplaceSearch,
} from '@lefrig/shared';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
export const API_URL = rawApiUrl || 'http://localhost:3001';

/** Datos demo solo en dev o si se fuerza explícitamente (staging) */
export const ALLOW_DEMO_FALLBACK =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ALLOW_DEMO_FALLBACK === 'true';

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export async function fetchWithFallback<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    return await fetchApi<T>(path, init);
  } catch (err) {
    if (!ALLOW_DEMO_FALLBACK) throw err;
    return fallback;
  }
}

export type FetchResult<T> = { data: T; fromFallback: boolean };

export async function fetchWithMeta<T>(path: string, fallback: T, init?: RequestInit): Promise<FetchResult<T>> {
  try {
    const data = await fetchApi<T>(path, init);
    return { data, fromFallback: false };
  } catch (err) {
    if (!ALLOW_DEMO_FALLBACK) throw err;
    return { data: fallback, fromFallback: true };
  }
}

export function unwrapPaginated<T>(res: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as PaginatedResponse<T>).data)) {
    return (res as PaginatedResponse<T>).data;
  }
  return [];
}

// ─── Demo data (fallback when API offline) ───────────────────────────────────

const campIds = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'];

export const demoCamps: CampSummary[] = CAMPS.map((c, i) => ({
  id: campIds[i] ?? `camp-${i}`,
  slug: c.slug,
  nameAr: c.nameAr,
  nameEs: c.nameEs,
  nameEn: c.nameEn,
}));

export const demoListings: ListingSummary[] = [
  {
    id: 'demo-1',
    title: 'Generador 3kVA — Rabouni',
    price: 250000,
    currency: CURRENCY,
    status: 'active',
    category: 'generators',
    campId: campIds[4]!,
    sellerName: 'Mohamed L.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    title: 'Samsung Galaxy A54 — Smara',
    price: 170000,
    currency: CURRENCY,
    status: 'active',
    category: 'mobiles',
    campId: campIds[1]!,
    sellerName: 'Fatima S.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    title: 'Toyota Hilux 2018 — Aaiún',
    price: 8400000,
    currency: CURRENCY,
    status: 'active',
    category: 'cars',
    campId: campIds[0]!,
    sellerName: 'Hassan M.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-4',
    title: 'Harina y aceite — Tindouf',
    price: 6400,
    currency: CURRENCY,
    status: 'active',
    category: 'food',
    campId: campIds[6]!,
    sellerName: 'Cooperativa Al-Nour',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-5',
    title: 'Taladro Bosch profesional',
    price: 42000,
    currency: CURRENCY,
    status: 'active',
    category: 'tools',
    campId: campIds[2]!,
    sellerName: 'Ahmed B.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-6',
    title: 'Cabra Saharaui — Dakhla',
    price: 36000,
    currency: CURRENCY,
    status: 'active',
    category: 'animals',
    campId: campIds[3]!,
    sellerName: 'Familia El-Mami',
    createdAt: new Date().toISOString(),
  },
];

export const demoListingsPage: PaginatedResponse<ListingSummary> = {
  data: demoListings,
  meta: { total: demoListings.length, page: 1, limit: 20, totalPages: 1 },
};

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/** Filtra anuncios demo cuando la API no está disponible */
export function filterDemoListings(
  listings: ListingSummary[],
  opts: { q?: string; category?: string; campId?: string },
): ListingSummary[] {
  let category = opts.category;
  let q = opts.q?.trim() ?? '';

  if (q && !category) {
    const resolved = resolveMarketplaceSearch(q);
    category = resolved.category ?? category;
    q = resolved.q;
  }

  let result = listings;

  if (category) {
    result = result.filter((l) => l.category === category);
  }
  if (opts.campId) {
    result = result.filter((l) => l.campId === opts.campId);
  }
  if (q) {
    const n = normalizeSearch(q);
    const categoryLabels = new Map(LISTING_CATEGORIES.map((c) => [c.slug, normalizeSearch(c.nameEs)]));
    result = result.filter((l) => {
      const title = normalizeSearch(l.title);
      const catLabel = categoryLabels.get(l.category ?? '') ?? normalizeSearch(l.category ?? '');
      return title.includes(n) || catLabel.includes(n) || normalizeSearch(l.category ?? '').includes(n);
    });
  }

  return result;
}

export type ShopListItem = ShopSummary & {
  description?: string;
  campName?: string;
  productCount?: number;
  shopType?: string;
};

export const demoShops: ShopListItem[] = [
  {
    id: 'shop-1',
    name: 'Marsa Al-Khair',
    slug: 'marsa-al-khair',
    campId: campIds[4]!,
    campName: 'Rabouni',
    acceptsCash: true,
    acceptsFiado: true,
    acceptsVouchers: true,
    verified: true,
    shopType: 'cooperative',
    productCount: 48,
    description: 'Abarrotes, aceite, arroz y productos de primera necesidad. Pago en efectivo.',
  },
  {
    id: 'shop-2',
    name: 'Electro Smara',
    slug: 'electro-smara',
    campId: campIds[1]!,
    campName: 'Smara',
    acceptsCash: true,
    acceptsFiado: false,
    acceptsVouchers: false,
    verified: true,
    shopType: 'individual',
    productCount: 22,
    description: 'Electrónica, cargadores solares y reparación de móviles.',
  },
  {
    id: 'shop-3',
    name: 'Dakhla Fresh',
    slug: 'dakhla-fresh',
    campId: campIds[3]!,
    campName: 'Dakhla',
    acceptsCash: true,
    acceptsFiado: true,
    acceptsVouchers: false,
    verified: false,
    shopType: 'individual',
    productCount: 15,
    description: 'Verduras, fruta y productos frescos del campamento.',
  },
  {
    id: 'shop-4',
    name: 'Cooperativa 27 Febrero',
    slug: 'coop-27-febrero',
    campId: campIds[5]!,
    campName: '27 de Febrero',
    acceptsCash: true,
    acceptsFiado: true,
    acceptsVouchers: true,
    verified: true,
    shopType: 'cooperative',
    productCount: 31,
    description: 'Cooperativa comunitaria — textiles y artesanía saharaui.',
  },
  {
    id: 'shop-5',
    name: 'Taller Rabouni',
    slug: 'taller-rabouni',
    campId: campIds[4]!,
    campName: 'Rabouni',
    acceptsCash: true,
    acceptsFiado: false,
    acceptsVouchers: false,
    verified: true,
    shopType: 'workshop',
    productCount: 18,
    description: 'Herramientas, fontanería y material de construcción.',
  },
  {
    id: 'shop-6',
    name: 'Aaiún Market',
    slug: 'aaiun-market',
    campId: campIds[0]!,
    campName: 'Aaiún',
    acceptsCash: true,
    acceptsFiado: true,
    acceptsVouchers: false,
    verified: true,
    shopType: 'individual',
    productCount: 56,
    description: 'Marsa central — de todo un poco para el día a día.',
  },
  {
    id: 'shop-7',
    name: 'مطعم الواحة',
    slug: 'restaurant-oasis',
    campId: campIds[4]!,
    campName: 'الرابوني',
    acceptsCash: true,
    acceptsFiado: false,
    acceptsVouchers: false,
    verified: true,
    shopType: 'restaurant',
    productCount: 12,
    description: 'وجبات يومية · شاي · أكل جاهز — نقداً.',
  },
];

export const demoServices = SERVICE_CATEGORIES.slice(0, 12).map((s, i) => ({
  id: `svc-${i}`,
  title: s.nameEs,
  icon: s.icon,
  categorySlug: s.slug,
  categoryName: s.nameEs,
  nameAr: s.nameAr,
  campName: demoCamps[i % demoCamps.length]!.nameEs,
  priceFrom: 150 + i * 80,
  rating: 4.2 + (i % 3) * 0.2,
  description: `Profesional de ${s.nameEs.toLowerCase()} en el campamento. Trabajo serio y precios claros.`,
}));

export const demoTransport: TransportRequestSummary[] = [
  {
    id: 'tr-1',
    type: 'shared_ride',
    originCamp: 'Rabouni',
    destinationCamp: 'Tindouf',
    status: 'accepted',
    priceEstimate: 450,
    seatsAvailable: 3,
  },
  {
    id: 'tr-2',
    type: 'package',
    originCamp: 'Smara',
    destinationCamp: 'Aaiún',
    status: 'requested',
    priceEstimate: 1200,
  },
  {
    id: 'tr-3',
    type: 'shared_ride',
    originCamp: 'Dakhla',
    destinationCamp: 'Auserd',
    status: 'accepted',
    priceEstimate: 800,
    seatsAvailable: 2,
  },
];

export function mapApiListing(raw: Record<string, unknown>): ListingSummary {
  const category = raw.category as { slug?: string; nameEs?: string } | undefined;
  const seller = raw.seller as {
    displayName?: string;
    verificationLevel?: string;
    reputationScore?: number;
  } | undefined;
  const images = raw.images as string[] | undefined;
  const attributes = (raw.attributes as Record<string, unknown> | undefined) ?? undefined;
  const categorySlug = category?.slug ?? String(raw.category ?? 'other');
  const hasAttributes = attributes && Object.keys(attributes).length > 0;
  const paymentMethods = Array.isArray(raw.paymentMethods)
    ? (raw.paymentMethods as string[])
    : undefined;
  const sellerVerified =
    Boolean(raw.sellerVerified) ||
    (typeof seller?.verificationLevel === 'string' &&
      seller.verificationLevel !== 'unverified' &&
      seller.verificationLevel !== 'phone') ||
    (typeof seller?.reputationScore === 'number' && seller.reputationScore >= 4.5);
  return {
    id: String(raw.id),
    title: String(raw.title),
    price: Number(raw.price),
    currency: String(raw.currency ?? CURRENCY),
    status: String(raw.status),
    category: categorySlug,
    campId: String(raw.campId),
    imageUrl: resolveImageUrl(images?.[0], API_URL) ?? undefined,
    sellerName: seller?.displayName ?? 'Vendedor',
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    attributes: hasAttributes ? attributes : undefined,
    attributeLabels: hasAttributes ? formatAttributeHighlights(categorySlug, attributes) : undefined,
    paymentMethods,
    sellerVerified,
  };
}

export function mapListingsResponse(
  res: PaginatedResponse<Record<string, unknown>> | PaginatedResponse<ListingSummary>,
): PaginatedResponse<ListingSummary> {
  return {
    ...res,
    data: res.data.map((item) =>
      'sellerName' in item && typeof item.sellerName === 'string'
        ? (item as ListingSummary)
        : mapApiListing(item as Record<string, unknown>),
    ),
  };
}

export function mapApiShop(raw: Record<string, unknown>): ShopListItem {
  const camp = raw.camp as { nameEs?: string } | undefined;
  const count = raw._count as { products?: number } | undefined;
  return {
    id: String(raw.id),
    name: String(raw.name),
    slug: String(raw.slug),
    campId: String(raw.campId),
    marsaId: raw.marsaId ? String(raw.marsaId) : undefined,
    acceptsCash: Boolean(raw.acceptsCash ?? true),
    acceptsFiado: Boolean(raw.acceptsFiado),
    acceptsVouchers: Boolean(raw.acceptsVouchers),
    verified: Boolean(raw.verified ?? raw.isVerified),
    imageUrl: raw.imageUrl ? resolveImageUrl(String(raw.imageUrl), API_URL) ?? undefined : undefined,
    description: raw.description ? String(raw.description) : undefined,
    campName: camp?.nameEs,
    productCount: count?.products,
    shopType: raw.shopType ? String(raw.shopType) : undefined,
  };
}

export function mapApiTransport(raw: Record<string, unknown>): TransportRequestSummary {
  const origin = raw.originCamp as { nameEs?: string } | string | undefined;
  const dest = raw.destinationCamp as { nameEs?: string } | string | undefined;
  const originLabel = raw.originLabel as string | undefined;
  const destLabel = raw.destinationLabel as string | undefined;
  const requester = raw.requester as { displayName?: string } | undefined;
  const driver = raw.driver as { displayName?: string } | undefined;
  return {
    id: String(raw.id),
    type: String(raw.type),
    originCamp: originLabel ?? (typeof origin === 'string' ? origin : origin?.nameEs ?? 'Origen'),
    destinationCamp: destLabel ?? (typeof dest === 'string' ? dest : dest?.nameEs ?? 'Destino'),
    originHubSlug: raw.originHubSlug as string | undefined,
    destinationHubSlug: raw.destinationHubSlug as string | undefined,
    status: String(raw.status),
    seatsAvailable: raw.seatsAvailable != null ? Number(raw.seatsAvailable) : undefined,
    seatsRequested: raw.seatsRequested != null ? Number(raw.seatsRequested) : undefined,
    driverName: driver?.displayName,
    requesterName: requester?.displayName,
    departureAt: raw.departureAt as string | undefined,
  };
}

export type ServiceItem = {
  id: string;
  title: string;
  icon: string;
  categorySlug: string;
  categoryName: string;
  nameAr?: string;
  campName: string;
  priceFrom: number;
  priceTo?: number;
  rating: number;
  description?: string;
  imageUrl?: string;
};

export function mapApiService(raw: Record<string, unknown>): ServiceItem {
  const category = raw.category as { slug?: string; icon?: string; nameEs?: string; nameAr?: string } | undefined;
  const camps = raw.camps as { camp?: { nameEs?: string } }[] | undefined;
  const provider = raw.provider as { reputationScore?: number } | undefined;
  const images = raw.images as string[] | undefined;
  const slug = category?.slug?.replace(/^service-/, '') ?? 'other';
  return {
    id: String(raw.id),
    title: String(raw.title),
    icon: category?.icon ?? '🔧',
    categorySlug: slug,
    categoryName: category?.nameEs ?? String(raw.title),
    nameAr: category?.nameAr,
    campName: camps?.[0]?.camp?.nameEs ?? 'Campamento',
    priceFrom: Number(raw.priceFrom ?? raw.priceTo ?? 200),
    priceTo: raw.priceTo != null ? Number(raw.priceTo) : undefined,
    rating: Number(provider?.reputationScore ?? 4.5),
    description: raw.description ? String(raw.description) : undefined,
    imageUrl: resolveImageUrl(images?.[0], API_URL) ?? undefined,
  };
}

export type NeedItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  campName: string;
  urgency?: string;
  offersCount: number;
  status?: string;
};

export function mapApiNeed(raw: Record<string, unknown>): NeedItem {
  const camp = raw.camp as { nameEs?: string } | undefined;
  const count = raw._count as { offers?: number } | undefined;
  const offers = raw.offers as unknown[] | undefined;
  return {
    id: String(raw.id),
    title: String(raw.title),
    description: String(raw.description ?? ''),
    type: String(raw.type),
    campName: camp?.nameEs ?? 'Campamento',
    urgency: String(raw.urgency ?? raw.priority ?? 'normal'),
    offersCount: count?.offers ?? offers?.length ?? 0,
    status: raw.status != null ? String(raw.status) : undefined,
  };
}

export { LISTING_CATEGORIES, SERVICE_CATEGORIES, CAMPS };

export type JobItem = {
  id: string;
  title: string;
  salary: string;
  type: string;
  jobType: string;
  category: string;
  campName: string;
  description?: string;
  contactPhone?: string;
  posterName?: string;
};

export function mapApiJob(raw: Record<string, unknown>): JobItem {
  const camp = raw.camp as { nameEs?: string } | undefined;
  const poster = raw.poster as { displayName?: string } | undefined;
  const salaryNum = raw.salary != null ? Number(raw.salary) : null;
  const currency = String(raw.currency ?? 'MRU');
  const salary = salaryNum ? `${salaryNum.toLocaleString()} ${currency}` : 'A convenir';
  const jobType = String(raw.jobType ?? 'offer');
  const typeLabel =
    jobType === 'seeking' ? 'Busca empleo' : jobType === 'offer' ? 'Oferta de trabajo' : jobType;
  return {
    id: String(raw.id),
    title: String(raw.title),
    salary,
    type: typeLabel,
    jobType,
    category: String(raw.category ?? ''),
    campName: camp?.nameEs ?? 'Campamento',
    description: raw.description != null ? String(raw.description) : undefined,
    contactPhone: raw.contactPhone != null ? String(raw.contactPhone) : undefined,
    posterName: poster?.displayName,
  };
}

export const demoJobs: JobItem[] = [
  {
    id: 'demo-j1',
    title: 'Técnico solar',
    salary: '8.000 MRU',
    type: 'Oferta de trabajo',
    jobType: 'offer',
    category: 'skilled',
    campName: 'Tindouf',
    description: 'Instalación de paneles en viviendas del campamento.',
    posterName: 'ONG Saharaui',
  },
  {
    id: 'demo-j2',
    title: 'Busco trabajo de albañil',
    salary: 'A convenir',
    type: 'Busca empleo',
    jobType: 'seeking',
    category: 'daily',
    campName: 'El Aaiún',
    description: 'Experiencia de 5 años en construcción.',
    posterName: 'Ahmed S.',
  },
];
