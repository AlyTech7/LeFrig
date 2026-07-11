import { Module } from '@nestjs/common';
import { NeedsController } from './needs.controller';
import { NeedsService } from './needs.service';
import { SmartMatchingService } from './smart-matching.service';

@Module({
  controllers: [NeedsController],
  providers: [NeedsService, SmartMatchingService],
})
export class NeedsModule {}
