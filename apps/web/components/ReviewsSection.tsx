'use client';

import { useEffect, useState } from 'react';
import { Card, Input, Button } from '@lefrig/ui/client';
import { fetchApi } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useT } from '@/lib/locale';

type Review = {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  author?: { displayName: string };
};

type Props = {
  targetType: 'user' | 'shop' | 'driver' | 'service';
  targetId: string;
  title?: string;
};

export function ReviewsSection({ targetType, targetId, title }: Props) {
  const t = useT();
  const { authFetch, isSignedIn } = useAuthFetch();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const sectionTitle = title ?? t('reviews.title');

  useEffect(() => {
    if (!targetId) return;
    fetchApi<Review[]>(`/reviews?targetType=${targetType}&targetId=${targetId}`)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [targetType, targetId]);

  const submit = async () => {
    if (!isSignedIn) {
      setMessage(t('reviews.signInToRate'));
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      await authFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          targetType,
          targetId,
          rating: Number(rating),
          comment: comment.trim() || undefined,
        }),
      });
      setComment('');
      const updated = await fetchApi<Review[]>(`/reviews?targetType=${targetType}&targetId=${targetId}`);
      setReviews(updated);
      setMessage(t('reviews.published'));
    } catch {
      setMessage(t('reviews.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const avg =
    reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  const messageColor =
    message === t('reviews.published') ? 'var(--lf-emerald)' : message ? '#f87171' : undefined;

  return (
    <Card padding="lg" style={{ marginTop: 32 }}>
      <h2 style={{ marginTop: 0 }}>
        {sectionTitle}
        {avg ? <span style={{ color: 'var(--lf-gold)', marginLeft: 8 }}>{avg} ★</span> : null}
      </h2>

      {reviews.length === 0 ? (
        <p style={{ color: 'var(--lf-text-muted)', marginBottom: 16 }}>{t('reviews.noReviews')}</p>
      ) : (
        <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
          {reviews.slice(0, 8).map((r) => (
            <div key={r.id} style={{ paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontWeight: 700 }}>
                {'★'.repeat(r.rating)}
                <span style={{ color: 'var(--lf-text-muted)', fontWeight: 500, marginLeft: 8, fontSize: '0.85rem' }}>
                  {r.author?.displayName ?? t('reviews.user')}
                </span>
              </div>
              {r.comment && <p style={{ margin: '6px 0 0', color: 'var(--lf-text-muted)' }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>
          {t('reviews.yourRating')}
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 8,
              padding: 12,
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
              color: 'inherit',
            }}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {t('reviews.stars', { count: n })}
              </option>
            ))}
          </select>
        </label>
        <Input
          label={t('reviews.commentLabel')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        {message && <p style={{ margin: 0, color: messageColor }}>{message}</p>}
        <Button onClick={submit} disabled={submitting}>
          {submitting ? t('reviews.sending') : t('reviews.submit')}
        </Button>
      </div>
    </Card>
  );
}
