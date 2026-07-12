import { isClerkConfigured } from './clerk-config';

/** Configuración Clerk compartida — una sola fuente de verdad */
export const CLERK_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? '';

export const isClerkEnabled = isClerkConfigured();
