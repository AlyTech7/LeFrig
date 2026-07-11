import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class FcmAdapter {
  private readonly logger = new Logger(FcmAdapter.name);
  private readonly serverKey: string | undefined;
  private readonly useMock: boolean;

  constructor(config: ConfigService) {
    const key = config.get<string>('FCM_SERVER_KEY');
    this.serverKey = key;
    this.useMock = !key || key === 'mock-fcm-key' || key.startsWith('mock');
  }

  async sendToDevice(deviceToken: string, payload: PushPayload): Promise<{ messageId: string }> {
    if (this.useMock || deviceToken.startsWith('mock-token-')) {
      this.logger.log(
        `[MOCK FCM] → ${deviceToken.slice(0, 12)}... | ${payload.title}: ${payload.body}`,
      );
      return { messageId: `mock-fcm-${Date.now()}` };
    }

    if (deviceToken.startsWith('ExponentPushToken') || deviceToken.startsWith('ExpoPushToken')) {
      return this.sendExpoPush(deviceToken, payload);
    }

    try {
      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          Authorization: `key=${this.serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: deviceToken,
          notification: { title: payload.title, body: payload.body },
          data: payload.data ?? {},
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        this.logger.warn(`FCM error ${res.status}: ${text}`);
        return { messageId: `fcm-error-${Date.now()}` };
      }

      const json = (await res.json()) as { message_id?: number; multicast_id?: number };
      return { messageId: String(json.message_id ?? json.multicast_id ?? Date.now()) };
    } catch (e) {
      this.logger.error(`FCM send failed: ${(e as Error).message}`);
      return { messageId: `fcm-fail-${Date.now()}` };
    }
  }

  private async sendExpoPush(deviceToken: string, payload: PushPayload): Promise<{ messageId: string }> {
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          to: deviceToken,
          title: payload.title,
          body: payload.body,
          data: payload.data ?? {},
        }),
      });
      if (!res.ok) {
        this.logger.warn(`Expo push error ${res.status}`);
        return { messageId: `expo-error-${Date.now()}` };
      }
      const json = (await res.json()) as { data?: { id?: string }[] };
      return { messageId: json.data?.[0]?.id ?? `expo-${Date.now()}` };
    } catch (e) {
      this.logger.error(`Expo push failed: ${(e as Error).message}`);
      return { messageId: `expo-fail-${Date.now()}` };
    }
  }

  async sendToTopic(topic: string, payload: PushPayload): Promise<{ messageId: string }> {
    if (this.useMock) {
      this.logger.log(`[MOCK FCM] topic:${topic} | ${payload.title}`);
      return { messageId: `mock-fcm-topic-${Date.now()}` };
    }

    try {
      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          Authorization: `key=${this.serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: `/topics/${topic}`,
          notification: { title: payload.title, body: payload.body },
          data: payload.data ?? {},
        }),
      });
      if (!res.ok) {
        this.logger.warn(`FCM topic error ${res.status}`);
        return { messageId: `fcm-topic-error-${Date.now()}` };
      }
      const json = (await res.json()) as { message_id?: number };
      return { messageId: String(json.message_id ?? Date.now()) };
    } catch (e) {
      this.logger.error(`FCM topic send failed: ${(e as Error).message}`);
      return { messageId: `fcm-topic-fail-${Date.now()}` };
    }
  }
}
