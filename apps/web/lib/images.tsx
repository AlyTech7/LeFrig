'use client';

import { useState } from 'react';
import { resolveImageUrl } from '@lefrig/shared';
import { API_URL } from './api';

type Props = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  fallback?: React.ReactNode;
};

export function AppImage({ src, alt, className, style, loading = 'lazy', fallback = null }: Props) {
  const resolved = resolveImageUrl(src, API_URL);
  const [failed, setFailed] = useState(false);

  if (!resolved || failed) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export { resolveImageUrl, resolveImageUrls } from '@lefrig/shared';
