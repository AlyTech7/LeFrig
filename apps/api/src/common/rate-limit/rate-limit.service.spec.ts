import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimitService } from './rate-limit.service';
import type { RedisAdapter } from '../../adapters/redis.adapter';

describe('RateLimitService', () => {
  let service: RateLimitService;
  let redis: { isConfigured: ReturnType<typeof vi.fn>; incr: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    redis = {
      isConfigured: vi.fn().mockReturnValue(false),
      incr: vi.fn(),
    };
    service = new RateLimitService(redis as unknown as RedisAdapter);
  });

  it('limita con memoria cuando Redis no está configurado', async () => {
    const key = 'test:key';
    expect(await service.isAllowed(key, 3, 60)).toBe(true);
    expect(await service.isAllowed(key, 3, 60)).toBe(true);
    expect(await service.isAllowed(key, 3, 60)).toBe(true);
    expect(await service.isAllowed(key, 3, 60)).toBe(false);
  });

  it('usa Redis cuando está disponible', async () => {
    redis.isConfigured.mockReturnValue(true);
    redis.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(2).mockResolvedValueOnce(5);

    expect(await service.isAllowed('rl:x', 4, 60)).toBe(true);
    expect(await service.isAllowed('rl:x', 4, 60)).toBe(true);
    expect(await service.isAllowed('rl:x', 4, 60)).toBe(false);
    expect(redis.incr).toHaveBeenCalledTimes(3);
  });
});
