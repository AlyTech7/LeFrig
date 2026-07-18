import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isClerkConfigured } from '@/lib/clerk-config';

/**
 * Rutas públicas o con gate en cliente.
 * No usar auth.protect() en hub de cuenta: el edge a veces no ve la sesión
 * mientras el cliente sí → bucle /sign-in «Redirigiendo…».
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/me(.*)',
  '/notifications(.*)',
  '/messages(.*)',
  '/orders(.*)',
  '/favorites(.*)',
  '/cash(.*)',
  '/disputes(.*)',
  '/ledger(.*)',
  '/vouchers(.*)',
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
