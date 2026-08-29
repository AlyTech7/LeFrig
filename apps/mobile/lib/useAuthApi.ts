import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useRef } from 'react';
import { API_URL } from './api';
import { getLegacyAccessToken } from './legacySession';
import { useIsAuthed } from './useIsAuthed';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function useAuthApi() {
  const { getToken, isSignedIn: clerkSignedIn, isLoaded, userId } = useAuth();
  const { isAuthed, refresh: refreshAuth } = useIsAuthed();
  const getTokenRef = useRef(getToken);
  const clerkSignedInRef = useRef(clerkSignedIn);
  getTokenRef.current = getToken;
  clerkSignedInRef.current = clerkSignedIn;

  const authFetch = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string>),
    };
    const clerkToken = clerkSignedInRef.current ? await getTokenRef.current() : null;
    const legacyToken = clerkToken ? null : await getLegacyAccessToken();
    const token = clerkToken ?? legacyToken;
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, { ...init, headers });
    if (!res.ok) {
      let message = `API ${res.status}`;
      try {
        const body = (await res.json()) as { message?: string | string[] };
        if (typeof body?.message === 'string' && body.message.trim()) {
          message = body.message.trim();
        } else if (Array.isArray(body?.message) && body.message.length > 0) {
          message = body.message.map(String).join('. ');
        }
      } catch {
        /* ignore parse errors */
      }
      throw new ApiError(message, res.status);
    }
    return res.json() as Promise<T>;
  }, []);

  const syncUser = useCallback(async () => {
    const legacyToken = await getLegacyAccessToken();
    if (!clerkSignedInRef.current && !legacyToken) return null;
    try {
      return await authFetch<{ success: boolean; user: unknown }>('/auth/sync', { method: 'POST' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  }, [authFetch]);

  const getAccessToken = useCallback(async () => {
    const clerkToken = clerkSignedInRef.current ? await getTokenRef.current() : null;
    if (clerkToken) return clerkToken;
    return getLegacyAccessToken();
  }, []);

  return {
    authFetch,
    syncUser,
    /** Clerk O sesión legacy */
    isSignedIn: isAuthed,
    isClerkSignedIn: Boolean(clerkSignedIn),
    isLoaded,
    getAccessToken,
    userId,
    refreshAuth,
  };
}
