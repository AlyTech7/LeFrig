import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Post('track')
  @RateLimit({ limit: 120, windowSec: 60, keyPrefix: 'analytics:track' })
  track(
    @Body()
    body: { eventType: string; category?: string; campId?: string; term?: string; value?: number },
  ) {
    return this.analyticsService.track(body.eventType, body);
  }

  @Get('aggregates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  getAggregates(@Query('campId') campId?: string) {
    return this.analyticsService.getAggregates(campId);
  }
}
