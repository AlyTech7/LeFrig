import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isClerkConfigured } from '@/lib/clerk-config';

/**
 * Rutas públicas en el edge.
 * Hub protegido (/me, /orders, /cash, /messages) requiere auth cuando Clerk está activo.
 * Marketplace/search siguen públicos; cliente + API siguen aplicando auth en mutaciones.
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/notifications(.*)',
  '/favorites(.*)',
  '/disputes(.*)',
  '/diaspora(.*)',
  '/search(.*)',
  '/marketplace(.*)',
  '/shops(.*)',
  '/services(.*)',
  '/transport(.*)',
  '/camps(.*)',
  '/locations(.*)',
  '/needs(.*)',
  '/community(.*)',
  '/jobs(.*)',
  '/legal(.*)',
  '/account-deletion(.*)',
  '/robots.txt',
  '/sitemap.xml',
  '/sitemap(.*)',
]);

const protectedMiddleware = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

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
