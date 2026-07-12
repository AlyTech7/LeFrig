import { Injectable, UnauthorizedException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RateLimitService } from '../../common/rate-limit/rate-limit.service';
import { requestOtpSchema, verifyOtpSchema } from '@lefrig/shared';
import type { JwtPayload } from '@lefrig/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private rateLimit: RateLimitService,
  ) {}

  async requestOtp(input: unknown) {
    const { phone } = requestOtpSchema.parse(input);

    const attempts = await this.rateLimit.increment(`otp:req:${phone}`, 3600);
    if (attempts > 8) {
      throw new HttpException('Demasiados intentos de OTP. Inténtalo más tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const mockCode = this.config.get('OTP_MOCK_CODE', '123456');
    const codeHash = await bcrypt.hash(mockCode, 10);

    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { phone, displayName: `Usuario ${phone.slice(-4)}` },
      });
    }

    await this.prisma.otpCode.create({
      data: {
        userId: user.id,
        phone,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    return {
      success: true,
      message: 'OTP enviado (mock en dev)',
      ...(process.env.NODE_ENV !== 'production' && { mockCode }),
    };
  }

  async verifyOtp(input: unknown) {
    const { phone, code } = verifyOtpSchema.parse(input);
    const otp = await this.prisma.otpCode.findFirst({
      where: { phone, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new UnauthorizedException('OTP no válido o expirado');

    const mockCode = this.config.get('OTP_MOCK_CODE', '123456');
    const valid = code === mockCode || (await bcrypt.compare(code, otp.codeHash));
    if (!valid) throw new UnauthorizedException('Código OTP incorrecto');

    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { phone } });
    if (user.verificationLevel === 'unverified') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { verificationLevel: 'phone' },
      });
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new BadRequestException('Refresh token requerido');

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    if (!stored) throw new UnauthorizedException('Refresh token inválido');

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.user);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  private async issueTokens(user: { id: string; phone: string | null; roles: string[]; campId: string | null }) {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone ?? '',
      roles: user.roles,
      campId: user.campId ?? undefined,
    };

    const accessToken = this.jwt.sign(payload);
    const refreshToken = randomBytes(48).toString('hex');
    const refreshHash = createHash('sha256').update(refreshToken).digest('hex');
    const expiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN', '7d');
    const days = parseInt(expiresIn) || 7;

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshHash,
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        roles: user.roles,
        campId: user.campId,
      },
    };
  }
}
