import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: { sub: string }, @Query('unreadOnly') unreadOnly?: string) {
    return this.notificationsService.findAll(user.sub, unreadOnly === 'true');
  }

  @Post('devices')
  registerDevice(
    @CurrentUser() user: { sub: string },
    @Body() body: { token: string; platform?: string },
  ) {
    return this.notificationsService.registerDevice(user.sub, body.token, body.platform ?? 'web');
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: { sub: string }) {
    return this.notificationsService.markAllRead(user.sub);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.notificationsService.markRead(id, user.sub);
  }
}
