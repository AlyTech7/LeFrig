import { clerkClient, clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/unauthorized', '/robots.txt']);

function rolesFromClaims(sessionClaims: Record<string, unknown> | null | undefined): string[] {
  if (!sessionClaims) return [];

  const meta = sessionClaims.metadata as { roles?: string[] } | undefined;
  const publicMeta =
    (sessionClaims.publicMetadata as { roles?: string[] } | undefined) ??
    (sessionClaims.public_metadata as { roles?: string[] } | undefined);

  return meta?.roles ?? publicMeta?.roles ?? [];
}

export default clerkMiddleware(async (auth, req) => {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) return;
  if (isPublicRoute(req)) return;

  const { userId, sessionClaims } = await auth();

  if (!userId) {
    const signIn = new URL('/sign-in', req.url);
    signIn.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signIn);
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

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
