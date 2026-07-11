import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { API_URL } from './api';

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const { getToken } = await auth();
  const token = await getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchWithFallback<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    return await fetchApi<T>(path, init);
  } catch {
    return fallback;
  }
}

export type FetchResult<T> = { data: T; fromFallback: boolean };

export async function fetchWithMeta<T>(path: string, fallback: T, init?: RequestInit): Promise<FetchResult<T>> {
  try {
    const data = await fetchApi<T>(path, init);
    return { data, fromFallback: false };
  } catch {
    return { data: fallback, fromFallback: true };
  }
}
