import { Injectable } from '@nestjs/common';
import { RedisAdapter } from '../../adapters/redis.adapter';

type MemoryEntry = { count: number; expiresAt: number };

@Injectable()
export class RateLimitService {
  private readonly memory = new Map<string, MemoryEntry>();

  constructor(private redis: RedisAdapter) {}

  /** Incrementa contador; devuelve el total en la ventana (nunca 0 por “sin límite”). */
  async increment(key: string, windowSec: number): Promise<number> {
    if (this.redis.isConfigured()) {
      const count = await this.redis.incr(key, windowSec);
      if (count > 0) return count;
    }
    return this.incrementMemory(key, windowSec);
  }

  async getCount(key: string): Promise<number> {
    if (this.redis.isConfigured()) {
      // incr almacena enteros en claro; get() hace JSON.parse (válido para "3").
      const raw = await this.redis.get<unknown>(key);
      if (raw != null) {
        const n = typeof raw === 'number' ? raw : Number(raw);
        if (Number.isFinite(n) && n > 0) return n;
      }
    }
    const entry = this.memory.get(key);
    if (!entry || entry.expiresAt <= Date.now()) return 0;
    return entry.count;
  }

  async isAllowed(key: string, limit: number, windowSec: number): Promise<boolean> {
    const count = await this.increment(key, windowSec);
    return count <= limit;
  }

  private incrementMemory(key: string, windowSec: number): number {
    const now = Date.now();
    const entry = this.memory.get(key);
    if (!entry || entry.expiresAt <= now) {
      this.memory.set(key, { count: 1, expiresAt: now + windowSec * 1000 });
      this.pruneMemory(now);
      return 1;
    }
    entry.count += 1;
    return entry.count;
  }

  private pruneMemory(now: number) {
    if (this.memory.size < 5000) return;
    for (const [k, v] of this.memory) {
      if (v.expiresAt <= now) this.memory.delete(k);
    }
  }
}
