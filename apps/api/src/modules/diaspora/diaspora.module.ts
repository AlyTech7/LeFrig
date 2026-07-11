import { Module } from '@nestjs/common';
import { DiasporaController } from './diaspora.controller';
import { DiasporaService } from './diaspora.service';

@Module({
  controllers: [DiasporaController],
  providers: [DiasporaService],
})
export class DiasporaModule {}
