import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

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
