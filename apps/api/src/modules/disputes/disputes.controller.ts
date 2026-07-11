import { Body, Controller, Get, Param, Patch, Post, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DisputesService } from './disputes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('disputes')
@Controller('disputes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DisputesController {
  constructor(private disputesService: DisputesService) {}

  @Get()
  findAll(@CurrentUser() user: { sub: string }) {
    return this.disputesService.findAll(user.sub);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: { sub: string; roles?: string[] }) {
    const dispute = await this.disputesService.findOne(id);
    if (dispute.openerId !== user.sub && dispute.respondentId !== user.sub && !user.roles?.includes('moderator') && !user.roles?.includes('admin')) {
      throw new ForbiddenException('No autorizado');
    }
    return dispute;
  }

  @Post()
  create(@CurrentUser() user: { sub: string }, @Body() body: unknown) {
    return this.disputesService.create(user.sub, body);
  }

  @Post(':id/evidence')
  async addEvidence(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @Body() body: { type: string; url?: string; content?: string },
  ) {
    const dispute = await this.disputesService.findOne(id);
    if (dispute.openerId !== user.sub && dispute.respondentId !== user.sub) {
      throw new ForbiddenException('No autorizado');
    }
    return this.disputesService.addEvidence(id, body);
  }

  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('moderator', 'admin')
  resolve(@Param('id') id: string, @Body('resolution') resolution: string) {
    return this.disputesService.resolve(id, resolution);
  }
}
