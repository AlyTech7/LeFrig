import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('vouchers')
@Controller('vouchers')
export class VouchersController {
  constructor(private vouchersService: VouchersService) {}

  @Get('programs')
  getPrograms() {
    return this.vouchersService.getPrograms();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyVouchers(@CurrentUser() user: { sub: string }) {
    return this.vouchersService.getMyVouchers(user.sub);
  }

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.vouchersService.findByCode(code);
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  redeem(
    @CurrentUser() user: { sub: string },
    @Body() body: { code: string; amount: number },
  ) {
    return this.vouchersService.redeem(body.code, user.sub, body.amount);
  }
}
