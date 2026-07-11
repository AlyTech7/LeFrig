export interface DashboardMetrics {
  usersCount: number;
  listingsCount: number;
  ordersCount: number;
  shopsCount: number;
  transportCount: number;
  pendingReports: number;
  openDisputes: number;
  pendingListings?: number;
  pendingCashAgreements?: number;
}

export const demoDashboard: DashboardMetrics = {
  usersCount: 1247,
  listingsCount: 389,
  ordersCount: 156,
  shopsCount: 42,
  transportCount: 18,
  pendingReports: 7,
  openDisputes: 3,
  pendingListings: 12,
  pendingCashAgreements: 5,
};

export const demoUsers = [
  { id: '1', displayName: 'Mohamed L.', phone: '+222 45 12 34 56', camp: 'Rabouni', verificationLevel: 'verified', reputationScore: 4.8 },
  { id: '2', displayName: 'Fatima S.', phone: '+222 46 78 90 12', camp: 'Smara', verificationLevel: 'basic', reputationScore: 4.2 },
  { id: '3', displayName: 'Hassan M.', phone: '+222 47 11 22 33', camp: 'Dakhla', verificationLevel: 'trusted', reputationScore: 4.9 },
];

export const demoCommunityAdmin = [
  { id: 'cp1', title: 'Reunión vecinal Rabouni', postType: 'announcement', camp: 'Rabouni', author: 'ONG Saharaui', isPinned: true },
  { id: 'cp2', title: '¿Alguien vende panel solar usado?', postType: 'question', camp: 'Smara', author: 'Mohamed L.', isPinned: false },
];

export const demoNeedsAdmin = [
  { id: 'n1', title: 'Necesito generador pequeño', type: 'product', status: 'open', camp: 'El Aaiún', requester: 'Ahmed S.', offersCount: 2 },
  { id: 'n2', title: 'Transporte a Tindouf', type: 'transport', status: 'open', camp: 'Rabouni', requester: 'Fatima L.', offersCount: 0 },
];

export const demoJobsAdmin = [
  { id: 'j1', title: 'Técnico solar', jobType: 'offer', category: 'skilled', salary: 8000, currency: 'MRU', camp: 'Tindouf', poster: 'ONG Saharaui', isActive: true },
  { id: 'j2', title: 'Busco trabajo de albañil', jobType: 'seeking', category: 'daily', salary: null, currency: 'MRU', camp: 'El Aaiún', poster: 'Ahmed S.', isActive: true },
];

export const demoListingsAdmin = [
  { id: 'l1', title: 'Panel solar 200W', status: 'pending_review', camp: 'Rabouni', seller: 'Mohamed L.', price: 12500 },
  { id: 'l2', title: 'Samsung A54', status: 'active', camp: 'Smara', seller: 'Fatima S.', price: 8500 },
  { id: 'l3', title: 'Toyota Hilux', status: 'reported', camp: 'Aaiún', seller: 'Hassan M.', price: 420000 },
];

export const demoOrders = [
  { id: 'o1', status: 'pending', shop: 'Marsa Al-Khair', total: 2400, camp: 'Rabouni' },
  { id: 'o2', status: 'delivered', shop: 'Electro Smara', total: 8500, camp: 'Smara' },
  { id: 'o3', status: 'in_transit', shop: 'Dakhla Fresh', total: 680, camp: 'Dakhla' },
];

export const demoVouchers = [
  { id: 'v1', code: 'HUM-2026-001', balance: 5000, status: 'active', program: 'Ayuda humanitaria' },
  { id: 'v2', code: 'DIA-2026-042', balance: 12000, status: 'redeemed', program: 'Diáspora' },
];

export const demoReports = [
  { id: 'r1', targetType: 'listing', reason: 'Precio sospechoso', status: 'pending', createdAt: '2026-06-27' },
  { id: 'r2', targetType: 'user', reason: 'Comportamiento abusivo', status: 'pending', createdAt: '2026-06-26' },
];

export const demoDisputes = [
  { id: 'd1', status: 'open', type: 'order', amount: 2400, parties: 'Comprador vs Marsa Al-Khair' },
  { id: 'd2', status: 'mediation', type: 'cash', amount: 1500, parties: 'Vendedor vs Comprador' },
];

export const demoAnalytics = {
  topSearches: [{ term: 'solar', count: 89 }, { term: 'móvil', count: 67 }, { term: 'transporte tindouf', count: 45 }],
  topCategories: [{ category: 'electronics', count: 120 }, { category: 'food', count: 98 }],
  campActivity: [{ campId: '1', campName: 'Rabouni', count: 234 }, { campId: '2', campName: 'Smara', count: 189 }],
  avgPrices: [{ category: 'mobiles', avgPrice: 9200 }, { category: 'solar', avgPrice: 14500 }],
  topRoutes: [{ origin: 'Tindouf', destination: 'Rabouni', count: 56 }],
};

export const demoShops = [
  { id: '1', name: 'Marsa Al-Khair', slug: 'marsa', camp: 'Rabouni', owner: 'Mohamed L.', verified: true, acceptsCash: true, acceptsFiado: true, acceptsVouchers: true, productsCount: 48, isActive: true },
  { id: '2', name: 'Electro Smara', slug: 'electro', camp: 'Smara', owner: 'Fatima S.', verified: true, acceptsCash: true, acceptsFiado: false, acceptsVouchers: false, productsCount: 31, isActive: true },
  { id: '3', name: 'Dakhla Fresh', slug: 'dakhla-fresh', camp: 'Dakhla', owner: 'Hassan M.', verified: false, acceptsCash: true, acceptsFiado: true, acceptsVouchers: true, productsCount: 22, isActive: true },
];

export const demoTransport = [
  { id: '1', type: 'shared_ride', status: 'accepted', originCamp: 'Rabouni', destinationCamp: 'Tindouf', requester: 'Ahmed B.', driver: 'Omar K.', priceEstimate: 450, seatsAvailable: 3, createdAt: new Date().toISOString() },
  { id: '2', type: 'tindouf_import', status: 'requested', originCamp: 'Tindouf', destinationCamp: 'Smara', requester: 'Laila M.', driver: null, priceEstimate: 1200, seatsAvailable: null, createdAt: new Date().toISOString() },
  { id: '3', type: 'private', status: 'completed', originCamp: 'Aaiún', destinationCamp: 'Dakhla', requester: 'Youssef T.', driver: 'Karim S.', priceEstimate: 2800, seatsAvailable: 1, createdAt: new Date().toISOString() },
];

export const demoCamps = [
  { id: 'c1', slug: 'rabouni', nameEs: 'Rabouni', nameAr: 'الربوني', isTindouf: true, users: 412, listings: 98, shops: 14 },
  { id: 'c2', slug: 'smara', nameEs: 'Smara', nameAr: 'السمارة', isTindouf: true, users: 356, listings: 76, shops: 11 },
  { id: 'c3', slug: 'dakhla', nameEs: 'Dakhla', nameAr: 'الداخلة', isTindouf: false, users: 289, listings: 54, shops: 9 },
  { id: 'c4', slug: 'aaiun', nameEs: 'Aaiún', nameAr: 'العيون', isTindouf: false, users: 190, listings: 41, shops: 8 },
];

export const demoAccessLogs = [
  { id: 'a1', action: 'view_dashboard', resource: 'dashboard', ipAddress: '127.0.0.1', createdAt: new Date().toISOString(), admin: { displayName: 'Admin Lefrig', email: 'elbachiryaraaly@gmail.com' } },
  { id: 'a2', action: 'view_overview', resource: 'overview', ipAddress: '127.0.0.1', createdAt: new Date(Date.now() - 3600000).toISOString(), admin: { displayName: 'Admin Lefrig', email: 'elbachiryaraaly@gmail.com' } },
  { id: 'a3', action: 'verify_user', resource: 'users/abc', ipAddress: '192.168.1.10', createdAt: new Date(Date.now() - 7200000).toISOString(), admin: { displayName: 'Moderador', email: 'mod@lefrig.dev' } },
];
