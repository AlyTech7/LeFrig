import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClerkService, type AuthUserPayload } from '../../modules/auth/clerk.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '@lefrig/shared';

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
    // 1. Clerk JWT (producción)
    const clerkResult = await this.clerk.verifyClerkToken(token);
    if (clerkResult) {
      return this.clerk.syncUserFromClerk(clerkResult.clerkUserId);
    }

    // 2. Legacy JWT interno (dev / seed / migración)
    if (this.config.get('AUTH_LEGACY_JWT', 'true') === 'true') {
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
}

function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
