import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RATE_LIMIT_KEY, type RateLimitOptions } from '../decorators/rate-limit.decorator';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rateLimit: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!options) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const identity = this.clientKey(req);
    const routeKey = options.keyPrefix ?? `${req.method}:${req.route?.path ?? req.path}`;
    const key = `rl:${routeKey}:${identity}`;

    const allowed = await this.rateLimit.isAllowed(key, options.limit, options.windowSec);
    if (!allowed) {
      throw new HttpException('Demasiadas peticiones. Inténtalo más tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }

  private clientKey(req: Request): string {
    const user = (req as Request & { user?: { sub?: string } }).user;
    if (user?.sub) return `u:${user.sub}`;
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';
    return `ip:${ip}`;
  }
}
