import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('ledger')
@Controller('ledger')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LedgerController {
  constructor(private ledgerService: LedgerService) {}

  @Get('accounts')
  getAccounts(@CurrentUser() user: { sub: string }) {
    return this.ledgerService.getAccounts(user.sub);
  }

  @Get('accounts/:id')
  getAccount(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.ledgerService.getAccount(id, user.sub);
  }

  @Post('entries')
  addEntry(@Body() body: unknown) {
    return this.ledgerService.addEntry(body);
  }

  @Post('payments')
  recordPayment(
    @CurrentUser() user: { sub: string },
    @Body() body: { accountId: string; amount: number; method?: string; notes?: string },
  ) {
    return this.ledgerService.recordPayment(body.accountId, user.sub, body.amount, body.method, body.notes);
  }
}
