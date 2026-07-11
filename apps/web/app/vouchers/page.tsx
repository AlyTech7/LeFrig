'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, VoucherCard } from '@lefrig/ui/client';
import { AppIcon } from '@/components/AppIcon';
import { fetchApi } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useT } from '@/lib/locale';

type Program = { id: string; name: string; description?: string };
type Voucher = {
  id: string;
  code: string;
  balance: number;
  currency: string;
  status: string;
  expiresAt: string;
};

export default function VouchersPage() {
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthFetch();
  const t = useT();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [myVouchers, setMyVouchers] = useState<Voucher[]>([]);
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('500');
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchApi<Program[]>('/vouchers/programs')
      .then(setPrograms)
      .catch(() => setPrograms([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    authFetch<Voucher[]>('/vouchers/my')
      .then(setMyVouchers)
      .catch(() => setMyVouchers([]));
  }, [authFetch, isSignedIn]);

  const redeem = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    setRedeeming(true);
    setMessage('');
    try {
      await authFetch('/vouchers/redeem', {
        method: 'POST',
        body: JSON.stringify({ code: code.trim().toUpperCase(), amount: Number(amount) }),
      });
      setMessage(t('vouchers.redeemSuccess'));
      const updated = await authFetch<Voucher[]>('/vouchers/my');
      setMyVouchers(updated);
    } catch {
      setMessage(t('vouchers.redeemFail'));
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <>
      <section className="lf-page-hero">
        <div className="lf-page-hero-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <AppIcon name="ticket" size={36} color="var(--lf-gold)" />
            <div>
              <h1 className="lf-page-title" style={{ margin: 0 }}>{t('vouchers.title')}</h1>
              <p className="lf-page-sub" style={{ margin: '4px 0 0' }}>
                {t('vouchers.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="lf-page-body" style={{ maxWidth: 800 }}>
        {!isSignedIn && (
          <Card padding="md" style={{ marginBottom: 24 }}>
            <Link href="/sign-in" style={{ color: 'var(--lf-gold)', fontWeight: 700 }}>{t('nav.signIn')}</Link> {t('vouchers.signInRedeem')}
          </Card>
        )}

        <Card padding="lg" style={{ marginBottom: 32 }}>
          <h2 style={{ marginTop: 0 }}>{t('vouchers.redeemCode')}</h2>
          <div style={{ display: 'grid', gap: 16 }}>
            <Input label={t('vouchers.voucherCode')} value={code} onChange={(e) => setCode(e.target.value)} placeholder="VOUCHER-XXXX" />
            <Input label={t('vouchers.amountLabel')} value={amount} onChange={(e) => setAmount(e.target.value)} type="number" />
            {message && (
              <p style={{ margin: 0, color: message === t('vouchers.redeemSuccess') ? 'var(--lf-emerald)' : '#f87171' }}>
                {message}
              </p>
            )}
            <Button onClick={redeem} disabled={redeeming || !code.trim()}>
              {redeeming ? t('vouchers.redeeming') : t('vouchers.redeem')}
            </Button>
          </div>
        </Card>

        <h2 style={{ fontSize: '1.25rem', marginBottom: 16 }}>{t('vouchers.activePrograms')}</h2>
        {loading ? (
          <p style={{ color: 'var(--lf-text-muted)' }}>{t('vouchers.loadingPrograms')}</p>
        ) : programs.length === 0 ? (
          <p style={{ color: 'var(--lf-text-muted)' }}>{t('vouchers.noPrograms')}</p>
        ) : (
          <div style={{ display: 'grid', gap: 12, marginBottom: 40 }}>
            {programs.map((p) => (
              <Card key={p.id} padding="md">
                <h3 style={{ margin: '0 0 8px' }}>{p.name}</h3>
                <p style={{ margin: 0, color: 'var(--lf-text-muted)' }}>{p.description ?? t('vouchers.defaultProgram')}</p>
              </Card>
            ))}
          </div>
        )}

        {isSignedIn && myVouchers.length > 0 && (
          <>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 16 }}>{t('vouchers.myVouchers')}</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              {myVouchers.map((v) => (
                <VoucherCard key={v.id} voucher={v} programName={t('vouchers.programName')} />
              ))}
            </div>
          </>
        )}

        <p style={{ marginTop: 32, textAlign: 'center' }}>
          <Link href="/ledger" style={{ color: 'var(--lf-gold)', fontWeight: 600 }}>
            {t('cash.fiadoLink')}
          </Link>
        </p>
      </div>
    </>
  );
}
