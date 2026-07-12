'use client';

import { useState } from 'react';
import { colors } from '@lefrig/ui/client';
import { resolveImageUrls } from '@lefrig/shared';
import { API_URL } from '@/lib/api';
import { AppImage } from '@/lib/images';

type Props = {
  images: string[] | null | undefined;
  fallbackIcon?: string;
  height?: number;
};

export function ListingGallery({ images, fallbackIcon = '📦', height = 320 }: Props) {
  const resolved = resolveImageUrls(images, API_URL);
  const [active, setActive] = useState(0);

  if (!resolved.length) {
    return (
      <div
        style={{
          height,
          borderRadius: 20,
          background: `linear-gradient(135deg, ${colors.sand[200]}, ${colors.sand[400]})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '5rem',
        }}
      >
        {fallbackIcon}
      </div>
    );
  }

  const current = resolved[active] ?? resolved[0]!;

  return (
    <div>
      <div
        style={{
          height,
          borderRadius: 20,
          overflow: 'hidden',
          background: colors.sand[200],
          position: 'relative',
        }}
      >
        <AppImage
          src={current}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="eager"
          fallback={
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem',
              }}
            >
              {fallbackIcon}
            </div>
          }
        />
      </div>

      {resolved.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 12,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          {resolved.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Foto ${index + 1}`}
              style={{
                flex: '0 0 auto',
                width: 72,
                height: 72,
                borderRadius: 12,
                overflow: 'hidden',
                border: index === active ? `2px solid ${colors.deepGreen[600]}` : `1px solid ${colors.sand[300]}`,
                padding: 0,
                cursor: 'pointer',
                background: colors.sand[100],
              }}
            >
              <AppImage
                src={url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
