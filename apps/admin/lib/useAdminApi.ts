'use client';

import { useCallback } from 'react';

/** Llama al proxy interno; el token Clerk se añade en servidor (sin clerk-js en el navegador). */
export function useAdminApi() {
  const request = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    const res = await fetch(`/api/admin${normalized}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers as Record<string, string>),
      },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
    return res.json() as Promise<T>;
  }, []);

  return { request };
}
