import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isClerkConfigured } from '@/lib/clerk-config';
import { getClerkAuthorizedParties } from '@/lib/site-url';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/marketplace(.*)',
  '/shops(.*)',
  '/services(.*)',
  '/transport(.*)',
  '/camps(.*)',
  '/locations(.*)',
  '/needs(.*)',
  '/community(.*)',
  '/jobs(.*)',
]);

const clerkOptions = {
  authorizedParties: getClerkAuthorizedParties(),
};

const protectedMiddleware = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
}, clerkOptions);

function passthrough(_req: NextRequest) {
  return NextResponse.next();
}

export default isClerkConfigured() ? protectedMiddleware : passthrough;

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
