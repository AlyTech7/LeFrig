import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('community')
@Controller('community')
export class CommunityController {
  constructor(private communityService: CommunityService) {}

  @Get('posts')
  findAll(@Query() query: unknown) {
    return this.communityService.findAll(query);
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: { sub: string },
    @Body()
    body: { campId: string; postType: string; title: string; content: string; images?: string[] },
  ) {
    return this.communityService.create(user.sub, body);
  }
}
