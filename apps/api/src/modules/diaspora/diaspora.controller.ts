import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DiasporaService } from './diaspora.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('diaspora')
@Controller('diaspora')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DiasporaController {
  constructor(private diasporaService: DiasporaService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: { sub: string }) {
    return this.diasporaService.getProfile(user.sub);
  }

  @Put('profile')
  upsertProfile(
    @CurrentUser() user: { sub: string },
    @Body()
    body: {
      country: string;
      city?: string;
      beneficiaryName?: string;
      beneficiaryPhone?: string;
      preferredCampId?: string;
    },
  ) {
    return this.diasporaService.upsertProfile(user.sub, body);
  }

  @Get('orders')
  getOrders(@CurrentUser() user: { sub: string }) {
    return this.diasporaService.getOrders(user.sub);
  }

  @Post('orders')
  createOrder(
    @CurrentUser() user: { sub: string },
    @Body() body: { orderType: string; description: string; budget?: number; campId?: string },
  ) {
    return this.diasporaService.createOrder(user.sub, body);
  }
}
