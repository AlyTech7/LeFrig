'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Input } from '@lefrig/ui/client';
import { PageBody, PageHero } from '@/components/PageHero';
import { useAuthFetch } from '@/lib/auth-fetch';
import { takePendingCashAgreement, type PendingCashAgreement } from '@/lib/cash-pending';
import { useT } from '@/lib/locale';

type CashRole = 'buyer' | 'seller' | null;

type CashAgreement = {
  id: string;
  operationCode: string;
  amount: number | string;
  currency?: string;
  status: string;
  method: string;
  pin?: string;
  createdAt: string;
  listing?: { title: string };
  hasReceipt?: boolean;
  confirmationCount?: number;
  myConfirmed?: boolean;
  role?: CashRole;
  canConfirm?: boolean;
};

type LookupResult = {
  operationCode: string;
  amount: number | string;
  currency?: string;
  status: string;
  hasPin: boolean;
  pin?: string;
  role?: CashRole;
  myConfirmed?: boolean;
  canConfirm?: boolean;
  confirmationCount?: number;
  buyer?: { displayName: string };
  seller?: { displayName: string };
  listing?: { title: string };
  receipt?: { id: string } | null;
};

function formatAmount(amount: number | string, currency?: string) {
  const n = Number(amount);
  const cur = currency || 'EUR';
  return `${Number.isFinite(n) ? n.toLocaleString() : amount} ${cur}`;
}

export default function CashPage() {
  const { authFetch, isSignedIn, isLoaded } = useAuthFetch();
  const t = useT();
  const [agreements, setAgreements] = useState<CashAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupCode, setLookupCode] = useState('');
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [pin, setPin] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  const [messageOk, setMessageOk] = useState(false);
  const [newAgreement, setNewAgreement] = useState<PendingCashAgreement | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    const pending = takePendingCashAgreement();
    if (pending?.operationCode) {
      setNewAgreement(pending);
      setLookupCode(pending.operationCode);
      void authFetch<LookupResult>(`/cash/${pending.operationCode}`)
        .then(setLookup)
        .catch(() => {
          /* banner still shows code */
        });
    }

    authFetch<CashAgreement[]>('/cash/my')
      .then(setAgreements)
      .catch(() => setAgreements([]))
      .finally(() => setLoading(false));
  }, [authFetch, isLoaded, isSignedIn]);

  const loadLookup = async (code: string) => {
    const normalized = code.trim().toUpperCase();
    setLookupCode(normalized);
    setMessage('');
    setPin('');
    try {
      const res = await authFetch<LookupResult>(`/cash/${normalized}`);
      setLookup(res);
    } catch {
      setLookup(null);
      setMessageOk(false);
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
      const res = await authFetch<{ fullyConfirmed?: boolean }>('/cash/confirm', {
        method: 'POST',
        body: JSON.stringify({ operationCode: lookup.operationCode, pin }),
      });
      setMessageOk(true);
      setMessage(res.fullyConfirmed ? t('cash.fullyConfirmed') : t('cash.pinOk'));
      setPin('');
      const updated = await authFetch<CashAgreement[]>('/cash/my');
      setAgreements(updated);
      const refreshed = await authFetch<LookupResult>(`/cash/${lookup.operationCode}`);
      setLookup(refreshed);
      if (res.fullyConfirmed) setNewAgreement(null);
    } catch {
      setMessageOk(false);
      setMessage(t('cash.pinFail'));
    } finally {
      setConfirming(false);
    }
  };

  const shareReceipt = async (code: string) => {
    try {
      const receipt = await authFetch<{ shareText: string }>(`/cash/receipt/${code}`);
      await navigator.clipboard.writeText(receipt.shareText);
      setMessageOk(true);
      setMessage(t('cash.receiptCopied'));
    } catch {
      setMessageOk(false);
      setMessage(t('cash.notFound'));
    }
  };

  const copyText = async (value: string, okMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMessageOk(true);
      setMessage(okMessage);
    } catch {
      setMessageOk(false);
      setMessage(t('common.error'));
    }
  };

  const roleLabel = (role?: CashRole) => {
    if (role === 'buyer') return t('cash.yourRoleBuyer');
    if (role === 'seller') return t('cash.yourRoleSeller');
    return null;
  };

  return (
    <>
      <PageHero icon="dollar-sign" title={t('cash.title')} subtitle={t('cash.subtitle')} />
      <PageBody maxWidth={800}>
        {!isLoaded ? (
          <p style={{ color: 'var(--lf-text-muted)' }}>{t('common.loading')}</p>
        ) : !isSignedIn ? (
          <Card padding="lg">
            <p style={{ margin: 0 }}>
              <Link href="/sign-in?redirect_url=/cash" style={{ color: 'var(--lf-gold)', fontWeight: 600 }}>
                {t('nav.signIn')}
              </Link>
            </p>
          </Card>
        ) : (
          <>
            {newAgreement && (
              <Card padding="lg" style={{ marginBottom: 24, border: '1px solid rgba(232,184,109,0.35)' }}>
                <h2 style={{ marginTop: 0, color: 'var(--lf-gold)' }}>{t('cash.agreementCreated')}</h2>
                <p style={{ margin: '0 0 4px', color: 'var(--lf-text-muted)', fontSize: '0.9rem' }}>
                  {t('cash.yourRoleBuyer')}
                </p>
                <p style={{ margin: '0 0 8px', fontSize: '0.95rem' }}>{t('cash.buyerCreatedHint')}</p>
                <p
                  style={{
                    margin: '12px 0',
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    color: 'var(--lf-emerald)',
                  }}
                >
                  {newAgreement.operationCode}
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                  <Button
                    variant="secondary"
                    onClick={() => copyText(newAgreement.operationCode, t('cash.codeCopied'))}
                  >
                    {t('cash.copyCode')}
                  </Button>
                </div>
                <p style={{ margin: 0, color: 'var(--lf-text-muted)', fontSize: '0.9rem' }}>
                  {t('cash.shareCodeHint')}
                </p>
                <p style={{ margin: '8px 0 0', color: 'var(--lf-text-muted)', fontSize: '0.9rem' }}>
                  {t('cash.buyerPinHint')}
                </p>
              </Card>
            )}

            <Card padding="lg" style={{ marginBottom: 24 }}>
              <h2 style={{ marginTop: 0 }}>{t('cash.searchOp')}</h2>
              <p style={{ margin: '0 0 12px', color: 'var(--lf-text-muted)', fontSize: '0.9rem' }}>
                {t('cash.buyerPinHint')}
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <Input
                  label={t('cash.codePlaceholder')}
                  value={lookupCode}
                  onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                  placeholder="CASH-A1B2C3D4"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void searchCode();
                  }}
                />
                <div style={{ alignSelf: 'flex-end' }}>
                  <Button onClick={searchCode}>{t('common.search')}</Button>
                </div>
              </div>

              {lookup && (
                <div
                  style={{
                    padding: 18,
                    borderRadius: 14,
                    background: 'rgba(0,0,0,0.12)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '1.05rem' }}>
                        {lookup.listing?.title ?? lookup.operationCode}
                      </p>
                      <p style={{ margin: '0 0 4px', color: 'var(--lf-text-muted)', fontSize: '0.9rem' }}>
                        {lookup.buyer?.displayName} ↔ {lookup.seller?.displayName}
                      </p>
                      <p style={{ margin: '0 0 8px', color: 'var(--lf-emerald)', fontWeight: 800 }}>
                        {formatAmount(lookup.amount, lookup.currency)} · {lookup.status}
                      </p>
                    </div>
                    {roleLabel(lookup.role) && (
                      <span
                        style={{
                          alignSelf: 'flex-start',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '6px 10px',
                          borderRadius: 999,
                          background:
                            lookup.role === 'seller'
                              ? 'rgba(232,184,109,0.2)'
                              : 'rgba(13,148,136,0.18)',
                          color: 'var(--lf-gold-bright, #e8b86d)',
                        }}
                      >
                        {roleLabel(lookup.role)}
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--lf-text-muted)' }}>
                    {t('cash.confirmationsProgress', {
                      count: String(lookup.confirmationCount ?? 0),
                    })}
                    {lookup.myConfirmed ? ` · ${t('cash.alreadyConfirmed')}` : ''}
                  </p>

                  {lookup.role === 'seller' && lookup.pin && lookup.status === 'agreed' && (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: 16,
                        borderRadius: 12,
                        background: 'rgba(232,184,109,0.12)',
                        border: '1px solid rgba(232,184,109,0.35)',
                      }}
                    >
                      <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{t('cash.pinShare')}</p>
                      <p
                        style={{
                          margin: '8px 0',
                          fontSize: '2rem',
                          fontWeight: 800,
                          letterSpacing: '0.35em',
                          color: 'var(--lf-emerald)',
                          fontFamily: 'ui-monospace, monospace',
                        }}
                      >
                        {lookup.pin}
                      </p>
                      <p style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--lf-text-muted)' }}>
                        {t('cash.sellerPinHint')}
                      </p>
                      <Button variant="secondary" onClick={() => copyText(lookup.pin!, t('cash.pinCopied'))}>
                        {t('cash.copyPin')}
                      </Button>
                    </div>
                  )}

                  {lookup.status === 'confirmed' && lookup.receipt && (
                    <Button variant="secondary" onClick={() => shareReceipt(lookup.operationCode)}>
                      {t('cash.shareReceipt')}
                    </Button>
                  )}

                  {lookup.canConfirm && (
                    <div style={{ marginTop: lookup.pin ? 4 : 0 }}>
                      <p style={{ margin: '0 0 10px', fontSize: '0.9rem' }}>{t('cash.enterPinToConfirm')}</p>
                      {lookup.role === 'buyer' && (
                        <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--lf-text-muted)' }}>
                          {t('cash.buyerPinHint')}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <Input
                          label={t('cash.pinPlaceholder')}
                          value={pin}
                          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          maxLength={4}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                        />
                        <Button onClick={confirmPin} disabled={confirming || pin.length < 4}>
                          {confirming ? t('cash.confirming') : t('cash.confirmDelivery')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {lookup.myConfirmed && lookup.status !== 'confirmed' && (
                    <p style={{ margin: '12px 0 0', color: 'var(--lf-gold)', fontWeight: 600 }}>
                      {t('cash.waitingOther')}
                    </p>
                  )}
                </div>
              )}

              {message && (
                <p
                  style={{
                    marginTop: 12,
                    color: messageOk ? 'var(--lf-emerald)' : '#f87171',
                    fontWeight: 600,
                  }}
                >
                  {message}
                </p>
              )}
            </Card>

            <h2 style={{ fontSize: '1.25rem', marginBottom: 16 }}>{t('cash.myOps')}</h2>
            {loading ? (
              <p style={{ color: 'var(--lf-text-muted)' }}>{t('common.loading')}</p>
            ) : agreements.length === 0 ? (
              <Card padding="lg">
                <p style={{ margin: 0, color: 'var(--lf-text-muted)' }}>{t('cash.emptyOps')}</p>
              </Card>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {agreements.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: 18,
                      borderRadius: 16,
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'var(--lf-surface)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => loadLookup(a.operationCode)}
                      style={{
                        textAlign: 'left',
                        border: 'none',
                        background: 'transparent',
                        color: 'inherit',
                        cursor: 'pointer',
                        width: '100%',
                        padding: 0,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--lf-gold)' }}>
                          {a.operationCode}
                        </div>
                        {roleLabel(a.role ?? null) && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--lf-text-muted)' }}>
                            {roleLabel(a.role ?? null)}
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: 4 }}>{a.listing?.title ?? t('cash.cashOp')}</div>
                      <div style={{ color: 'var(--lf-emerald)', fontWeight: 700, marginTop: 6 }}>
                        {formatAmount(a.amount, a.currency)} · {a.status}
                      </div>
                      <div style={{ marginTop: 6, fontSize: '0.85rem', color: 'var(--lf-text-muted)' }}>
                        {t('cash.confirmationsProgress', {
                          count: String(a.confirmationCount ?? 0),
                        })}
                        {a.pin ? ` · PIN ${a.pin}` : ''}
                        {a.myConfirmed && a.status !== 'confirmed' ? ` · ${t('cash.waitingOther')}` : ''}
                      </div>
                    </button>
                    {a.status === 'confirmed' && a.hasReceipt ? (
                      <Button
                        variant="secondary"
                        style={{ marginTop: 10 }}
                        onClick={() => shareReceipt(a.operationCode)}
                      >
                        {t('cash.shareReceipt')}
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </PageBody>
    </>
  );
}
