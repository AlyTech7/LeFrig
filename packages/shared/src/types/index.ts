export * from './enums.js';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface JwtPayload {
  sub: string;
  phone: string;
  roles: string[];
  campId?: string;
}

export interface CampSummary {
  id: string;
  slug: string;
  nameAr: string;
  nameEs: string;
  nameEn: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  displayName: string;
  avatarUrl?: string;
  roles: string[];
  campId?: string;
  dairaId?: string;
  preferredLanguage: string;
  verificationLevel: string;
  reputationScore: number;
  badges: string[];
  createdAt: string;
}

export interface ListingSummary {
  id: string;
  title: string;
  price: number;
  currency: string;
  status: string;
  category: string;
  campId: string;
  imageUrl?: string;
  sellerName: string;
  createdAt: string;
  attributes?: Record<string, unknown>;
  attributeLabels?: string[];
}

export interface ShopSummary {
  id: string;
  name: string;
  slug: string;
  campId: string;
  marsaId?: string;
  acceptsCash: boolean;
  acceptsFiado: boolean;
  acceptsVouchers: boolean;
  verified: boolean;
  imageUrl?: string;
}

export interface CashOperationSummary {
  id: string;
  operationCode: string;
  method: string;
  status: string;
  amount: number;
  currency: string;
  pin?: string;
}

export interface LedgerSummary {
  accountId: string;
  shopName: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

export interface TransportRequestSummary {
  id: string;
  type: string;
  originCamp: string;
  destinationCamp: string;
  originHubSlug?: string;
  destinationHubSlug?: string;
  status: string;
  seatsAvailable?: number;
  seatsRequested?: number;
  driverName?: string;
  departureAt?: string;
  requesterName?: string;
  priceEstimate?: number | null;
}

export interface VoucherSummary {
  id: string;
  code: string;
  balance: number;
  currency: string;
  status: string;
  expiresAt: string;
}

export interface AnalyticsAggregate {
  topSearches: { term: string; count: number }[];
  topCategories: { category: string; count: number }[];
  campActivity: { campId: string; campName: string; count: number }[];
  avgPrices: { category: string; avgPrice: number }[];
  topRoutes: { origin: string; destination: string; count: number }[];
}
