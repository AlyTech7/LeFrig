import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
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

export default clerkMiddleware(async (auth, request) => {
  // Sin Clerk completamente configurado, no bloquear (dev local)
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) return;

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
}, clerkOptions);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
