import { Body, Controller, Get, Header, Param, Post, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CashService } from './cash.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@ApiTags('cash')
@Controller('cash')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CashController {
  constructor(private cashService: CashService) {}

  @Get('my')
  myOperations(@CurrentUser() user: { sub: string }) {
    return this.cashService.findByUser(user.sub);
  }

  @Get('receipt/:code/pdf')
  @ApiProduces('application/pdf')
  @Header('Content-Type', 'application/pdf')
  async getReceiptPdf(
    @CurrentUser() user: { sub: string },
    @Param('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const normalized = code.trim().toUpperCase();
    const pdf = await this.cashService.getReceiptPdf(normalized, user.sub);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="lefrig-recibo-${normalized}.pdf"`,
    );
    return new StreamableFile(pdf);
  }

  @Get('receipt/:code')
  getReceipt(@CurrentUser() user: { sub: string }, @Param('code') code: string) {
    return this.cashService.getReceipt(code.trim().toUpperCase(), user.sub);
  }

  @Get(':code')
  findByCode(@CurrentUser() user: { sub: string }, @Param('code') code: string) {
    return this.cashService.findByCode(code.trim().toUpperCase(), user.sub);
  }

  @Post('agreements')
  createAgreement(
    @CurrentUser() user: { sub: string },
    @Body() body: { listingId?: string; sellerId: string; amount: number; method?: string },
  ) {
    return this.cashService.createAgreement({ ...body, buyerId: user.sub });
  }

  @Post('confirm')
  @RateLimit({ limit: 20, windowSec: 900, keyPrefix: 'cash:confirm' })
  confirm(@CurrentUser() user: { sub: string }, @Body() body: unknown) {
    return this.cashService.confirm(user.sub, body);
  }
}
