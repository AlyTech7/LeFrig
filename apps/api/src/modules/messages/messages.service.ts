import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MessagesEventsService } from './messages-events.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private events: MessagesEventsService,
  ) {}

  async assertParticipant(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new ForbiddenException('No tienes acceso a esta conversación');
  }

  async getConversations(userId: string) {
    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            participants: {
              include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return participations.map((p) => p.conversation);
  }

  async getMessages(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new ForbiddenException('No tienes acceso a esta conversación');

    return this.prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(userId: string, data: { conversationId?: string; recipientId?: string; content: string; type?: string; refId?: string }) {
    let conversationId = data.conversationId;

    if (!conversationId && data.recipientId) {
      const existing = await this.prisma.conversation.findFirst({
        where: {
          type: 'direct',
          AND: [
            { participants: { some: { userId } } },
            { participants: { some: { userId: data.recipientId } } },
          ],
        },
      });

      if (existing) {
        conversationId = existing.id;
      } else {
        const conv = await this.prisma.conversation.create({
          data: {
            type: data.type ?? 'direct',
            refId: data.refId,
            participants: {
              create: [{ userId }, { userId: data.recipientId }],
            },
          },
        });
        conversationId = conv.id;
      }
    }

    if (!conversationId) throw new NotFoundException('Conversación no encontrada');

    const message = await this.prisma.message.create({
      data: { conversationId, senderId: userId, content: data.content },
      include: { sender: { select: { id: true, displayName: true } } },
    });

    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: userId } },
      select: { userId: true },
    });

    await Promise.all(
      participants.map((p) =>
        this.notifications.create(p.userId, {
          type: 'new_message',
          title: 'Nuevo mensaje',
          body: `${message.sender.displayName}: ${data.content.slice(0, 80)}`,
          data: { conversationId },
        }),
      ),
    );

    this.events.emit(conversationId, { type: 'message', message });

    return message;
  }
}
