'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@lefrig/ui/client';
import { PageBody, PageHero } from '@/components/PageHero';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useT } from '@/lib/locale';

type CashAgreement = {
  id: string;
  operationCode: string;
  amount: number | string;
  status: string;
  method: string;
  pin?: string;
  createdAt: string;
  listing?: { title: string };
};

type LookupResult = {
  operationCode: string;
  amount: number | string;
  status: string;
  hasPin: boolean;
  buyer?: { displayName: string };
  seller?: { displayName: string };
  listing?: { title: string };
};

export default function CashPage() {
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthFetch();
  const t = useT();
  const [agreements, setAgreements] = useState<CashAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupCode, setLookupCode] = useState('');
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [pin, setPin] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  const [newAgreement, setNewAgreement] = useState<CashAgreement | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    authFetch<CashAgreement[]>('/cash/my')
      .then(setAgreements)
      .catch(() => setAgreements([]))
      .finally(() => setLoading(false));

    const raw = sessionStorage.getItem('lefrig_new_cash');
    if (raw) {
      try {
        setNewAgreement(JSON.parse(raw) as CashAgreement);
      } catch {
        /* ignore */
      }
      sessionStorage.removeItem('lefrig_new_cash');
    }
  }, [authFetch, isSignedIn, router]);

  const loadLookup = async (code: string) => {
    setLookupCode(code);
    setMessage('');
    try {
      const res = await authFetch<LookupResult>(`/cash/${code.trim().toUpperCase()}`);
      setLookup(res);
    } catch {
      setLookup(null);
      setMessage(t('cash.notFound'));
    }
  };

  const searchCode = async () => {
    if (!lookupCode.trim()) return;
    await loadLookup(lookupCode);
  };

  const confirmPin = async () => {
    if (!lookup) return;
    setConfirming(true);
    setMessage('');
    try {
      await authFetch('/cash/confirm', {
        method: 'POST',
        body: JSON.stringify({ operationCode: lookup.operationCode, pin }),
      });
      setMessage(t('cash.pinOk'));
      setPin('');
      const updated = await authFetch<CashAgreement[]>('/cash/my');
      setAgreements(updated);
      const refreshed = await authFetch<LookupResult>(`/cash/${lookup.operationCode}`);
      setLookup(refreshed);
    } catch {
      setMessage(t('cash.pinFail'));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <PageHero
        icon="dollar-sign"
        title={t('cash.title')}
        subtitle={t('cash.subtitle')}
      />
      <PageBody maxWidth={800}>
        {newAgreement && (
          <Card padding="lg" style={{ marginBottom: 24, border: '1px solid rgba(232,184,109,0.35)' }}>
            <h2 style={{ marginTop: 0, color: 'var(--lf-gold)' }}>{t('cash.agreementCreated')}</h2>
            <p style={{ margin: '0 0 8px' }}>
              {t('cash.codeLabel')} <strong style={{ fontFamily: 'monospace' }}>{newAgreement.operationCode}</strong>
            </p>
            <p style={{ margin: '0 0 8px' }}>
              {t('cash.pinShare')}{' '}
              <strong style={{ fontSize: '1.25rem', color: 'var(--lf-emerald)' }}>{newAgreement.pin}</strong>
            </p>
            <p style={{ margin: 0, color: 'var(--lf-text-muted)', fontSize: '0.9rem' }}>
              {t('cash.bothConfirm')}
            </p>
          </Card>
        )}

        <Card padding="lg" style={{ marginBottom: 24 }}>
          <h2 style={{ marginTop: 0 }}>{t('cash.searchOp')}</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <Input
              label={t('cash.codePlaceholder')}
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
              placeholder="CASH-A1B2C3D4"
            />
            <div style={{ alignSelf: 'flex-end' }}>
              <Button onClick={searchCode}>{t('common.search')}</Button>
            </div>
          </div>
          {lookup && (
            <div style={{ padding: 16, borderRadius: 12, background: 'rgba(0,0,0,0.15)' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{lookup.listing?.title ?? lookup.operationCode}</p>
              <p style={{ margin: '0 0 4px', color: 'var(--lf-text-muted)' }}>
                {lookup.buyer?.displayName} ↔ {lookup.seller?.displayName}
              </p>
              <p style={{ margin: '0 0 12px', color: 'var(--lf-emerald)', fontWeight: 800 }}>
                {Number(lookup.amount).toLocaleString()} MRU · {lookup.status}
              </p>
              {lookup.status !== 'confirmed' && lookup.hasPin && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <Input label={t('cash.pinPlaceholder')} value={pin} onChange={(e) => setPin(e.target.value)} maxLength={4} />
                  <Button onClick={confirmPin} disabled={confirming || pin.length < 4}>
                    {confirming ? t('cash.confirming') : t('cash.confirmDelivery')}
                  </Button>
                </div>
              )}
            </div>
          )}
          {message && (
            <p style={{ marginTop: 12, color: message.includes('correctamente') ? 'var(--lf-emerald)' : '#f87171' }}>
              {message}
            </p>
          )}
        </Card>

        <h2 style={{ fontSize: '1.25rem', marginBottom: 16 }}>{t('cash.myOps')}</h2>
        {loading ? (
          <p style={{ color: 'var(--lf-text-muted)' }}>{t('common.loading')}</p>
        ) : agreements.length === 0 ? (
          <Card padding="lg">
            <p style={{ margin: 0, color: 'var(--lf-text-muted)' }}>
              {t('cash.emptyOps')}
            </p>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {agreements.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => loadLookup(a.operationCode)}
                style={{
                  textAlign: 'left',
                  padding: 18,
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'var(--lf-surface)',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--lf-gold)' }}>{a.operationCode}</div>
                <div style={{ marginTop: 4 }}>{a.listing?.title ?? t('cash.cashOp')}</div>
                <div style={{ color: 'var(--lf-emerald)', fontWeight: 700, marginTop: 6 }}>
                  {Number(a.amount).toLocaleString()} MRU · {a.status}
                </div>
              </button>
            ))}
          </div>
        )}

      </PageBody>
    </>
  );
}
