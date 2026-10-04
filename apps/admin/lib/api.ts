import { readEnv } from './site-url';

function resolveApiUrl(): string {
  // Prefer server-only runtime env (not inlined at build like NEXT_PUBLIC_*).
  const fromServer = readEnv('API_URL') ?? readEnv('LEFRIG_API_URL');
  if (fromServer) return fromServer.replace(/\/$/, '');

  const fromPublic = readEnv('NEXT_PUBLIC_API_URL');
  if (fromPublic) return fromPublic.replace(/\/$/, '');

  if (process.env.NODE_ENV === 'production') {
    throw new Error('API_URL o NEXT_PUBLIC_API_URL es obligatoria en producción');
  }
  return 'http://localhost:3001';
}

export const API_URL = resolveApiUrl();

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
