import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FcmAdapter } from '../../adapters/fcm.adapter';
import { Prisma } from '@prisma/client';

type PushTokenEntry = { token: string; platform: string; updatedAt: string };

type UserProfile = {
  pushTokens?: PushTokenEntry[];
};

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private fcm: FcmAdapter,
  ) {}

  findAll(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly && { isRead: false }) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  private async getPushTokens(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profile: true },
    });
    const profile = (user?.profile ?? {}) as UserProfile;
    return (profile.pushTokens ?? []).map((t) => t.token);
  }

  async registerDevice(userId: string, token: string, platform: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { profile: true },
    });
    const profile = (user.profile ?? {}) as UserProfile;
    const existing = profile.pushTokens ?? [];
    const filtered = existing.filter((t) => t.token !== token);
    const pushTokens: PushTokenEntry[] = [
      { token, platform, updatedAt: new Date().toISOString() },
      ...filtered,
    ].slice(0, 5);

    await this.prisma.user.update({
      where: { id: userId },
      data: { profile: { ...profile, pushTokens } as Prisma.InputJsonValue },
    });

    return { success: true, tokensRegistered: pushTokens.length };
  }

  async create(userId: string, data: { type: string; title: string; body: string; data?: Record<string, unknown> }) {
    const notification = await this.prisma.notification.create({
      data: { userId, type: data.type, title: data.title, body: data.body, data: data.data as Prisma.InputJsonValue },
    });

    const tokens = await this.getPushTokens(userId);
    const payload = {
      title: data.title,
      body: data.body,
      data: data.data
        ? Object.fromEntries(Object.entries(data.data).map(([k, v]) => [k, String(v)]))
        : undefined,
    };

    if (tokens.length > 0) {
      await Promise.all(tokens.map((token) => this.fcm.sendToDevice(token, payload)));
    } else {
      await this.fcm.sendToDevice(`mock-token-${userId}`, payload);
    }

    return notification;
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
