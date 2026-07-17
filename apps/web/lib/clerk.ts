import { isUsableClerkPublishableKey } from './clerk-config';

/** Configuración Clerk compartida — una sola fuente de verdad */
export const CLERK_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? '';

/**
 * Habilitado si la publishable key es válida. NO comprobar CLERK_SECRET_KEY aquí:
 * el secret no existe en el bundle del cliente y provocaría un mismatch
 * servidor/cliente (SSR renderiza ClerkProvider, el cliente no → crash de hidratación).
 * La validación del secret vive solo en middleware.ts (isClerkConfigured).
 */
export const isClerkEnabled = isUsableClerkPublishableKey(CLERK_PUBLISHABLE_KEY);
