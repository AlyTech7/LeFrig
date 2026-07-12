import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CampsModule } from './modules/camps/camps.module';
import { LocationsModule } from './modules/locations/locations.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ListingsModule } from './modules/listings/listings.module';
import { CashModule } from './modules/cash/cash.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { ServicesModule } from './modules/services/services.module';
import { ShopsModule } from './modules/shops/shops.module';
import { OrdersModule } from './modules/orders/orders.module';
import { TransportModule } from './modules/transport/transport.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { DiasporaModule } from './modules/diaspora/diaspora.module';
import { VouchersModule } from './modules/vouchers/vouchers.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { NeedsModule } from './modules/needs/needs.module';
import { CommunityModule } from './modules/community/community.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';
import { AiModule } from './modules/ai/ai.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { StorageAdapter } from './adapters/storage.adapter';
import { FcmAdapter } from './adapters/fcm.adapter';
import { MeilisearchAdapter } from './adapters/meilisearch.adapter';
import { RedisAdapter } from './adapters/redis.adapter';
import { ManualPaymentAdapter } from './adapters/payment.adapter';
import { SearchModule } from './search/search.module';
import { HealthController } from './health.controller';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';

@Global()
@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    RateLimitModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    CampsModule,
    LocationsModule,
    CategoriesModule,
    ListingsModule,
    CashModule,
    LedgerModule,
    ServicesModule,
    ShopsModule,
    OrdersModule,
    TransportModule,
    JobsModule,
    DiasporaModule,
    VouchersModule,
    MessagesModule,
    NotificationsModule,
    ReviewsModule,
    ModerationModule,
    DisputesModule,
    NeedsModule,
    CommunityModule,
    AnalyticsModule,
    AdminModule,
    AiModule,
    UploadsModule,
    SearchModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    StorageAdapter,
    FcmAdapter,
    MeilisearchAdapter,
    RedisAdapter,
    ManualPaymentAdapter,
  ],
  controllers: [HealthController],
  exports: [StorageAdapter, FcmAdapter, MeilisearchAdapter, RedisAdapter, ManualPaymentAdapter],
})
export class AppModule {}
