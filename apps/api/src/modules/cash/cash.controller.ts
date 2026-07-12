import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CashService } from './cash.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

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
  confirm(@CurrentUser() user: { sub: string }, @Body() body: unknown) {
    return this.cashService.confirm(user.sub, body);
  }
}
