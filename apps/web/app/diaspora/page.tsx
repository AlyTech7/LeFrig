'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@lefrig/ui/client';
import { AppIcon } from '@/components/AppIcon';
import type { CampSummary } from '@lefrig/shared';
import { localizedCampFromSummary } from '@lefrig/shared';
import { demoCamps, fetchWithMeta } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';

const STEP_KEYS = ['recipient', 'products', 'payment', 'confirmation'] as const;

const PRODUCT_OPTIONS = [
  { type: 'food_basket', icon: 'shopping-bag' as const },
  { type: 'school', icon: 'book-open' as const },
  { type: 'medicine', icon: 'package' as const },
  { type: 'solar', icon: 'zap' as const },
] as const;

export default function DiasporaPage() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthFetch();
  const [step, setStep] = useState(0);
  const [camps, setCamps] = useState<CampSummary[]>(demoCamps);
  const [selected, setSelected] = useState<string[]>(['food_basket']);
  const [submitting, setSubmitting] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ recipient: '', campId: '', message: '', amount: '5000' });

  useEffect(() => {
    fetchWithMeta<CampSummary[]>('/camps', demoCamps).then((res) => {
      const list = res.data.length ? res.data : demoCamps;
      setCamps(list);
      setForm((f) => ({ ...f, campId: f.campId || list[0]?.id || '' }));
    });
  }, []);

  const toggleProduct = (type: string) => {
    setSelected((prev) => (prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]));
  };

  const confirmOrder = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await authFetch('/diaspora/profile', {
        method: 'PUT',
        body: JSON.stringify({
          country: 'Diaspora',
          beneficiaryName: form.recipient,
          preferredCampId: form.campId,
        }),
      });
      const order = await authFetch<{ id: string }>('/diaspora/orders', {
        method: 'POST',
        body: JSON.stringify({
          orderType: selected.join(','),
          description: `${selected.map((item) => t(`diaspora.products.${item}`)).join(', ')}. ${form.message}`,
          budget: Number(form.amount) || undefined,
          campId: form.campId,
        }),
      });
      setOrderRef(order.id.slice(0, 8).toUpperCase());
      setStep(3);
    } catch {
      setError(t('diaspora.orderError'));
    } finally {
      setSubmitting(false);
    }
  };

  const campName = localizedCampFromSummary(camps.find((c) => c.id === form.campId) ?? {}, locale) || form.campId;

  return (
    <>
      <section className="lf-page-hero">
        <div className="lf-page-hero-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <AppIcon name="globe" size={36} color="var(--lf-gold)" />
            <div>
              <h1 className="lf-page-title" style={{ margin: 0 }}>{t('diaspora.title')}</h1>
              <p className="lf-page-sub" style={{ margin: '4px 0 0' }}>{t('diaspora.heroSub')}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="lf-page-body" style={{ maxWidth: 800 }}>
        {!isSignedIn && (
          <Card padding="md" style={{ marginBottom: 24 }}>
            <Link href="/sign-in" style={{ color: 'var(--lf-gold)', fontWeight: 700 }}>
              {t('diaspora.signInLink')}
            </Link>{' '}
            {t('diaspora.signInSuffix')}
          </Card>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {STEP_KEYS.map((key, i) => (
            <button
              key={key}
              type="button"
              onClick={() => i < step && setStep(i)}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: 'none',
                background: step === i ? 'var(--lf-emerald-deep)' : 'rgba(255,255,255,0.06)',
                color: step === i ? 'var(--lf-text)' : 'var(--lf-text-muted)',
                fontWeight: 600,
                cursor: i < step ? 'pointer' : 'default',
                fontSize: '0.85rem',
                borderWidth: step === i ? 0 : 1,
                borderStyle: 'solid',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              {i + 1}. {t(`diaspora.steps.${key}`)}
            </button>
          ))}
        </div>

        {step === 0 && (
          <Card padding="lg">
            <h2 style={{ marginTop: 0 }}>{t('diaspora.whoSend')}</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              <Input
                label={t('diaspora.recipientName')}
                value={form.recipient}
                onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                placeholder={t('diaspora.recipientPlaceholder')}
              />
              <label style={{ display: 'block' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--lf-text-muted)' }}>
                  {t('diaspora.destCamp')}
                </span>
                <select
                  value={form.campId}
                  onChange={(e) => setForm({ ...form, campId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.2)',
                    color: 'var(--lf-text)',
                    fontSize: '1rem',
                  }}
                >
                  {camps.map((c) => (
                    <option key={c.id} value={c.id}>
                      {localizedCampFromSummary(c, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <Button onClick={() => setStep(1)} disabled={!form.recipient || !form.campId}>
                {t('common.continue')}
              </Button>
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card padding="lg">
            <h2 style={{ marginTop: 0 }}>{t('diaspora.selectProducts')}</h2>
            <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
              {PRODUCT_OPTIONS.map((item) => (
                <label
                  key={item.type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 16,
                    borderRadius: 12,
                    background: selected.includes(item.type) ? 'rgba(52,211,153,0.1)' : 'rgba(0,0,0,0.15)',
                    cursor: 'pointer',
                    border: selected.includes(item.type) ? '1px solid var(--lf-emerald)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <AppIcon name={item.icon} size={20} color={selected.includes(item.type) ? 'var(--lf-emerald)' : 'var(--lf-text-muted)'} />
                  <input
                    type="checkbox"
                    checked={selected.includes(item.type)}
                    onChange={() => toggleProduct(item.type)}
                    style={{ accentColor: 'var(--lf-emerald-deep)' }}
                  />
                  <span style={{ fontWeight: 500 }}>{t(`diaspora.products.${item.type}`)}</span>
                </label>
              ))}
            </div>
            <Button onClick={() => setStep(2)} disabled={selected.length === 0}>
              {t('diaspora.continuePayment')}
            </Button>
          </Card>
        )}

        {step === 2 && (
          <Card padding="lg">
            <h2 style={{ marginTop: 0 }}>{t('diaspora.paymentTitle')}</h2>
            <Input
              label={t('diaspora.amountLabel')}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <Input
              label={t('diaspora.familyMessage')}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder={t('diaspora.messagePlaceholder')}
            />
            {error && <p style={{ color: '#f87171', fontSize: '0.9rem' }}>{error}</p>}
            <Button size="lg" fullWidth onClick={confirmOrder} disabled={submitting} style={{ marginTop: 16 }}>
              {submitting ? t('diaspora.confirming') : t('diaspora.confirmOrder')}
            </Button>
          </Card>
        )}

        {step === 3 && (
          <Card padding="lg" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <AppIcon name="shield" size={48} color="var(--lf-emerald)" />
            </div>
            <h2 style={{ color: 'var(--lf-emerald)' }}>{t('diaspora.registered')}</h2>
            <p style={{ color: 'var(--lf-text-muted)', lineHeight: 1.6 }}>
              {t('diaspora.registeredDesc', { recipient: form.recipient, camp: campName })}
            </p>
            <p style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, color: 'var(--lf-gold)' }}>
              {t('diaspora.refLabel', { ref: orderRef })}
            </p>
            <Link href="/orders" style={{ color: 'var(--lf-gold)', fontWeight: 600, display: 'inline-block', marginTop: 16 }}>
              {t('diaspora.viewOrders')}
            </Link>
          </Card>
        )}
      </div>
    </>
  );
}
