import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@lefrig/offline_queue';

export interface OfflineAction {
  id: string;
  type: 'create_listing' | 'send_message' | 'create_order';
  payload: Record<string, unknown>;
  createdAt: string;
}

/** Mutex: serializa read-modify-write de la cola (enqueue vs flush). */
let queueLock: Promise<void> = Promise.resolve();

function withQueueLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queueLock.then(fn, fn);
  queueLock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readQueue(): Promise<OfflineAction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as OfflineAction[]) : [];
  } catch {
    return [];
  }
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  return withQueueLock(() => readQueue());
}

export async function enqueueOfflineAction(
  type: OfflineAction['type'],
  payload: Record<string, unknown>,
): Promise<OfflineAction> {
  return withQueueLock(async () => {
    const queue = await readQueue();
    const action: OfflineAction = {
      id: `offline-${Date.now()}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
    };
    queue.push(action);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return action;
  });
}

export async function flushOfflineQueue(
  send: (action: OfflineAction) => Promise<boolean>,
): Promise<{ synced: number; failed: number }> {
  return withQueueLock(async () => {
    const queue = await readQueue();
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
  });
}

export async function getQueueCount(): Promise<number> {
  const q = await getOfflineQueue();
  return q.length;
}
