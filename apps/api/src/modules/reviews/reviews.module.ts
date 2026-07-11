import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { TrustScoreService } from './trust-score.service';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, TrustScoreService],
  exports: [ReviewsService, TrustScoreService],
})
export class ReviewsModule {}
