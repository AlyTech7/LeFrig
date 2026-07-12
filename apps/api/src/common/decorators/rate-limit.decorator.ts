import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export type RateLimitOptions = {
  /** Máximo de peticiones por ventana */
  limit: number;
  /** Ventana en segundos */
  windowSec: number;
  /** Prefijo de clave Redis/memoria (por defecto: ruta HTTP) */
  keyPrefix?: string;
};

export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);
