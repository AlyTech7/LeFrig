import { clerkClient, clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-session';
import { isClerkConfigured } from '@/lib/clerk-config';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/unauthorized',
  '/robots.txt',
  '/api/sign-out',
  '/api/auth/sign-in',
]);
const isAdminApiRoute = createRouteMatcher(['/api/admin(.*)']);

function rolesFromClaims(sessionClaims: Record<string, unknown> | null | undefined): string[] {
  if (!sessionClaims) return [];

  const meta = sessionClaims.metadata as { roles?: string[] } | undefined;
  const publicMeta =
    (sessionClaims.publicMetadata as { roles?: string[] } | undefined) ??
    (sessionClaims.public_metadata as { roles?: string[] } | undefined);

  return meta?.roles ?? publicMeta?.roles ?? [];
}

function hasAdminRole(roles: string[]): boolean {
  return roles.some((r) => ['admin', 'moderator'].includes(r));
}

const protectedMiddleware = clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId, sessionClaims } = await auth();
  const adminCookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const adminSession = await verifyAdminSessionToken(adminCookie);

  const effectiveUserId = userId ?? adminSession?.clerkUserId ?? null;

  if (!effectiveUserId) {
    if (isAdminApiRoute(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const signIn = new URL('/sign-in', req.url);
    signIn.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signIn);
  }

  let roles = userId
    ? rolesFromClaims(sessionClaims as Record<string, unknown> | null | undefined)
    : (adminSession?.roles ?? []);

  if (roles.length === 0) {
    const client = await clerkClient();
    const user = await client.users.getUser(effectiveUserId);
    roles = (user.publicMetadata as { roles?: string[] } | undefined)?.roles ?? [];
  }

  if (!hasAdminRole(roles)) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }
});

const passthrough = () => NextResponse.next();

export default isClerkConfigured() ? protectedMiddleware : passthrough;

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
