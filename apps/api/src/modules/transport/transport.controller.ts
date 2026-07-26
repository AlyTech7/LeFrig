import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { TransportService } from './transport.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';

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
  @ApiBearerAuth()
  getMyTrips(@CurrentUser() user: { sub: string }) {
    return this.transportService.findMyTrips(user.sub);
  }

  @Post('drivers/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  registerDriver(@CurrentUser() user: { sub: string }, @Body() body: unknown) {
    return this.transportService.registerDriver(user.sub, body);
  }

  @Get('drivers/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyDriverProfile(@CurrentUser() user: { sub: string }) {
    return this.transportService.getMyDriverProfile(user.sub);
  }

  @Get()
  findAll(@Query() query: unknown) {
    return this.transportService.findAll(query);
  }

  @Get(':id/receipt/pdf')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiProduces('application/pdf')
  @Header('Content-Type', 'application/pdf')
  async getReceiptPdf(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const pdf = await this.transportService.getReceiptPdf(id, user.sub);
    res.setHeader('Content-Disposition', `attachment; filename="lefrig-viaje-${id.slice(0, 8)}.pdf"`);
    return new StreamableFile(pdf);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user?: { sub: string }) {
    return this.transportService.findOne(id, user?.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@CurrentUser() user: { sub: string }, @Body() body: unknown) {
    return this.transportService.create(user.sub, body);
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  assignDriver(@Param('id') id: string, @Body('driverId') driverId: string) {
    return this.transportService.assignDriver(id, driverId);
  }

  @Patch(':id/claim')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  claimAsDriver(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.transportService.claimAsDriver(id, user.sub);
  }

  @Patch(':id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  startTrip(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.transportService.startTrip(id, user.sub);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  completeTrip(@Param('id') id: string, @CurrentUser() user: { sub: string }, @Body() body: unknown) {
    return this.transportService.completeTrip(id, user.sub, body);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  cancelTrip(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.transportService.cancelTrip(id, user.sub);
  }
}
