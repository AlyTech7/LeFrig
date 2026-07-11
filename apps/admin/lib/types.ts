export interface DashboardMetrics {
  usersCount: number;
  listingsCount: number;
  ordersCount: number;
  shopsCount: number;
  transportCount: number;
  pendingReports: number;
  openDisputes: number;
  pendingListings?: number;
  ordersLast7Days?: number;
  pendingCashAgreements?: number;
}

export interface AdminOverview {
  metrics: DashboardMetrics;
  campActivity: { campId: string; campName: string; users: number }[];
  listingsByStatus: { status: string; count: number }[];
  weeklyTrend: { label: string; count: number }[];
  recentActivity: {
    id: string;
    type: 'report' | 'order';
    title: string;
    subtitle: string;
    status: string;
    createdAt: string;
  }[];
  recentUsers: {
    id: string;
    displayName: string;
    verificationLevel: string;
    createdAt: string;
  }[];
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface AdminUserRow {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  camp: string | null;
  roles: string[];
  verificationLevel: string;
  reputationScore: number;
  isActive: boolean;
  bannedAt?: string | null;
  banReason?: string | null;
  suspendedUntil?: string | null;
  createdAt: string;
}

export interface AdminJobRow {
  id: string;
  title: string;
  jobType: string;
  category: string;
  salary: number | null;
  currency: string;
  camp: string;
  poster: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminNeedRow {
  id: string;
  title: string;
  type: string;
  status: string;
  camp: string;
  requester: string;
  offersCount: number;
  createdAt: string;
}

export interface AdminCommunityRow {
  id: string;
  title: string;
  postType: string;
  camp: string;
  author: string;
  isPinned: boolean;
  createdAt: string;
}

export interface AdminListingRow {
  id: string;
  title: string;
  price: number;
  status: string;
  camp: string;
  seller: string;
  category: string;
  viewCount: number;
  createdAt: string;
}

export interface AdminOrderRow {
  id: string;
  shop: string;
  camp: string;
  buyer: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export interface AdminDisputeRow {
  id: string;
  reason: string;
  status: string;
  type: string;
  parties: string;
  amount: number | null;
  createdAt: string;
}

export interface AdminDiasporaRow {
  id: string;
  orderType: string;
  description: string;
  budget: number | null;
  status: string;
  beneficiary: string;
  diasporaUser: string;
  camp: string;
  createdAt: string;
}

export interface AdminShopRow {
  id: string;
  name: string;
  camp: string;
  owner: string;
  verified: boolean;
  acceptsCash?: boolean;
  acceptsFiado?: boolean;
  acceptsVouchers?: boolean;
  productsCount: number;
  isActive: boolean;
}

export interface AdminCashRow {
  id: string;
  operationCode: string;
  amount: number;
  status: string;
  method: string;
  buyer: string;
  seller: string;
  listing: string;
  confirmations: number;
  createdAt: string;
}

export interface AdminTransportRow {
  id: string;
  type: string;
  status: string;
  originCamp: string;
  destinationCamp: string;
  requester: string;
  driver: string | null;
  priceEstimate: number | null;
}

export interface AdminCampRow {
  id: string;
  slug: string;
  nameEs: string;
  nameAr: string;
  isTindouf: boolean;
  users: number;
  listings: number;
  shops: number;
}

export interface AccessLogRow {
  id: string;
  action: string;
  resource: string | null;
  ipAddress: string | null;
  createdAt: string;
  admin: { displayName: string; email: string | null };
}

export interface AdminReportRow {
  id: string;
  targetType: string;
  reason: string;
  status: string;
  reporter: string;
  createdAt: string;
}

export interface AnalyticsData {
  topSearches: { term: string; count: number }[];
  topCategories: { category: string; count: number }[];
  campActivity: { campId: string; campName: string; count: number }[];
  avgPrices: { category: string; avgPrice: number }[];
  topRoutes: { origin: string; destination: string; count: number }[];
}
