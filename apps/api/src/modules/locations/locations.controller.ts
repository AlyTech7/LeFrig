import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LocationsService } from './locations.service';

@ApiTags('locations')
@Controller('locations')
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  @Get('dairas')
  getDairas(@Query('campId') campId?: string) {
    return this.locationsService.getDairas(campId);
  }

  @Get('neighborhoods')
  getNeighborhoods(@Query('campId') campId?: string, @Query('dairaId') dairaId?: string) {
    return this.locationsService.getNeighborhoods(campId, dairaId);
  }

  @Get('markets')
  getMarkets(@Query('campId') campId?: string) {
    return this.locationsService.getMarketAreas(campId);
  }

  @Get('pickup-points')
  getPickupPoints(@Query('campId') campId?: string) {
    return this.locationsService.getPickupPoints(campId);
  }

  @Get('routes')
  getRoutes(
    @Query('originCampId') originCampId?: string,
    @Query('destinationCampId') destinationCampId?: string,
  ) {
    return this.locationsService.getRoutes(originCampId, destinationCampId);
  }
}
