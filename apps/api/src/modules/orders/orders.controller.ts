import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  findAll(@CurrentUser() user: { sub: string }, @Query() query: unknown) {
    return this.ordersService.findAll(user.sub, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.ordersService.findOne(id, user.sub);
  }

  @Post()
  create(@CurrentUser() user: { sub: string }, @Body() body: unknown) {
    return this.ordersService.create(user.sub, body);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @Body() body: unknown,
  ) {
    return this.ordersService.updateStatus(id, user.sub, body);
  }
}
