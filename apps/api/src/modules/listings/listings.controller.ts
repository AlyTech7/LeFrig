import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private listingsService: ListingsService) {}

  @Get()
  findAll(@Query() query: unknown) {
    return this.listingsService.findAll(query);
  }

  @Get('favorites/mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getFavorites(@CurrentUser() user: { sub: string }) {
    return this.listingsService.getFavorites(user.sub);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findMine(@CurrentUser() user: { sub: string }) {
    return this.listingsService.findMine(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@CurrentUser() user: { sub: string }, @Body() body: unknown) {
    return this.listingsService.create(user.sub, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @CurrentUser() user: { sub: string }, @Body() body: unknown) {
    return this.listingsService.update(id, user.sub, body);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  favorite(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.listingsService.toggleFavorite(user.sub, id);
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  report(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @Body() body: { reason: string; details?: string },
  ) {
    return this.listingsService.report(user.sub, id, body.reason, body.details);
  }
}
