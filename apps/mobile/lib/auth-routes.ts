/** Rutas públicas (navegación libre, como en la web) */
const PUBLIC_ROOTS = new Set([
  'index',
  'sign-in',
  'sign-up',
  'sso-callback',
  'onboarding',
  'legal',
  'marketplace',
  'services',
  'shops',
  'transport',
  'jobs',
  'atlas',
  'camps',
  'locations',
  'community',
  'needs',
  'profile',
  'messages',
  'notifications',
  'favorites',
  'orders',
  'disputes',
]);

/** Segmentos que requieren cuenta aunque el root sea público */
const PROTECTED_SUFFIXES: Record<string, Set<string>> = {
  marketplace: new Set(['create', 'mine']),
  services: new Set(['create']),
  shops: new Set(['register', 'mine', 'manage']),
  transport: new Set(['register', 'garage']),
  jobs: new Set(['create']),
  needs: new Set(['create']),
};

export function routeRequiresAuth(segments: string[]): boolean {
  const root = segments[0] ?? 'index';
  if (!PUBLIC_ROOTS.has(root)) return true;
  const protectedSubs = PROTECTED_SUFFIXES[root];
  if (protectedSubs && segments[1] && protectedSubs.has(segments[1])) return true;
  // /shops/:id/manage
  if (root === 'shops' && segments.includes('manage')) return true;
  return false;
}

export function isAuthScreen(segments: string[]): boolean {
  const root = segments[0] ?? '';
  return root === 'sign-in' || root === 'sign-up' || root === 'sso-callback' || root === 'onboarding';
}
