import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { ClerkService, type AuthUserPayload } from '../../modules/auth/clerk.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '@lefrig/shared';
import { isLegacyAuthEnabled } from '../config/production-security';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private clerk: ClerkService,
    private jwt: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Token de autenticación requerido');
    }

    const user = await this.resolveUser(token);
    await this.assertNotBanned(user.sub);
    request.user = user;
    return true;
  }

  private async assertNotBanned(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { bannedAt: true, suspendedUntil: true },
    });
    if (!user) return;

    if (user.bannedAt) {
      throw new ForbiddenException('Tu cuenta ha sido suspendida. Contacta con legal@lefrig.app');
    }
    if (user.suspendedUntil && user.suspendedUntil > new Date()) {
      const until = user.suspendedUntil.toLocaleDateString('es-ES');
      throw new ForbiddenException(`Tu cuenta está suspendida hasta el ${until}`);
    }
  }

  private async resolveUser(token: string): Promise<AuthUserPayload> {
    // 1. Token interno del panel admin (login server-side sin clerk-js)
    const adminPanelUser = await this.resolveAdminPanelToken(token);
    if (adminPanelUser) return adminPanelUser;

    // 2. Clerk JWT (producción)
    const clerkResult = await this.clerk.verifyClerkToken(token);
    if (clerkResult) {
      return this.clerk.syncUserFromClerk(clerkResult.clerkUserId);
    }

    // 3. Legacy JWT interno (dev / seed / migración)
    if (isLegacyAuthEnabled(this.config)) {
      try {
        const payload = this.jwt.verify<JwtPayload>(token, {
          secret: this.config.get('JWT_SECRET', 'change-me'),
        });
        return {
          sub: payload.sub,
          phone: payload.phone,
          roles: payload.roles,
          campId: payload.campId,
        };
      } catch {
        // fall through
      }
    }

    throw new UnauthorizedException('Token inválido o expirado');
  }

  /** Valida token HMAC emitido por apps/admin tras verifyPassword server-side. */
  private async resolveAdminPanelToken(token: string): Promise<AuthUserPayload | null> {
    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');
    if (!secretKey) return null;

    const [body, sig] = token.split('.');
    if (!body || !sig) return null;

    const expected = createHmac('sha256', secretKey).update(body).digest('base64url');
    try {
      if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        return null;
      }
    } catch {
      return null;
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Record<string, unknown>;
    } catch {
      return null;
    }

    if (payload.purpose !== 'admin_panel') return null;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    if (typeof payload.clerkUserId !== 'string') return null;

    return this.clerk.syncUserFromClerk(payload.clerkUserId);
  }
}

function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
