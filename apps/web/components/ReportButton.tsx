'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useT } from '@/lib/locale';

const REASON_KEYS = [
  { value: 'scam', labelKey: 'report.scam' },
  { value: 'inappropriate', labelKey: 'report.inappropriate' },
  { value: 'offensive', labelKey: 'report.offensive' },
  { value: 'spam', labelKey: 'report.spam' },
  { value: 'other', labelKey: 'report.other' },
] as const;

type ReportReason = (typeof REASON_KEYS)[number]['value'];

type Props = {
  targetType: 'listing' | 'user' | 'community_post' | 'shop' | 'service';
  targetId: string;
  targetUserId?: string;
  label?: string;
  compact?: boolean;
};

export function ReportButton({ targetType, targetId, targetUserId, label, compact }: Props) {
  const t = useT();
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthFetch();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>(REASON_KEYS[0]!.value);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const buttonLabel = label ?? t('report.defaultLabel');

  const submit = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    setSending(true);
    try {
      await authFetch('/auth/sync', { method: 'POST' });
      await authFetch('/moderation/reports', {
        method: 'POST',
        body: JSON.stringify({
          targetType,
          targetId,
          targetUserId,
          reason,
          details: details.trim() || undefined,
        }),
      });
      setSent(true);
      setOpen(false);
    } catch {
      alert(t('report.error'));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <span style={{ fontSize: '0.82rem', color: 'var(--lf-oasis, #2d8a62)', fontWeight: 600 }}>
        ✓ {t('report.sent')}
      </span>
    );
  }

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(26,22,18,0.5)',
          fontSize: compact ? '0.78rem' : '0.85rem',
          cursor: 'pointer',
          padding: compact ? '2px 4px' : '6px 8px',
          textDecoration: 'underline',
          textUnderlineOffset: 3,
        }}
      >
        ⚑ {buttonLabel}
      </button>

      {open ? (
        <div
          style={{
            position: 'absolute',
            zIndex: 50,
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 280,
            background: '#fff',
            border: '1px solid rgba(26,22,18,0.12)',
            borderRadius: 14,
            padding: 16,
            boxShadow: '0 16px 40px rgba(26,22,18,0.18)',
            textAlign: 'left',
          }}
        >
          <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: '0.9rem', color: '#1a1612' }}>
            {t('report.why')}
          </p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid rgba(26,22,18,0.15)',
              fontSize: '0.85rem',
              marginBottom: 10,
              background: '#faf8f4',
              color: '#1a1612',
            }}
          >
            {REASON_KEYS.map((r) => (
              <option key={r.value} value={r.value}>
                {t(r.labelKey)}
              </option>
            ))}
          </select>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={t('report.detailsPlaceholder')}
            rows={2}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid rgba(26,22,18,0.15)',
              fontSize: '0.85rem',
              marginBottom: 12,
              resize: 'vertical',
              background: '#faf8f4',
              color: '#1a1612',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={submit}
              disabled={sending}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 10,
                border: 'none',
                background: '#c45c3a',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: sending ? 'wait' : 'pointer',
                opacity: sending ? 0.7 : 1,
              }}
            >
              {sending ? t('report.sending') : t('report.submit')}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                padding: '9px 12px',
                borderRadius: 10,
                border: '1px solid rgba(26,22,18,0.15)',
                background: 'transparent',
                color: 'rgba(26,22,18,0.6)',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      ) : null}
    </span>
  );
}
