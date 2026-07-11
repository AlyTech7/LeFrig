import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@lefrig/offline_queue';

export interface OfflineAction {
  id: string;
  type: 'create_listing' | 'send_message' | 'create_order';
  payload: Record<string, unknown>;
  createdAt: string;
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as OfflineAction[]) : [];
  } catch {
    return [];
  }
}

export async function enqueueOfflineAction(
  type: OfflineAction['type'],
  payload: Record<string, unknown>,
): Promise<OfflineAction> {
  const queue = await getOfflineQueue();
  const action: OfflineAction = {
    id: `offline-${Date.now()}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
  };
  queue.push(action);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return action;
}

export async function flushOfflineQueue(
  send: (action: OfflineAction) => Promise<boolean>,
): Promise<{ synced: number; failed: number }> {
  const queue = await getOfflineQueue();
  const remaining: OfflineAction[] = [];
  let synced = 0;
  let failed = 0;

  for (const action of queue) {
    try {
      const ok = await send(action);
      if (ok) synced++;
      else {
        remaining.push(action);
        failed++;
      }
    } catch {
      remaining.push(action);
      failed++;
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return { synced, failed };
}

export async function getQueueCount(): Promise<number> {
  const q = await getOfflineQueue();
  return q.length;
}
