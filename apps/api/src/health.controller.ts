import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';
import { MeilisearchAdapter } from './adapters/meilisearch.adapter';
import { RedisAdapter } from './adapters/redis.adapter';
import { StorageAdapter } from './adapters/storage.adapter';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private meili: MeilisearchAdapter,
    private redis: RedisAdapter,
    private storage: StorageAdapter,
  ) {}

  @Get('health')
  async health() {
    let db: 'connected' | 'disconnected' = 'disconnected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = 'connected';
    } catch {
      /* degraded */
    }

    const storageMode = this.storage.getMode();
    const storagePersistent = this.storage.isPersistent();

    return {
      status: db === 'connected' ? 'ok' : 'degraded',
      db,
      storage: storageMode,
      storagePersistent,
      storagePublicUrl: this.storage.getPublicBaseUrl(),
      redis: this.redis.isConfigured() ? 'connected' : 'optional',
      meilisearch: this.meili.isConfigured() ? 'configured' : 'optional',
      timestamp: new Date().toISOString(),
    };
  }
}
