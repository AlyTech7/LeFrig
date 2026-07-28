import type { ListingSummary, PaginatedResponse, TransportRequestSummary } from '@lefrig/shared';
import { CURRENCY, HOME_ACTIONS, formatAttributeHighlights } from '@lefrig/shared';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function isLocalHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1';
}

function resolveApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  // Prefer explicit non-local API (preview against production).
  if (envUrl && !isLocalHost(envUrl.replace(/^https?:\/\//, '').split(':')[0] ?? '')) {
    return envUrl.replace(/\/$/, '');
  }
  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    if (host && !isLocalHost(host)) return `http://${host}:3001`;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && !isLocalHost(host)) return `http://${host}:3001`;
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001';
  return envUrl ?? 'http://localhost:3001';
}

export const API_URL = resolveApiUrl();

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export type FetchResult<T> = { data: T; fromFallback: boolean };

export const ALLOW_DEMO_FALLBACK = __DEV__ || process.env.EXPO_PUBLIC_ALLOW_DEMO_FALLBACK === 'true';

export async function fetchWithFallback<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    return await fetchApi<T>(path, init);
  } catch (err) {
    if (!ALLOW_DEMO_FALLBACK) throw err;
    return fallback;
  }
}

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

export function mapApiListing(raw: Record<string, unknown>): ListingSummary {
  const category = raw.category as { slug?: string } | undefined;
  const seller = raw.seller as {
    displayName?: string;
    verificationLevel?: string;
    reputationScore?: number;
  } | undefined;
  const images = raw.images as string[] | undefined;
  const categorySlug = category?.slug ?? String(raw.category ?? 'other');
  const attributes =
    raw.attributes && typeof raw.attributes === 'object' && !Array.isArray(raw.attributes)
      ? (raw.attributes as Record<string, unknown>)
      : undefined;
  const hasAttributes = attributes && Object.keys(attributes).length > 0;
  const attributeLabels = Array.isArray(raw.attributeLabels)
    ? (raw.attributeLabels as string[])
    : hasAttributes
      ? formatAttributeHighlights(categorySlug, attributes)
      : undefined;
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
    imageUrl: images?.[0],
    sellerName: seller?.displayName ?? 'Vendedor',
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    attributes: hasAttributes ? attributes : undefined,
    attributeLabels,
    paymentMethods,
    sellerVerified,
  };
}

export function mapListingsResponse(res: PaginatedResponse<Record<string, unknown>>): PaginatedResponse<ListingSummary> {
  return { ...res, data: res.data.map((item) => mapApiListing(item)) };
}

export function mapApiTransport(raw: Record<string, unknown>): TransportRequestSummary {
  const origin = raw.originCamp as { nameEs?: string } | string | undefined;
  const dest = raw.destinationCamp as { nameEs?: string } | string | undefined;
  const originLabel = raw.originLabel as string | undefined;
  const destLabel = raw.destinationLabel as string | undefined;
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
    departureAt: raw.departureAt as string | undefined,
  };
}

export function mapApiShop(raw: Record<string, unknown>) {
  const camp = raw.camp as { nameEs?: string } | undefined;
  return {
    id: String(raw.id),
    name: String(raw.name),
    camp: camp?.nameEs ?? 'Campamento',
    verified: Boolean(raw.verified),
    imageUrl: raw.imageUrl != null ? String(raw.imageUrl) : undefined,
  };
}

export type ShopItem = {
  id: string;
  name: string;
  camp: string;
  verified: boolean;
  imageUrl?: string;
};

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

export type ServiceItem = {
  id: string;
  title: string;
  campName: string;
  campNames: string[];
  priceFrom: number;
  priceTo?: number;
  currency: string;
  categorySlug?: string;
  categoryName?: string;
  images: string[];
  providerName?: string;
  rating?: number;
};

export type NeedItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  campName: string;
  offersCount: number;
  requesterName?: string;
  status?: string;
};

export function mapApiService(raw: Record<string, unknown>): ServiceItem {
  const camps = raw.camps as { camp?: { nameEs?: string } }[] | undefined;
  const provider = raw.provider as { displayName?: string; reputationScore?: number } | undefined;
  const category = raw.category as { slug?: string; nameEs?: string } | undefined;
  const images = Array.isArray(raw.images) ? (raw.images as unknown[]).map(String).filter(Boolean) : [];
  const campNames = (camps ?? [])
    .map((c) => c.camp?.nameEs)
    .filter((n): n is string => Boolean(n && n.trim()));
  const score = provider?.reputationScore;
  const priceFromRaw = raw.priceFrom;
  const priceToRaw = raw.priceTo;

  return {
    id: String(raw.id),
    title: String(raw.title ?? ''),
    campName: campNames[0] ?? 'Campamento',
    campNames,
    priceFrom: priceFromRaw != null && priceFromRaw !== '' ? Number(priceFromRaw) : 0,
    priceTo: priceToRaw != null && priceToRaw !== '' ? Number(priceToRaw) : undefined,
    currency: String(raw.currency ?? 'DZD'),
    categorySlug: category?.slug?.replace(/^service-/, '') || undefined,
    categoryName: category?.nameEs || undefined,
    images,
    providerName: provider?.displayName || undefined,
    rating: typeof score === 'number' && Number.isFinite(score) ? score : undefined,
  };
}

export function mapApiNeed(raw: Record<string, unknown>): NeedItem {
  const camp = raw.camp as { nameEs?: string } | undefined;
  const count = raw._count as { offers?: number } | undefined;
  const requester = raw.requester as { displayName?: string } | undefined;
  const offers = raw.offers as unknown[] | undefined;
  return {
    id: String(raw.id),
    title: String(raw.title),
    description: String(raw.description ?? ''),
    type: String(raw.type),
    campName: camp?.nameEs ?? 'Campamento',
    offersCount: count?.offers ?? offers?.length ?? 0,
    requesterName: requester?.displayName,
    status: raw.status != null ? String(raw.status) : undefined,
  };
}

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

export const demoListings: ListingSummary[] = [
  { id: '1', title: 'Panel solar 200W', price: 12500, currency: CURRENCY, status: 'active', category: 'solar', campId: 'c1', sellerName: 'Mohamed L.', createdAt: new Date().toISOString() },
  { id: '2', title: 'Samsung A54', price: 8500, currency: CURRENCY, status: 'active', category: 'mobiles', campId: 'c2', sellerName: 'Fatima S.', createdAt: new Date().toISOString() },
  { id: '3', title: 'Harina y aceite', price: 320, currency: CURRENCY, status: 'active', category: 'food', campId: 'c3', sellerName: 'Coop. Al-Nour', createdAt: new Date().toISOString() },
];

export const demoListingsPage: PaginatedResponse<ListingSummary> = {
  data: demoListings,
  meta: { total: 3, page: 1, limit: 20, totalPages: 1 },
};

export { HOME_ACTIONS, CURRENCY };
