import { useLocalCredentials } from '@clerk/clerk-expo/local-credentials';

/**
 * Face ID / huella vía Clerk `useLocalCredentials`.
 * Guarda el password en el dispositivo y autentica con Clerk (no es solo un lock local).
 * Requiere build nativa; en web se usa el stub `.web.ts`.
 */
export function useLefrigLocalCredentials() {
  return useLocalCredentials();
}
