import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { TransportService } from './transport.service';

function mockPrisma() {
  return {
    camp: { findUnique: vi.fn(), findMany: vi.fn() },
    transportRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    driverProfile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    frequentRoute: { deleteMany: vi.fn(), createMany: vi.fn() },
  };
}

describe('TransportService lifecycle', () => {
  let prisma: ReturnType<typeof mockPrisma>;
  let service: TransportService;

  beforeEach(() => {
    prisma = mockPrisma();
    const storage = { assertOwnedImageUrl: vi.fn() };
    service = new TransportService(prisma as never, storage as never);
  });

  it('create rechaza scope inválido (local con Mauritania)', async () => {
    await expect(
      service.create('user-1', {
        type: 'shared_ride',
        scope: 'local',
        originHubSlug: 'rabouni',
        destinationHubSlug: 'nouakchott',
        seatsRequested: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create guarda scope derivado local', async () => {
    prisma.camp.findUnique.mockResolvedValue({ id: 'camp-1' });
    prisma.transportRequest.create.mockResolvedValue({
      id: 'trip-1',
      type: 'shared_ride',
      status: 'requested',
      scope: 'local',
      requesterId: 'user-1',
      driverId: null,
      originHubSlug: 'rabouni',
      destinationHubSlug: 'tindouf',
      originLabel: 'Rabouni',
      destinationLabel: 'Tindouf',
      requester: { displayName: 'A', id: 'user-1' },
    });

    const result = await service.create('user-1', {
      type: 'shared_ride',
      scope: 'local',
      originHubSlug: 'rabouni',
      destinationHubSlug: 'tindouf',
      seatsRequested: 1,
    });

    expect(prisma.transportRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          scope: 'local',
          originHubSlug: 'rabouni',
          destinationHubSlug: 'tindouf',
        }),
      }),
    );
    expect(result.scope).toBe('local');
  });

  it('claim genera PIN de 4 dígitos', async () => {
    prisma.driverProfile.findUnique.mockResolvedValue({
      isVerified: false,
      verificationStatus: 'basic',
      contactPhone: '+213555000000',
    });
    prisma.transportRequest.findUnique.mockResolvedValue({
      id: 'trip-1',
      requesterId: 'pass-1',
      driverId: null,
      status: 'requested',
    });
    prisma.transportRequest.update.mockResolvedValue({
      id: 'trip-1',
      type: 'shared_ride',
      status: 'accepted',
      scope: 'local',
      requesterId: 'pass-1',
      driverId: 'drv-1',
      completionPin: '4321',
      originHubSlug: 'rabouni',
      destinationHubSlug: 'tindouf',
      requester: { displayName: 'P', id: 'pass-1' },
      driver: { displayName: 'D', id: 'drv-1' },
    });

    const result = await service.claimAsDriver('trip-1', 'drv-1');

    expect(prisma.transportRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'accepted',
          driverId: 'drv-1',
          completionPin: expect.stringMatching(/^\d{4}$/),
        }),
      }),
    );
    expect(result.completionPin).toBe('4321');
    expect(result.role).toBe('driver');
  });

  it('complete bilateral marca completed', async () => {
    prisma.transportRequest.findUnique.mockResolvedValue({
      id: 'trip-1',
      status: 'in_progress',
      requesterId: 'pass-1',
      driverId: 'drv-1',
      completionPin: '1234',
      requesterConfirmedAt: new Date(),
      driverConfirmedAt: null,
    });
    prisma.transportRequest.update.mockResolvedValue({
      id: 'trip-1',
      type: 'shared_ride',
      status: 'completed',
      scope: 'local',
      requesterId: 'pass-1',
      driverId: 'drv-1',
      completionPin: '1234',
      requesterConfirmedAt: new Date(),
      driverConfirmedAt: new Date(),
      originHubSlug: 'rabouni',
      destinationHubSlug: 'tindouf',
      requester: { displayName: 'P', id: 'pass-1' },
      driver: { displayName: 'D', id: 'drv-1' },
    });
    prisma.driverProfile.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.completeTrip('trip-1', 'drv-1', { pin: '1234' });

    expect(prisma.transportRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'completed',
          driverConfirmedAt: expect.any(Date),
        }),
      }),
    );
    expect(result.status).toBe('completed');
  });
});
