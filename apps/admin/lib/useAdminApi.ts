'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';
import { API_URL } from './api';

export function useAdminApi() {
  const { getToken, isSignedIn } = useAuth();

  const request = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(init?.headers as Record<string, string>),
      };

      if (isSignedIn) {
        const token = await getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
      if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
      return res.json() as Promise<T>;
    },
    [getToken, isSignedIn],
  );

  return { request, isSignedIn };
}
