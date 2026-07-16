import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { API_URL } from './api';
import {
  ADMIN_SESSION_COOKIE,
  createAdminApiToken,
  verifyAdminSessionToken,
} from './admin-session';

async function resolveBearerToken(): Promise<string | null> {
  const { getToken } = await auth();
  const clerkToken = await getToken();
  if (clerkToken) return clerkToken;

  const cookieStore = await cookies();
  const adminSession = await verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!adminSession) return null;

  return createAdminApiToken(adminSession.clerkUserId);
}

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await resolveBearerToken();

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
