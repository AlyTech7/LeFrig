import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

const INSECURE_JWT_SECRETS = new Set([
  '',
  'change-me',
  'change-me-in-production',
  'change-me-in-production-use-long-random-string-lefrig-dev',
  'change-me-refresh-in-production',
  'change-me-refresh-in-production-use-long-random-string',
]);

/** Defaults seguros: legacy OTP/JWT desactivado en producción si no hay env explícita. */
export function isLegacyAuthEnabled(config: ConfigService): boolean {
  const fallback = process.env.NODE_ENV === 'production' ? 'false' : 'true';
  return config.get('AUTH_LEGACY_JWT', fallback) === 'true';
}

export function isSwaggerEnabled(config: ConfigService): boolean {
  const fallback = process.env.NODE_ENV === 'production' ? 'false' : 'true';
  return config.get('ENABLE_SWAGGER', fallback) !== 'false';
}

export function assertLegacyAuthEnabled(config: ConfigService): void {
  if (!isLegacyAuthEnabled(config)) {
    throw new NotFoundException();
  }
}

export function isProductionRuntime(config?: ConfigService): boolean {
  const env = config?.get<string>('NODE_ENV') ?? process.env.NODE_ENV;
  return env === 'production';
}

/** Resuelve JWT_SECRET; en producción falla si falta o es un default inseguro. */
export function resolveJwtSecret(config: ConfigService): string {
  const secret = (config.get<string>('JWT_SECRET') ?? '').trim();
  if (isProductionRuntime(config)) {
    if (!secret || INSECURE_JWT_SECRETS.has(secret) || secret.length < 32) {
      throw new Error(
        'JWT_SECRET must be set to a strong non-default value in production (min 32 characters)',
      );
    }
    return secret;
  }
  return secret || 'change-me';
}

/** Lanza al arrancar si los secretos de producción no son válidos. */
export function assertProductionSecrets(config: ConfigService): void {
  if (!isProductionRuntime(config)) return;
  resolveJwtSecret(config);
}
