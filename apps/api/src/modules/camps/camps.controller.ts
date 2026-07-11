import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CampsService } from './camps.service';

@ApiTags('camps')
@Controller('camps')
export class CampsController {
  constructor(private campsService: CampsService) {}

  @Get()
  findAll() {
    return this.campsService.findAll();
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.campsService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campsService.findOne(id);
  }
}
