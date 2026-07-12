'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';

type TrustData = {
  reputationScore: number;
  badges: { badge: string }[];
};

export function SellerTrustBadge({ userId, compact }: { userId?: string; compact?: boolean }) {
  const [data, setData] = useState<TrustData | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_URL}/reviews/trust/${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, [userId]);

  if (!data) return null;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: compact ? '0.8rem' : '0.875rem',
        fontWeight: 700,
        color: 'var(--lf-emerald, #0d9488)',
        background: 'rgba(13,148,136,0.1)',
        padding: compact ? '4px 8px' : '6px 10px',
        borderRadius: 999,
      }}
    >
      ★ {Math.round(data.reputationScore)}/100
      {data.badges.length > 0 ? ` · ${data.badges.length} badge${data.badges.length > 1 ? 's' : ''}` : ''}
    </span>
  );
}
