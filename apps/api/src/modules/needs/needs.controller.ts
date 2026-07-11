import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NeedsService } from './needs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('needs')
@Controller('needs')
export class NeedsController {
  constructor(private needsService: NeedsService) {}

  @Get()
  findAll(@Query() query: unknown) {
    return this.needsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.needsService.findOne(id);
  }

  @Get(':id/matches')
  getMatches(@Param('id') id: string) {
    return this.needsService.getMatches(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { sub: string }, @Body() body: unknown) {
    return this.needsService.create(user.sub, body);
  }

  @Post(':id/offers')
  @UseGuards(JwtAuthGuard)
  createOffer(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @Body() body: { message: string; priceEstimate?: number },
  ) {
    return this.needsService.createOffer(id, user.sub, body.message, body.priceEstimate);
  }
}
