import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ShopsService } from './shops.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('shops')
@Controller('shops')
export class ShopsController {
  constructor(private shopsService: ShopsService) {}

  @Get()
  findAll(@Query() query: unknown) {
    return this.shopsService.findAll(query);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findMine(@CurrentUser() user: { sub: string }) {
    return this.shopsService.findMine(user.sub);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.shopsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@CurrentUser() user: { sub: string }, @Body() body: unknown) {
    return this.shopsService.create(user.sub, body);
  }

  @Get(':shopId/products')
  listProducts(@Param('shopId') shopId: string) {
    return this.shopsService.listProducts(shopId);
  }

  @Post(':shopId/products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createProduct(
    @Param('shopId') shopId: string,
    @CurrentUser() user: { sub: string },
    @Body() body: unknown,
  ) {
    return this.shopsService.createProduct(shopId, user.sub, body);
  }

  @Patch(':shopId/products/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateProduct(
    @Param('shopId') shopId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: { sub: string },
    @Body() body: unknown,
  ) {
    return this.shopsService.updateProduct(shopId, productId, user.sub, body);
  }

  @Delete(':shopId/products/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteProduct(
    @Param('shopId') shopId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.shopsService.deleteProduct(shopId, productId, user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopsService.findOne(id);
  }
}
