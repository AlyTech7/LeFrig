import { readEnv } from './site-url';

const API_PRODUCTION_ORIGIN = 'https://whale-app-xpe4g.ondigitalocean.app';

export const API_URL =
  readEnv('NEXT_PUBLIC_API_URL') ??
  (process.env.NODE_ENV === 'production' ? API_PRODUCTION_ORIGIN : 'http://localhost:3001');

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
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

export * from './demo-data';
