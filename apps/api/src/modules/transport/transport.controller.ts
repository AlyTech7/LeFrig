import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransportService } from './transport.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('transport')
@Controller('transport')
export class TransportController {
  constructor(private transportService: TransportService) {}

  @Get('hubs')
  getHubCatalog() {
    return this.transportService.getHubCatalog();
  }

  @Get('drivers')
  getDrivers(@Query() query: Record<string, string>) {
    return this.transportService.getDrivers(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyTrips(@CurrentUser() user: { sub: string }) {
    return this.transportService.findMyTrips(user.sub);
  }

  @Post('drivers/register')
  @UseGuards(JwtAuthGuard)
  registerDriver(@CurrentUser() user: { sub: string }, @Body() body: unknown) {
    return this.transportService.registerDriver(user.sub, body);
  }

  @Get('drivers/me')
  @UseGuards(JwtAuthGuard)
  getMyDriverProfile(@CurrentUser() user: { sub: string }) {
    return this.transportService.getMyDriverProfile(user.sub);
  }

  @Get()
  findAll(@Query() query: unknown) {
    return this.transportService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transportService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { sub: string }, @Body() body: unknown) {
    return this.transportService.create(user.sub, body);
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard)
  assignDriver(@Param('id') id: string, @Body('driverId') driverId: string) {
    return this.transportService.assignDriver(id, driverId);
  }

  @Patch(':id/claim')
  @UseGuards(JwtAuthGuard)
  claimAsDriver(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.transportService.claimAsDriver(id, user.sub);
  }
}
