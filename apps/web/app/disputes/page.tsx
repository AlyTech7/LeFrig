'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@lefrig/ui/client';
import { PageBody, PageHero } from '@/components/PageHero';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';

type DisputeEvidence = { id: string; type: string; content?: string; url?: string; createdAt: string };
type Dispute = {
  id: string;
  reason: string;
  description: string;
  status: string;
  resolution?: string;
  createdAt: string;
  evidence: DisputeEvidence[];
};

const DATE_LOCALE = { es: 'es-ES', ar: 'ar-MA', en: 'en-GB', fr: 'fr-FR' } as const;

export default function DisputesPage() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthFetch();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const reasonLabel = (reason: string) => {
    const key = `disputes.reasons.${reason}` as 'disputes.reasons.other';
    const label = t(key);
    return label === key ? reason : label;
  };

  const statusLabel = (status: string) => {
    const key = `disputes.status.${status}` as 'disputes.status.open';
    const label = t(key);
    return label === key ? status : label;
  };

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    authFetch<Dispute[]>('/disputes')
      .then(setDisputes)
      .catch(() => setDisputes([]))
      .finally(() => setLoading(false));
  }, [authFetch, isSignedIn, router]);

  const addEvidence = async (disputeId: string) => {
    if (note.trim().length < 5) return;
    setSaving(true);
    try {
      await authFetch(`/disputes/${disputeId}/evidence`, {
        method: 'POST',
        body: JSON.stringify({ type: 'note', content: note.trim() }),
      });
      const updated = await authFetch<Dispute>(`/disputes/${disputeId}`);
      setDisputes((prev) => prev.map((d) => (d.id === disputeId ? updated : d)));
      setNote('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHero
        icon="shield"
        title={t('disputes.title')}
        subtitle={t('disputes.sub')}
        action={
          <Link href="/orders" style={{ color: 'var(--lf-gold)', fontWeight: 600, textDecoration: 'none' }}>
            {t('disputes.fromOrder')}
          </Link>
        }
      />
      <PageBody maxWidth={800}>
        {loading ? (
          <p style={{ color: 'var(--lf-text-muted)' }}>{t('disputes.loading')}</p>
        ) : disputes.length === 0 ? (
          <Card padding="lg">
            <p style={{ margin: 0, color: 'var(--lf-text-muted)' }}>
              {t('disputes.emptyPrefix')}{' '}
              <Link href="/orders" style={{ color: 'var(--lf-gold)', fontWeight: 600 }}>
                {t('disputes.myOrders')}
              </Link>
              .
            </p>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {disputes.map((d) => (
              <Card key={d.id} padding="lg">
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{reasonLabel(d.reason)}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--lf-text-muted)', marginTop: 4 }}>
                        {new Date(d.createdAt).toLocaleDateString(DATE_LOCALE[locale])} · REF{' '}
                        {d.id.slice(0, 8).toUpperCase()}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 8,
                        background: 'rgba(232,184,109,0.12)',
                        color: 'var(--lf-gold)',
                      }}
                    >
                      {statusLabel(d.status)}
                    </span>
                  </div>
                  <p style={{ margin: '12px 0 0', color: 'var(--lf-text-muted)', fontSize: '0.9rem' }}>{d.description}</p>
                </button>

                {expanded === d.id && (
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    {d.resolution && (
                      <p style={{ margin: '0 0 16px', color: 'var(--lf-emerald)' }}>
                        <strong>{t('disputes.resolution')}</strong> {d.resolution}
                      </p>
                    )}
                    {(d.evidence ?? []).length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem' }}>{t('disputes.evidence')}</h4>
                        {d.evidence.map((ev) => (
                          <div
                            key={ev.id}
                            style={{
                              padding: 10,
                              marginBottom: 8,
                              borderRadius: 8,
                              background: 'rgba(255,255,255,0.03)',
                              fontSize: '0.85rem',
                            }}
                          >
                            {ev.content ?? ev.url ?? ev.type}
                          </div>
                        ))}
                      </div>
                    )}
                    {d.status !== 'resolved' && d.status !== 'closed' && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <input
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder={t('disputes.addNotePlaceholder')}
                          style={{
                            flex: 1,
                            minWidth: 200,
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'var(--lf-surface)',
                            color: 'inherit',
                          }}
                        />
                        <Button variant="secondary" onClick={() => addEvidence(d.id)} disabled={saving || note.trim().length < 5}>
                          {saving ? t('disputes.saving') : t('disputes.addNote')}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}
