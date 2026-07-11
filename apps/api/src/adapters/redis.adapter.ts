import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';

@Injectable()
export class RedisAdapter implements OnModuleDestroy {
  private readonly logger = new Logger(RedisAdapter.name);
  private client: RedisClientType | null = null;
  private readonly enabled: boolean;

  constructor(config: ConfigService) {
    const url = config.get<string>('REDIS_URL');
    this.enabled = !!url;
    if (!url) {
      this.logger.debug('REDIS_URL no configurada — caché Redis deshabilitada');
      return;
    }
    this.client = createClient({ url });
    this.client.on('error', (err) => this.logger.warn(`Redis: ${err.message}`));
    void this.client.connect().catch((e) => {
      this.logger.warn(`Redis connect failed: ${(e as Error).message}`);
      this.client = null;
    });
  }

  isConfigured(): boolean {
    return this.enabled && !!this.client?.isOpen;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client?.isOpen) return null;
    try {
      const raw = await this.client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    if (!this.client?.isOpen) return;
    try {
      await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (e) {
      this.logger.debug(`Redis set failed: ${(e as Error).message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client?.isOpen) return;
    try {
      await this.client.del(key);
    } catch {
      /* ignore */
    }
  }

  async incr(key: string, ttlSeconds = 3600): Promise<number> {
    if (!this.client?.isOpen) return 0;
    try {
      const count = await this.client.incr(key);
      if (count === 1) await this.client.expire(key, ttlSeconds);
      return count;
    } catch {
      return 0;
    }
  }

  async onModuleDestroy() {
    if (this.client?.isOpen) await this.client.quit();
  }
}
