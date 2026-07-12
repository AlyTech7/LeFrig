import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Webhook } from 'svix';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { ClerkService } from './clerk.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUserPayload } from './clerk.service';
import { PrismaService } from '../../prisma/prisma.service';
import { isLegacyAuthEnabled } from '../../common/config/production-security';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private clerkService: ClerkService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  /** Sincroniza usuario Clerk → Prisma tras login en cliente */
  @Post('sync')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async sync(@CurrentUser() user: AuthUserPayload) {
    const dbUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.sub },
      select: {
        id: true,
        clerkId: true,
        phone: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        roles: true,
        campId: true,
        verificationLevel: true,
        reputationScore: true,
        badges: true,
        preferredLanguage: true,
      },
    });
    return { success: true, user: dbUser };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async me(@CurrentUser() user: AuthUserPayload) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: user.sub },
      select: {
        id: true,
        clerkId: true,
        phone: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        roles: true,
        campId: true,
        verificationLevel: true,
        reputationScore: true,
        badges: true,
        preferredLanguage: true,
        createdAt: true,
      },
    });
  }

  /** Webhook Clerk (user.created, user.updated, user.deleted) */
  @Post('clerk/webhook')
  async clerkWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const secret = this.config.get('CLERK_WEBHOOK_SECRET');
    if (!secret) {
      throw new UnauthorizedException('Webhook no configurado');
    }

    const wh = new Webhook(secret);
    const body = req.rawBody ?? req.body;
    const payload = typeof body === 'string' ? body : JSON.stringify(body);

    let event: { type: string; data: Record<string, unknown> };
    try {
      event = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as { type: string; data: Record<string, unknown> };
    } catch {
      throw new UnauthorizedException('Firma webhook inválida');
    }

    await this.clerkService.handleWebhookEvent(event.type, event.data);
    return { received: true };
  }

  /** @deprecated Usar Clerk — OTP mock solo dev */
  @Post('otp/request')
  @RateLimit({ limit: 8, windowSec: 3600, keyPrefix: 'auth:otp:request' })
  requestOtp(@Body() body: unknown) {
    if (!isLegacyAuthEnabled(this.config)) throw new NotFoundException();
    return this.authService.requestOtp(body);
  }

  /** @deprecated Usar Clerk — OTP mock solo dev */
  @Post('otp/verify')
  @RateLimit({ limit: 20, windowSec: 600, keyPrefix: 'auth:otp:verify' })
  verifyOtp(@Body() body: unknown) {
    if (!isLegacyAuthEnabled(this.config)) throw new NotFoundException();
    return this.authService.verifyOtp(body);
  }

  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string) {
    if (!isLegacyAuthEnabled(this.config)) throw new NotFoundException();
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  logout(@CurrentUser() user: AuthUserPayload) {
    return this.authService.logout(user.sub);
  }
}
