import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { ClerkService, type AuthUserPayload } from '../../modules/auth/clerk.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '@lefrig/shared';
import { isLegacyAuthEnabled, resolveJwtSecret, resolveAdminSessionSecret } from '../config/production-security';

/**
 * Igual que AuthGuard pero permite acceso anónimo (request.user queda undefined).
 * Útil para GET de detalle donde el PIN/rol dependen del viewer.
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private clerk: ClerkService,
    private jwt: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization as string | undefined;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return true;

    try {
      const user = await this.resolveUser(token);
      await this.assertNotBanned(user.sub);
      request.user = user;
    } catch {
      // Token inválido → tratar como anónimo
    }
    return true;
  }

  private async assertNotBanned(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { bannedAt: true, suspendedUntil: true },
    });
    if (!user) return;
    if (user.bannedAt) {
      throw new ForbiddenException('Tu cuenta ha sido suspendida. Contacta con hola@lefrig.com');
    }
    if (user.suspendedUntil && user.suspendedUntil > new Date()) {
      const until = user.suspendedUntil.toLocaleDateString('es-ES');
      throw new ForbiddenException(`Tu cuenta está suspendida hasta el ${until}`);
    }
  }

  private async resolveUser(token: string): Promise<AuthUserPayload> {
    const adminPanelUser = await this.resolveAdminPanelToken(token);
    if (adminPanelUser) return adminPanelUser;

    const clerkResult = await this.clerk.verifyClerkToken(token);
    if (clerkResult) {
      return this.clerk.syncUserFromClerk(clerkResult.clerkUserId);
    }

    if (isLegacyAuthEnabled(this.config)) {
      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: resolveJwtSecret(this.config),
      });
      const dbUser = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { roles: true, campId: true, phone: true },
      });
      if (!dbUser) throw new Error('Usuario no encontrado');
      return {
        sub: payload.sub,
        phone: dbUser.phone ?? payload.phone,
        roles: dbUser.roles,
        campId: dbUser.campId ?? payload.campId,
      };
    }

    throw new Error('Token inválido');
  }

  private async resolveAdminPanelToken(token: string): Promise<AuthUserPayload | null> {
    const secretKey = resolveAdminSessionSecret(this.config);
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
