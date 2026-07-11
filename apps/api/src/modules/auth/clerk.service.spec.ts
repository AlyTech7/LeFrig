import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import type { User as ClerkUser } from '@clerk/backend';
import { ClerkService } from './clerk.service';
import type { PrismaService } from '../../prisma/prisma.service';

function mockClerkUser(overrides: Partial<ClerkUser> = {}): ClerkUser {
  return {
    id: 'user_clerk_abc',
    firstName: 'Fatima',
    lastName: 'Sahrawi',
    username: null,
    imageUrl: 'https://example.com/avatar.png',
    primaryEmailAddressId: 'email_1',
    primaryPhoneNumberId: 'phone_1',
    emailAddresses: [{ id: 'email_1', emailAddress: 'fatima@example.com' }],
    phoneNumbers: [{ id: 'phone_1', phoneNumber: '+22212345678' }],
    publicMetadata: { roles: ['citizen'], campId: 'camp-1' },
    ...overrides,
  } as ClerkUser;
}

describe('ClerkService', () => {
  let service: ClerkService;
  let prisma: {
    user: { upsert: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    prisma = {
      user: {
        upsert: vi.fn().mockResolvedValue({
          id: 'uuid-local-1',
          clerkId: 'user_clerk_abc',
          phone: '+22212345678',
          email: 'fatima@example.com',
          roles: ['citizen'],
          campId: 'camp-1',
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const config = {
      get: vi.fn((key: string) => {
        if (key === 'CLERK_SECRET_KEY') return 'sk_test_mock';
        return undefined;
      }),
    } as unknown as ConfigService;

    service = new ClerkService(config, prisma as unknown as PrismaService);
  });

  it('upsertFromClerkUser crea payload con roles de publicMetadata', async () => {
    const result = await service.upsertFromClerkUser(mockClerkUser());

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clerkId: 'user_clerk_abc' },
        create: expect.objectContaining({
          displayName: 'Fatima Sahrawi',
          roles: ['citizen'],
        }),
      }),
    );
    expect(result.sub).toBe('uuid-local-1');
    expect(result.roles).toEqual(['citizen']);
  });

  it('handleWebhookEvent user.deleted desactiva usuario local', async () => {
    await service.handleWebhookEvent('user.deleted', { id: 'user_clerk_abc' });

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { clerkId: 'user_clerk_abc' },
      data: { isActive: false },
    });
  });

  it('handleWebhookEvent user.created sincroniza usuario', async () => {
    const upsertSpy = vi.spyOn(service, 'upsertFromClerkUser').mockResolvedValue({
      sub: 'uuid-local-1',
      clerkId: 'user_clerk_abc',
      roles: ['citizen'],
    });

    await service.handleWebhookEvent('user.created', mockClerkUser() as unknown as Record<string, unknown>);

    expect(upsertSpy).toHaveBeenCalled();
  });
});
