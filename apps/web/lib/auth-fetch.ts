'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';
import { API_URL } from './api';
import { isClerkEnabled } from './clerk';

function useGuestAuthFetch() {
  const authFetch = useCallback(async <T,>(_path: string, _init?: RequestInit): Promise<T> => {
    throw new Error('Inicia sesión para continuar');
  }, []);

  const syncUser = useCallback(async () => null, []);

  return { authFetch, syncUser, isSignedIn: false as const, getToken: async () => null as string | null };
}

function useClerkAuthFetch() {
  const { getToken, isSignedIn } = useAuth();

  const authFetch = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(init?.headers as Record<string, string>),
      };

      if (isSignedIn) {
        const token = await getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}${path}`, { ...init, headers });
      if (!res.ok) {
        let detail = '';
        try {
          const body = (await res.json()) as { message?: string | string[] };
          detail = Array.isArray(body.message) ? body.message.join('; ') : (body.message ?? '');
        } catch {
          /* ignore non-JSON */
        }
        throw new Error(detail ? `API ${res.status}: ${detail}` : `API ${res.status}: ${path}`);
      }
      return res.json() as Promise<T>;
    },
    [getToken, isSignedIn],
  );

  const syncUser = useCallback(async () => {
    if (!isSignedIn) return null;
    return authFetch<{ success: boolean; user: unknown }>('/auth/sync', { method: 'POST' });
  }, [authFetch, isSignedIn]);

  return { authFetch, syncUser, isSignedIn: !!isSignedIn, getToken };
}

type AuthFetchResult = {
  authFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
  syncUser: () => Promise<{ success: boolean; user: unknown } | null>;
  isSignedIn: boolean;
  getToken: () => Promise<string | null>;
};

/** Fetch autenticado contra la API con token Clerk */
export function useAuthFetch(): AuthFetchResult {
  if (!isClerkEnabled) {
    return useGuestAuthFetch();
  }
  return useClerkAuthFetch();
}
