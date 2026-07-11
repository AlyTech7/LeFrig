import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get()
  findByTarget(@Query('targetType') targetType: string, @Query('targetId') targetId: string) {
    return this.reviewsService.findByTarget(targetType, targetId);
  }

  @Get('trust/:userId')
  getTrustScore(@Param('userId') userId: string) {
    return this.reviewsService.getTrustScore(userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@CurrentUser() user: { sub: string }, @Body() body: unknown) {
    return this.reviewsService.create(user.sub, body);
  }
}
