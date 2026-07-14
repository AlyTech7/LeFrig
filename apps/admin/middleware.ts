import { clerkClient, clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isClerkConfigured } from '@/lib/clerk-config';
import { getHostedClerkSignInUrl } from '@/lib/site-url';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/unauthorized',
  '/robots.txt',
  '/api/sign-out',
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

const protectedMiddleware = clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId, sessionClaims } = await auth();

  if (!userId) {
    if (isAdminApiRoute(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(getHostedClerkSignInUrl(req.url));
  }

  let roles = rolesFromClaims(sessionClaims as Record<string, unknown> | null | undefined);

  if (roles.length === 0) {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    roles = (user.publicMetadata as { roles?: string[] } | undefined)?.roles ?? [];
  }

  const allowed = roles.some((r) => ['admin', 'moderator'].includes(r));
  if (!allowed) {
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
