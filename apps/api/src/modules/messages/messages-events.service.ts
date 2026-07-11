import { Injectable } from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';

type StreamPayload = { type: string; message?: unknown };

@Injectable()
export class MessagesEventsService {
  private listeners = new Map<string, Set<(payload: StreamPayload) => void>>();

  subscribe(conversationId: string, callback: (payload: StreamPayload) => void) {
    if (!this.listeners.has(conversationId)) {
      this.listeners.set(conversationId, new Set());
    }
    this.listeners.get(conversationId)!.add(callback);
    return () => this.listeners.get(conversationId)?.delete(callback);
  }

  emit(conversationId: string, payload: StreamPayload) {
    this.listeners.get(conversationId)?.forEach((cb) => cb(payload));
  }

  createStream(conversationId: string): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      const handler = (payload: StreamPayload) => {
        subscriber.next({ data: payload });
      };
      const unsub = this.subscribe(conversationId, handler);
      const heartbeat = setInterval(() => {
        subscriber.next({ data: { type: 'ping' } });
      }, 25000);
      return () => {
        unsub();
        clearInterval(heartbeat);
      };
    });
  }
}
