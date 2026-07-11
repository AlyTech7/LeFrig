import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('moderation')
@Controller('moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ModerationController {
  constructor(private moderationService: ModerationService) {}

  @Get('reports')
  @Roles('moderator', 'admin')
  getReports(@Query() query: unknown) {
    return this.moderationService.getReports(query);
  }

  @Get('logs')
  @Roles('moderator', 'admin')
  getLogs() {
    return this.moderationService.getLogs();
  }

  @Post('reports')
  createReport(
    @CurrentUser() user: { sub: string },
    @Body()
    body: { targetType: string; targetId: string; targetUserId?: string; reason: string; details?: string },
  ) {
    return this.moderationService.createReport(user.sub, body);
  }

  @Patch('reports/:id')
  @Roles('moderator', 'admin')
  reviewReport(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @Body() body: { action: string; notes?: string },
  ) {
    return this.moderationService.reviewReport(id, user.sub, body.action, body.notes);
  }
}
