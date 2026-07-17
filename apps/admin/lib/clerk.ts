import { isClerkConfigured, isUsableClerkPublishableKey } from './clerk-config';

export { isClerkConfigured, isUsableClerkPublishableKey };

import { readEnv } from './site-url';

const rawKey = readEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') ?? '';

export const CLERK_PUBLISHABLE_KEY = isUsableClerkPublishableKey(rawKey) ? rawKey : '';

/**
 * Habilitado si la publishable key es válida. NO comprobar CLERK_SECRET_KEY aquí:
 * el secret no existe en el bundle del cliente y provocaría un mismatch
 * servidor/cliente (hidratación rota). El secret solo se valida en middleware.
 */
export const isClerkEnabled = isUsableClerkPublishableKey(rawKey);
