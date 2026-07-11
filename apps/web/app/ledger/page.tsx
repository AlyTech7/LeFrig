'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@lefrig/ui/client';
import { AppIcon } from '@/components/AppIcon';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useT } from '@/lib/locale';

type LedgerAccount = {
  id: string;
  balance: number | string;
  shop?: { name: string };
  creditor?: { displayName: string };
  entries?: { notes?: string; description?: string; amount: number | string; createdAt: string; type: string }[];
};

export default function LedgerPage() {
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthFetch();
  const t = useT();
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [selected, setSelected] = useState<LedgerAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    authFetch<LedgerAccount[]>('/ledger/accounts')
      .then(setAccounts)
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, [authFetch, isSignedIn, router]);

  const openAccount = async (acc: LedgerAccount) => {
    const detail = await authFetch<LedgerAccount>(`/ledger/accounts/${acc.id}`);
    setSelected(detail);
  };

  const pay = async () => {
    if (!selected || !amount) return;
    setPaying(true);
    setMessage('');
    try {
      await authFetch('/ledger/payments', {
        method: 'POST',
        body: JSON.stringify({
          accountId: selected.id,
          amount: Number(amount),
          method: 'cash',
          notes: t('ledger.payNote'),
        }),
      });
      setMessage(t('ledger.paySuccess'));
      setAmount('');
      const detail = await authFetch<LedgerAccount>(`/ledger/accounts/${selected.id}`);
      setSelected(detail);
      const list = await authFetch<LedgerAccount[]>('/ledger/accounts');
      setAccounts(list);
    } catch {
      setMessage(t('ledger.payError'));
    } finally {
      setPaying(false);
    }
  };

  const total = accounts.reduce((s, a) => s + Number(a.balance), 0);

  return (
    <>
      <section className="lf-page-hero">
        <div className="lf-page-hero-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <AppIcon name="book-open" size={36} color="var(--lf-gold)" />
            <div>
              <h1 className="lf-page-title" style={{ margin: 0 }}>{t('ledger.title')}</h1>
              <p className="lf-page-sub" style={{ margin: '4px 0 0' }}>
                {t('ledger.subtitle', { total: total.toLocaleString() })}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="lf-page-body" style={{ maxWidth: 800 }}>
        {loading ? (
          <p style={{ color: 'var(--lf-text-muted)' }}>{t('ledger.loadingAccounts')}</p>
        ) : accounts.length === 0 ? (
          <Card padding="lg">
            <p style={{ margin: 0, color: 'var(--lf-text-muted)' }}>
              {t('ledger.emptyAccounts')}
            </p>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {accounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => openAccount(acc)}
                style={{
                  textAlign: 'left',
                  padding: 18,
                  borderRadius: 16,
                  border: selected?.id === acc.id ? '2px solid var(--lf-gold)' : '1px solid rgba(255,255,255,0.06)',
                  background: 'var(--lf-surface)',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 800 }}>{acc.shop?.name ?? t('ledger.fiadoAccount')}</div>
                <div style={{ color: 'var(--lf-emerald)', fontWeight: 700, marginTop: 4 }}>
                  {Number(acc.balance).toLocaleString()} MRU
                </div>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <Card padding="lg" style={{ marginTop: 32 }}>
            <h2 style={{ marginTop: 0 }}>{selected.shop?.name ?? t('ledger.detail')}</h2>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--lf-emerald)', margin: '0 0 20px' }}>
              {t('ledger.pendingBalance', { amount: Number(selected.balance).toLocaleString() })}
            </p>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <Input label={t('ledger.cashPayment')} value={amount} onChange={(e) => setAmount(e.target.value)} type="number" />
              <div style={{ alignSelf: 'flex-end' }}>
                <Button onClick={pay} disabled={paying}>{paying ? t('ledger.registering') : t('ledger.registerPayment')}</Button>
              </div>
            </div>
            {message && <p style={{ color: message.includes(t('ledger.paySuccess').slice(0, 8)) ? 'var(--lf-emerald)' : '#f87171' }}>{message}</p>}

            <h3>{t('ledger.movements')}</h3>
            {(selected.entries ?? []).length === 0 ? (
              <p style={{ color: 'var(--lf-text-muted)' }}>{t('ledger.noMovements')}</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {(selected.entries ?? []).slice(0, 15).map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{m.notes ?? m.description ?? m.type}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--lf-text-muted)' }}>
                        {new Date(m.createdAt).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: m.type === 'payment' ? 'var(--lf-emerald)' : '#f87171' }}>
                      {m.type === 'payment' ? '+' : '-'}
                      {Number(m.amount).toLocaleString()} MRU
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        <p style={{ marginTop: 32, textAlign: 'center' }}>
          <Link href="/vouchers" style={{ color: 'var(--lf-gold)', fontWeight: 600 }}>
            {t('ledger.vouchersLink')}
          </Link>
        </p>
      </div>
    </>
  );
}
