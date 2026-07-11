'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Badge, Button, Card } from '@lefrig/ui/client';
import { AppIcon } from '@/components/AppIcon';
import { fetchWithFallback, mapApiNeed, type NeedItem } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useT } from '@/lib/locale';

type NeedOffer = {
  id: string;
  message: string;
  priceEstimate?: number | null;
  offerer: { displayName: string };
};

export default function NeedDetailPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthFetch();
  const [need, setNeed] = useState<(NeedItem & { offers?: NeedOffer[] }) | null>(null);
  const [offering, setOffering] = useState(false);

  const typeLabel = (type: string) => {
    const key = `needs.types.${type}` as 'needs.types.product';
    const label = t(key);
    return label === key ? type : label;
  };

  useEffect(() => {
    fetchWithFallback<Record<string, unknown>>(`/needs/${params.id}`, {}).then((raw) => {
      const mapped = mapApiNeed(raw);
      setNeed({ ...mapped, offers: (raw.offers as NeedOffer[]) ?? [] });
    });
  }, [params.id]);

  const offerHelp = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    setOffering(true);
    try {
      await authFetch('/auth/sync', { method: 'POST' });
      await authFetch(`/needs/${params.id}/offers`, {
        method: 'POST',
        body: JSON.stringify({ message: t('needs.offerMessage') }),
      });
      const refreshed = await authFetch<Record<string, unknown>>(`/needs/${params.id}`);
      setNeed({ ...mapApiNeed(refreshed), offers: (refreshed.offers as NeedOffer[]) ?? [] });
    } catch {
      alert(t('needs.offerError'));
    } finally {
      setOffering(false);
    }
  };

  if (!need) {
    return <p style={{ padding: 40, color: 'var(--lf-text-muted)' }}>{t('needs.loading')}</p>;
  }

  return (
    <>
      <section className="lf-page-hero">
        <div className="lf-page-hero-inner">
          <Link href="/needs" style={{ color: 'var(--lf-gold)', textDecoration: 'none', fontSize: '0.9rem' }}>
            {t('needs.detailBack')}
          </Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginTop: 16 }}>
            <AppIcon name="help-circle" size={36} color="var(--lf-gold)" />
            <div>
              <h1 className="lf-page-title" style={{ margin: 0 }}>{need.title}</h1>
              <p className="lf-page-sub" style={{ margin: '8px 0 0' }}>
                {typeLabel(need.type)} · {need.campName}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="lf-page-body" style={{ maxWidth: 720 }}>
        <Card padding="lg">
          <p style={{ lineHeight: 1.7, color: 'var(--lf-text-muted)', margin: '0 0 20px' }}>{need.description}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <Badge variant="success">{t('needs.offersCount', { count: need.offersCount })}</Badge>
            {need.status ? <Badge>{need.status}</Badge> : null}
          </div>
          <Button onClick={offerHelp} disabled={offering}>
            {offering ? t('needs.sending') : t('needs.offer')}
          </Button>
        </Card>

        {(need.offers ?? []).length > 0 && (
          <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('needs.receivedOffers')}</h2>
            {(need.offers ?? []).map((offer) => (
              <Card key={offer.id} padding="md">
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--lf-emerald)' }}>{offer.offerer.displayName}</p>
                <p style={{ margin: 0 }}>{offer.message}</p>
                {offer.priceEstimate != null && (
                  <p style={{ margin: '8px 0 0', fontWeight: 600, color: 'var(--lf-gold)' }}>
                    ~{Number(offer.priceEstimate).toLocaleString()} {t('common.currency')}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
