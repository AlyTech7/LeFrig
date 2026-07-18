import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { NotificationsService } from '../notifications/notifications.service';
import type { MessagesEventsService } from './messages-events.service';

describe('MessagesService IDOR guard', () => {
  let service: MessagesService;
  let prisma: {
    conversationParticipant: { findUnique: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
    message: { create: ReturnType<typeof vi.fn> };
    conversation: { findFirst: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    prisma = {
      conversationParticipant: {
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      message: {
        create: vi.fn().mockResolvedValue({
          id: 'm1',
          content: 'hola',
          sender: { displayName: 'A' },
        }),
      },
      conversation: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    };
    service = new MessagesService(
      prisma as unknown as PrismaService,
      { create: vi.fn() } as unknown as NotificationsService,
      { emit: vi.fn() } as unknown as MessagesEventsService,
    );
  });

  it('rechaza sendMessage con conversationId si no es participante', async () => {
    prisma.conversationParticipant.findUnique.mockResolvedValue(null);
    await expect(
      service.sendMessage('user-1', {
        conversationId: 'conv-1',
        content: 'hack',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it('permite sendMessage tras assertParticipant', async () => {
    prisma.conversationParticipant.findUnique.mockResolvedValue({ userId: 'user-1' });
    await service.sendMessage('user-1', {
      conversationId: 'conv-1',
      content: 'ok',
    });
    expect(prisma.message.create).toHaveBeenCalled();
  });
});
